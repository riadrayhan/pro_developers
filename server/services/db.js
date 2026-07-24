const { neon } = require('@neondatabase/serverless');

const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
    throw new Error('DATABASE_URL (or POSTGRES_URL) is not set — cannot connect to Postgres');
}

// HTTP-based driver: works from serverless functions (Vercel) and from
// sandboxed/local networks that don't allow raw TCP to port 5432, unlike
// the traditional `pg` driver.
const sql = neon(connectionString);

const CREATE_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS developers (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        image TEXT,
        job_id_card TEXT,
        nid TEXT,
        approved BOOLEAN NOT NULL DEFAULT false,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        image TEXT,
        approved BOOLEAN NOT NULL DEFAULT false,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        client_id UUID NOT NULL,
        client_name TEXT,
        client_image TEXT,
        title TEXT NOT NULL,
        details TEXT NOT NULL,
        phone TEXT NOT NULL,
        budget NUMERIC NOT NULL,
        duration TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        approved_at TIMESTAMPTZ
    )`,
    `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`,
    `CREATE TABLE IF NOT EXISTS likes (
        job_id UUID NOT NULL,
        user_id UUID NOT NULL,
        liked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (job_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS approvals (
        id UUID PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS reset_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    // Jobs already approved before the approved_at column existed get a
    // fresh 7-day window starting now, instead of expiring immediately or
    // never expiring.
    `UPDATE jobs SET approved_at = now() WHERE status = 'approved' AND approved_at IS NULL`,
];

// The HTTP driver occasionally hits a transient connect timeout to Neon;
// retry a couple of times before giving up rather than failing the request.
async function execute(text, params, attempts = 3) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            return await sql.query(text, params);
        } catch (err) {
            lastErr = err;
            if (i < attempts - 1) {
                await new Promise(r => setTimeout(r, 200 * (i + 1)));
            }
        }
    }
    throw lastErr;
}

let schemaReady = null;
function ensureSchema() {
    if (!schemaReady) {
        schemaReady = (async () => {
            for (const statement of CREATE_STATEMENTS) {
                await execute(statement, []);
            }
            return true;
        })();
    }
    return schemaReady;
}

async function query(text, params = []) {
    await ensureSchema();
    const rows = await execute(text, params);
    return { rows };
}

// Postgres timestamptz columns come back as JS Date objects; normalize to
// ISO strings so JSON responses and the Excel export render readable text
// instead of raw Excel date-serial numbers.
function toISO(value) {
    return value instanceof Date ? value.toISOString() : value;
}

// ==================== DEVELOPERS ====================
async function getAllDevelopers() {
    const { rows } = await query('SELECT * FROM developers ORDER BY registered_at DESC');
    return rows.map(mapDeveloper);
}

async function findDeveloperByPhoneOrEmail(phone, email) {
    const { rows } = await query('SELECT * FROM developers WHERE phone = $1 OR email = $2 LIMIT 1', [phone, email]);
    return rows[0] ? mapDeveloper(rows[0]) : null;
}

async function findDeveloperByPhone(phone) {
    const { rows } = await query('SELECT * FROM developers WHERE phone = $1 LIMIT 1', [phone]);
    return rows[0] ? mapDeveloper(rows[0]) : null;
}

async function findDeveloperByEmail(email) {
    const { rows } = await query('SELECT * FROM developers WHERE email = $1 LIMIT 1', [email]);
    return rows[0] ? mapDeveloper(rows[0]) : null;
}

async function findDeveloperById(id) {
    const { rows } = await query('SELECT * FROM developers WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ? mapDeveloper(rows[0]) : null;
}

async function insertDeveloper(dev) {
    await query(
        `INSERT INTO developers (id, name, email, phone, password, image, job_id_card, nid, approved, registered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [dev.id, dev.name, dev.email, dev.phone, dev.password, dev.image, dev.jobID, dev.nid, dev.approved, dev.registeredAt]
    );
}

async function approveDeveloper(id) {
    const { rows } = await query('UPDATE developers SET approved = true WHERE id = $1 RETURNING *', [id]);
    return rows[0] ? mapDeveloper(rows[0]) : null;
}

async function rejectDeveloper(id) {
    const { rows } = await query('DELETE FROM developers WHERE id = $1 RETURNING *', [id]);
    return rows[0] ? mapDeveloper(rows[0]) : null;
}

async function updateDeveloperPassword(email, hashedPassword) {
    await query('UPDATE developers SET password = $1 WHERE email = $2', [hashedPassword, email]);
}

function mapDeveloper(row) {
    return {
        id: row.id,
        role: 'developer',
        name: row.name,
        email: row.email,
        phone: row.phone,
        password: row.password,
        image: row.image,
        jobID: row.job_id_card,
        nid: row.nid,
        approved: row.approved,
        registeredAt: toISO(row.registered_at),
    };
}

// ==================== CLIENTS ====================
async function getAllClients() {
    const { rows } = await query('SELECT * FROM clients ORDER BY registered_at DESC');
    return rows.map(mapClient);
}

async function findClientByPhoneOrEmail(phone, email) {
    const { rows } = await query('SELECT * FROM clients WHERE phone = $1 OR email = $2 LIMIT 1', [phone, email]);
    return rows[0] ? mapClient(rows[0]) : null;
}

async function findClientByPhone(phone) {
    const { rows } = await query('SELECT * FROM clients WHERE phone = $1 LIMIT 1', [phone]);
    return rows[0] ? mapClient(rows[0]) : null;
}

async function findClientByEmail(email) {
    const { rows } = await query('SELECT * FROM clients WHERE email = $1 LIMIT 1', [email]);
    return rows[0] ? mapClient(rows[0]) : null;
}

async function findClientById(id) {
    const { rows } = await query('SELECT * FROM clients WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ? mapClient(rows[0]) : null;
}

async function insertClient(client) {
    await query(
        `INSERT INTO clients (id, name, email, phone, password, image, approved, registered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [client.id, client.name, client.email, client.phone, client.password, client.image, client.approved, client.registeredAt]
    );
}

async function approveClient(id) {
    const { rows } = await query('UPDATE clients SET approved = true WHERE id = $1 RETURNING *', [id]);
    return rows[0] ? mapClient(rows[0]) : null;
}

async function rejectClient(id) {
    const { rows } = await query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    return rows[0] ? mapClient(rows[0]) : null;
}

async function updateClientPassword(email, hashedPassword) {
    await query('UPDATE clients SET password = $1 WHERE email = $2', [hashedPassword, email]);
}

function mapClient(row) {
    return {
        id: row.id,
        role: 'client',
        name: row.name,
        email: row.email,
        phone: row.phone,
        password: row.password,
        image: row.image,
        approved: row.approved,
        registeredAt: toISO(row.registered_at),
    };
}

// ==================== JOBS ====================
const JOB_EXPIRY_DAYS = 7;

// Approved posts auto-expire JOB_EXPIRY_DAYS after approval. Cheap to run on
// every read of approved jobs rather than needing separate cron infra.
async function deleteExpiredApprovedJobs() {
    await query(
        `DELETE FROM jobs WHERE status = 'approved' AND approved_at < now() - ($1::numeric * interval '1 day')`,
        [JOB_EXPIRY_DAYS]
    );
}

async function getApprovedJobs() {
    await deleteExpiredApprovedJobs();
    const { rows } = await query("SELECT * FROM jobs WHERE status = 'approved' ORDER BY posted_at DESC");
    return rows.map(mapJob);
}

async function getPendingJobs() {
    const { rows } = await query("SELECT * FROM jobs WHERE status = 'pending' ORDER BY posted_at ASC");
    return rows.map(mapJob);
}

async function getClientJobs(clientId) {
    await deleteExpiredApprovedJobs();
    const { rows } = await query('SELECT * FROM jobs WHERE client_id = $1 ORDER BY posted_at DESC', [clientId]);
    return rows.map(mapJob);
}

async function getAllJobs() {
    await deleteExpiredApprovedJobs();
    const { rows } = await query('SELECT * FROM jobs ORDER BY posted_at DESC');
    return rows.map(mapJob);
}

async function insertJob(job) {
    await query(
        `INSERT INTO jobs (id, client_id, client_name, client_image, title, details, phone, budget, duration, status, posted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [job.id, job.clientId, job.clientName, job.clientImage, job.title, job.details, job.phone, job.budget, job.duration, job.status, job.postedAt]
    );
}

async function approveJob(id) {
    const { rows } = await query("UPDATE jobs SET status = 'approved', approved_at = now() WHERE id = $1 RETURNING *", [id]);
    return rows[0] ? mapJob(rows[0]) : null;
}

async function rejectJob(id) {
    const { rows } = await query("UPDATE jobs SET status = 'rejected' WHERE id = $1 RETURNING *", [id]);
    return rows[0] ? mapJob(rows[0]) : null;
}

async function deleteJob(id, clientId) {
    const { rows } = await query('DELETE FROM jobs WHERE id = $1 AND client_id = $2 RETURNING *', [id, clientId]);
    return rows[0] ? mapJob(rows[0]) : null;
}

// Admin override: delete any job regardless of owner (e.g. a live/approved post).
async function deleteJobByIdAdmin(id) {
    const { rows } = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);
    return rows[0] ? mapJob(rows[0]) : null;
}

function mapJob(row) {
    return {
        id: row.id,
        clientId: row.client_id,
        clientName: row.client_name,
        clientImage: row.client_image,
        title: row.title,
        details: row.details,
        phone: row.phone,
        budget: Number(row.budget),
        duration: row.duration,
        status: row.status,
        postedAt: toISO(row.posted_at),
        approvedAt: toISO(row.approved_at),
    };
}

// ==================== LIKES ====================
async function getAllLikes() {
    const { rows } = await query('SELECT * FROM likes');
    return rows.map(r => ({ jobId: r.job_id, userId: r.user_id, likedAt: toISO(r.liked_at) }));
}

async function countLikesForJob(jobId) {
    const { rows } = await query('SELECT COUNT(*)::int AS count FROM likes WHERE job_id = $1', [jobId]);
    return rows[0].count;
}

async function countLikesByJob() {
    const { rows } = await query('SELECT job_id, COUNT(*)::int AS count FROM likes GROUP BY job_id');
    const map = {};
    rows.forEach(r => { map[r.job_id] = r.count; });
    return map;
}

async function isLiked(jobId, userId) {
    const { rows } = await query('SELECT 1 FROM likes WHERE job_id = $1 AND user_id = $2', [jobId, userId]);
    return rows.length > 0;
}

async function toggleLike(jobId, userId) {
    const already = await isLiked(jobId, userId);
    if (already) {
        await query('DELETE FROM likes WHERE job_id = $1 AND user_id = $2', [jobId, userId]);
    } else {
        await query('INSERT INTO likes (job_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [jobId, userId]);
    }
    const count = await countLikesForJob(jobId);
    return { liked: !already, likes: count };
}

// ==================== APPROVALS ====================
async function getAllApprovals() {
    const { rows } = await query('SELECT * FROM approvals ORDER BY created_at DESC');
    return rows.map(mapApproval);
}

async function getPendingApprovalRows() {
    const { rows } = await query("SELECT * FROM approvals WHERE status = 'pending' ORDER BY created_at ASC");
    return rows.map(mapApproval);
}

async function addApproval(approval) {
    await query(
        `INSERT INTO approvals (id, type, name, email, phone, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [approval.id, approval.type, approval.name, approval.email, approval.phone, approval.status, approval.createdAt]
    );
}

async function setApprovalStatus(id, status) {
    await query('UPDATE approvals SET status = $1 WHERE id = $2', [status, id]);
}

function mapApproval(row) {
    return {
        id: row.id,
        type: row.type,
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        createdAt: toISO(row.created_at),
    };
}

// ==================== RESET CODES ====================
async function addResetCode(entry) {
    await query(
        `INSERT INTO reset_codes (email, code, expires_at, used, created_at) VALUES ($1,$2,$3,$4,$5)`,
        [entry.email, entry.code, entry.expiresAt, entry.used, entry.createdAt]
    );
}

async function findValidResetCode(email, code) {
    const { rows } = await query(
        'SELECT * FROM reset_codes WHERE email = $1 AND code = $2 AND used = false ORDER BY created_at DESC LIMIT 1',
        [email, code]
    );
    return rows[0] ? { id: rows[0].id, email: rows[0].email, code: rows[0].code, expiresAt: toISO(rows[0].expires_at), used: rows[0].used } : null;
}

async function markResetCodeUsed(id) {
    await query('UPDATE reset_codes SET used = true WHERE id = $1', [id]);
}

module.exports = {
    ensureSchema,
    // developers
    getAllDevelopers, findDeveloperByPhoneOrEmail, findDeveloperByPhone, findDeveloperByEmail,
    findDeveloperById, insertDeveloper, approveDeveloper, rejectDeveloper, updateDeveloperPassword,
    // clients
    getAllClients, findClientByPhoneOrEmail, findClientByPhone, findClientByEmail,
    findClientById, insertClient, approveClient, rejectClient, updateClientPassword,
    // jobs
    getApprovedJobs, getPendingJobs, getClientJobs, getAllJobs, insertJob, approveJob, rejectJob, deleteJob, deleteJobByIdAdmin,
    // likes
    getAllLikes, countLikesForJob, countLikesByJob, isLiked, toggleLike,
    // approvals
    getAllApprovals, getPendingApprovalRows, addApproval, setApprovalStatus,
    // reset codes
    addResetCode, findValidResetCode, markResetCodeUsed,
};
