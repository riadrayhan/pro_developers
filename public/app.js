// ==================== BACKEND API CONFIGURATION ====================
// Relative path: the API is served from the same Vercel deployment as this
// page (see vercel.json), so this works locally and once deployed alike.
const API_BASE = '/api';

// ==================== SESSION MANAGEMENT ====================
let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
let allJobs = []; // Cache for job search filtering

function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
    currentUser = null;
    allJobs = [];
    sessionStorage.removeItem('currentUser');
    togglePages('rolePage');
}

// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    const colors = {
        success: '#00A884',
        error: '#D63031',
        warning: '#D4A847',
        info: '#6C5CE7'
    };

    const toast = document.createElement('div');
    toast.className = `toast-custom ${type}`;
    toast.innerHTML = `
        <div class="toast-icon" style="color: ${colors[type] || colors.info}">
            <i class="bi ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-msg">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ==================== PASSWORD TOGGLE ====================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="bi bi-eye"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
    }
}

// ==================== PAGE NAVIGATION ====================
function togglePages(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

// ==================== ADMIN PANEL ACCESS FROM ICON ====================
function openAdminPanel() {
    const password = prompt('Enter Admin Password:');
    if (password === 'admin123') {
        setCurrentUser({ id: 'admin', role: 'admin', name: 'Administrator' });
        showToast('Welcome Admin!', 'success');
        renderAdminPanel();
        togglePages('adminPage');
    } else if (password !== null) {
        showToast('Invalid admin password!', 'error');
    }
}

function selectRole(role) {
    if (role === 'developer') {
        togglePages('devRegPage');
    } else {
        togglePages('clientRegPage');
    }
}

// ==================== FILE TO BASE64 CONVERSION ====================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==================== API HELPER ====================
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }
    
    return data;
}

// ==================== DEVELOPER REGISTRATION ====================
document.getElementById('devRegForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('devPassword').value;
    const confirmPassword = document.getElementById('devConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters long!', 'error');
        return;
    }

    try {
        const devImage = await fileToBase64(document.getElementById('devImage').files[0]);
        const devJobID = await fileToBase64(document.getElementById('devJobID').files[0]);
        const devNID = await fileToBase64(document.getElementById('devNID').files[0]);

        const developerData = {
            name: document.getElementById('devName').value,
            email: document.getElementById('devEmail').value,
            phone: document.getElementById('devPhone').value,
            password: password,
            confirmPassword: confirmPassword,
            image: devImage,
            jobID: devJobID,
            nid: devNID
        };

        const result = await apiRequest('/auth/register/developer', 'POST', developerData);
        
        showToast('Account created! Waiting for admin approval.', 'success');
        setCurrentUser(result.user);
        togglePages('waitingPage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== DEVELOPER LOGIN ====================
document.getElementById('devLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('devLoginPhone').value;
    const password = document.getElementById('devLoginPassword').value;

    try {
        // Check admin login first
        if (phone === 'admin' && password === 'admin123') {
            setCurrentUser({ id: 'admin', role: 'admin', name: 'Administrator' });
            showToast('Welcome Admin!', 'success');
            await renderAdminPanel();
            togglePages('adminPage');
            return;
        }

        const result = await apiRequest('/auth/login', 'POST', { phone, password, role: 'developer' });
        
        setCurrentUser(result.user);
        showToast(`Welcome back, ${result.user.name}!`, 'success');
        await renderJobFeed();
        togglePages('devHomePage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== CLIENT REGISTRATION ====================
document.getElementById('clientRegForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('clientPassword').value;
    const confirmPassword = document.getElementById('clientConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters long!', 'error');
        return;
    }

    try {
        const clientImage = await fileToBase64(document.getElementById('clientImage').files[0]);

        const clientData = {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            password: password,
            confirmPassword: confirmPassword,
            image: clientImage
        };

        const result = await apiRequest('/auth/register/client', 'POST', clientData);
        
        showToast('Account created! Waiting for admin approval.', 'success');
        setCurrentUser(result.user);
        togglePages('waitingPage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== CLIENT LOGIN ====================
document.getElementById('clientLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('clientLoginPhone').value;
    const password = document.getElementById('clientLoginPassword').value;

    try {
        const result = await apiRequest('/auth/login', 'POST', { phone, password, role: 'client' });
        
        setCurrentUser(result.user);
        showToast(`Welcome back, ${result.user.name}!`, 'success');
        await renderClientJobs();
        togglePages('clientHomePage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== POST JOB ====================
document.getElementById('postJobForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const jobData = {
            clientId: currentUser.id,
            clientName: currentUser.name,
            clientImage: currentUser.image,
            title: document.getElementById('jobTitle').value,
            details: document.getElementById('jobDetails').value,
            phone: document.getElementById('jobPhone').value,
            budget: parseFloat(document.getElementById('jobBudget').value),
            duration: document.getElementById('jobDuration').value || 'Not specified'
        };

        const result = await apiRequest('/jobs', 'POST', jobData);

        showToast('Job posted! Waiting for admin approval. 🕐', 'success');
        document.getElementById('postJobForm').reset();
        await renderClientJobs();
        togglePages('clientHomePage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== RENDER JOB FEED (DEVELOPER) ====================
async function renderJobFeed() {
    const feedDiv = document.getElementById('jobFeed');
    feedDiv.innerHTML = '<div class="loading-spinner"><div class="spinner-custom"></div></div>';

    try {
        const result = await apiRequest('/jobs');
        allJobs = result.jobs || [];

        feedDiv.innerHTML = '';

        if (allJobs.length === 0) {
            feedDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--gray-500);">
                    <i class="bi bi-briefcase" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px;">No jobs available yet.</p>
                </div>
            `;
            return;
        }

        displayJobs(allJobs);
    } catch (error) {
        feedDiv.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <i class="bi bi-wifi-off" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                <p style="font-size: 16px;">Failed to load jobs. Is the server running?</p>
                <button class="btn-secondary-custom btn-small mt-3" onclick="renderJobFeed()">Retry</button>
            </div>
        `;
    }
}

// ==================== DISPLAY JOBS ====================
async function displayJobs(jobs) {
    const feedDiv = document.getElementById('jobFeed');
    feedDiv.innerHTML = '';

    for (const job of jobs) {
        let isLiked = false;
        try {
            const likeResult = await apiRequest(`/jobs/liked/${job.id}/${currentUser.id}`);
            isLiked = likeResult.liked;
        } catch (e) {
            // If error fetching like status, assume not liked
        }

        const likeCount = job.likes || 0;
        const detailsPreview = (job.details || '').substring(0, 120);

        const jobHTML = `
            <div class="job-card">
                <div class="job-header">
                    <div>
                        <h4 class="job-title">${escapeHtml(job.title)}</h4>
                        <div class="job-client">
                            <img src="${escapeHtml(job.clientImage || '/placeholder.jpg')}" onerror="this.src='/placeholder.jpg'" />
                            <span>${escapeHtml(job.clientName)}</span>
                        </div>
                    </div>
                </div>
                <p class="job-detail">${escapeHtml(detailsPreview)}${job.details.length > 120 ? '...' : ''}</p>
                <div class="job-tags">
                    <span class="job-tag budget"><i class="bi bi-currency-dollar"></i> ${escapeHtml(formatBudget(job.budget))}</span>
                    <span class="job-tag duration"><i class="bi bi-clock"></i> ${escapeHtml(job.duration)}</span>
                    <span class="job-tag phone"><i class="bi bi-whatsapp"></i> ${escapeHtml(job.phone)}</span>
                </div>
                <div class="job-actions">
                    <button class="love-btn ${isLiked ? 'loved' : ''}" onclick="toggleLike('${job.id}')">
                        <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                        <span class="count">${likeCount}</span> ${likeCount === 1 ? 'Interest' : 'Interests'}
                    </button>
                </div>
            </div>
        `;
        feedDiv.innerHTML += jobHTML;
    }
}

// ==================== JOB SEARCH FILTER ====================
function filterJobs(query) {
    if (!allJobs || allJobs.length === 0) return;
    
    const q = query.toLowerCase().trim();
    if (!q) {
        displayJobs(allJobs);
        return;
    }

    const filtered = allJobs.filter(job => 
        job.title.toLowerCase().includes(q) ||
        job.details.toLowerCase().includes(q) ||
        job.clientName.toLowerCase().includes(q) ||
        job.phone.includes(q) ||
        job.duration.toLowerCase().includes(q)
    );

    const feedDiv = document.getElementById('jobFeed');
    if (filtered.length === 0) {
        feedDiv.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
                <i class="bi bi-search" style="font-size: 36px; display: block; margin-bottom: 12px;"></i>
                <p>No jobs match "${escapeHtml(query)}"</p>
            </div>
        `;
    } else {
        displayJobs(filtered);
    }
}

// ==================== RENDER CLIENT JOBS ====================
async function renderClientJobs() {
    const feedDiv = document.getElementById('clientJobFeed');
    feedDiv.innerHTML = '<div class="loading-spinner"><div class="spinner-custom"></div></div>';

    try {
        const result = await apiRequest(`/jobs/client/${currentUser.id}`);
        const jobs = result.jobs || [];

        feedDiv.innerHTML = '';

        if (jobs.length === 0) {
            feedDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--gray-500);">
                    <i class="bi bi-file-earmark-plus" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px;">You haven\'t posted any jobs yet.</p>
                    <button class="btn-primary-custom btn-small mt-3" style="width: auto;" onclick="togglePages('postJobPage')">
                        <i class="bi bi-plus-circle"></i> Post Your First Job
                    </button>
                </div>
            `;
            return;
        }

        jobs.forEach(job => {
            const likeCount = job.likes || 0;
            const detailsPreview = (job.details || '').substring(0, 120);
            const status = job.status || 'pending';
            const statusIcon = status === 'approved' ? 'bi-check-circle' : status === 'rejected' ? 'bi-x-circle' : 'bi-hourglass';

            const jobHTML = `
                <div class="job-card">
                    <div class="job-header">
                        <h4 class="job-title">${escapeHtml(job.title)}</h4>
                        <span class="badge-status ${status}"><i class="bi ${statusIcon}"></i> ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </div>
                    <p class="job-detail">${escapeHtml(detailsPreview)}${job.details.length > 120 ? '...' : ''}</p>
                    <div class="job-tags">
                        <span class="job-tag budget"><i class="bi bi-currency-dollar"></i> ${escapeHtml(formatBudget(job.budget))}</span>
                        <span class="job-tag duration"><i class="bi bi-clock"></i> ${escapeHtml(job.duration)}</span>
                        <span class="job-tag phone"><i class="bi bi-whatsapp"></i> ${escapeHtml(job.phone)}</span>
                    </div>
                    <div class="job-actions">
                        <button class="love-btn" disabled style="cursor: default; background: var(--gray-100); border-color: var(--gray-200); color: var(--gray-600);">
                            <i class="bi bi-heart"></i> ${likeCount} ${likeCount === 1 ? 'Interest' : 'Interests'}
                        </button>
                    </div>
                </div>
            `;
            feedDiv.innerHTML += jobHTML;
        });
    } catch (error) {
        feedDiv.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <i class="bi bi-exclamation-triangle" style="font-size: 36px; display: block; margin-bottom: 12px;"></i>
                <p>Failed to load jobs.</p>
            </div>
        `;
    }
}

// ==================== CLIENT: BROWSE ALL APPROVED JOBS ====================
function switchClientTab(tab) {
    const mineBtn = document.getElementById('clientTabMine');
    const allBtn = document.getElementById('clientTabAll');
    const mineFeed = document.getElementById('clientJobFeed');
    const allFeed = document.getElementById('clientBrowseFeed');

    if (tab === 'all') {
        mineBtn.classList.remove('active');
        allBtn.classList.add('active');
        mineFeed.style.display = 'none';
        allFeed.style.display = 'block';
        renderClientBrowseFeed();
    } else {
        allBtn.classList.remove('active');
        mineBtn.classList.add('active');
        allFeed.style.display = 'none';
        mineFeed.style.display = 'block';
    }
}

async function renderClientBrowseFeed() {
    const feedDiv = document.getElementById('clientBrowseFeed');
    feedDiv.innerHTML = '<div class="loading-spinner"><div class="spinner-custom"></div></div>';

    try {
        const result = await apiRequest('/jobs');
        const jobs = result.jobs || [];

        if (jobs.length === 0) {
            feedDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--gray-500);">
                    <i class="bi bi-briefcase" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px;">No approved jobs yet.</p>
                </div>
            `;
            return;
        }

        feedDiv.innerHTML = jobs.map(job => {
            const likeCount = job.likes || 0;
            const detailsPreview = (job.details || '').substring(0, 120);
            return `
                <div class="job-card">
                    <div class="job-header">
                        <div>
                            <h4 class="job-title">${escapeHtml(job.title)}</h4>
                            <div class="job-client">
                                <img src="${escapeHtml(job.clientImage || '/placeholder.jpg')}" onerror="this.src='/placeholder.jpg'" />
                                <span>${escapeHtml(job.clientName)}</span>
                            </div>
                        </div>
                    </div>
                    <p class="job-detail">${escapeHtml(detailsPreview)}${job.details.length > 120 ? '...' : ''}</p>
                    <div class="job-tags">
                        <span class="job-tag budget"><i class="bi bi-currency-dollar"></i> ${escapeHtml(formatBudget(job.budget))}</span>
                        <span class="job-tag duration"><i class="bi bi-clock"></i> ${escapeHtml(job.duration)}</span>
                        <span class="job-tag phone"><i class="bi bi-whatsapp"></i> ${escapeHtml(job.phone)}</span>
                    </div>
                    <div class="job-actions">
                        <button class="love-btn" disabled style="cursor: default; background: var(--gray-100); border-color: var(--gray-200); color: var(--gray-600);">
                            <i class="bi bi-heart"></i> ${likeCount} ${likeCount === 1 ? 'Interest' : 'Interests'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        feedDiv.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <i class="bi bi-wifi-off" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                <p style="font-size: 16px;">Failed to load jobs. Is the server running?</p>
                <button class="btn-secondary-custom btn-small mt-3" onclick="renderClientBrowseFeed()">Retry</button>
            </div>
        `;
    }
}

// ==================== LIKE TOGGLE ====================
async function toggleLike(jobId) {
    try {
        const result = await apiRequest('/jobs/like', 'POST', {
            jobId: jobId,
            userId: currentUser.id
        });
        if (result.liked) {
            showToast('Added to your interests! ❤️', 'info');
        } else {
            showToast('Removed from interests', 'warning');
        }
        // Refresh display from cache if possible
        if (document.getElementById('searchJobs')?.value) {
            filterJobs(document.getElementById('searchJobs').value);
        } else {
            await renderJobFeed();
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==================== FORGOT PASSWORD ====================
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('forgotEmail').value;

    try {
        const result = await apiRequest('/auth/forgot-password', 'POST', { email });
        
        showToast(`Reset code sent to ${email}!`, 'success');
        sessionStorage.setItem('resetEmail', email);
        document.getElementById('resetEmail').value = email;
        
        togglePages('resetPasswordPage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== RESET PASSWORD ====================
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value;
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;

    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters long!', 'error');
        return;
    }

    try {
        const result = await apiRequest('/auth/reset-password', 'POST', {
            email,
            code,
            newPassword,
            confirmPassword
        });

        showToast('Password reset successfully! You can now login.', 'success');
        document.getElementById('resetPasswordForm').reset();
        togglePages('rolePage');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// ==================== ADMIN PANEL ====================
async function renderAdminPanel() {
    // Render stats
    try {
        const statsResult = await apiRequest('/admin/stats');
        renderAdminStats(statsResult.stats);
    } catch (e) {
        document.getElementById('adminStats').innerHTML = '';
    }

    // Render pending job posts
    await renderAdminJobPanel();

    // Render approvals
    const adminDiv = document.getElementById('adminPanel');
    adminDiv.innerHTML = '<div class="loading-spinner"><div class="spinner-custom"></div></div>';

    try {
        const result = await apiRequest('/admin/approvals');
        const approvals = result.approvals || [];

        adminDiv.innerHTML = '';

        if (approvals.length === 0) {
            adminDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
                    <i class="bi bi-check-all" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px;">No pending approvals. All caught up! 🎉</p>
                </div>
            `;
            return;
        }

        approvals.forEach(item => {
            const user = item.user;
            const approval = item.approval;

            const adminCardHTML = `
                <div class="admin-user-card">
                    <img src="${user.image || '/placeholder.jpg'}" class="avatar" onerror="this.src='/placeholder.jpg'" />
                    <div class="user-info">
                        <h6>${escapeHtml(user.name)}</h6>
                        <p>
                            <strong>${approval.type === 'developer' ? '👨‍💻 Developer' : '🏢 Client'}</strong> 
                            &middot; ${escapeHtml(user.email)} 
                            &middot; 📞 ${escapeHtml(user.phone)}
                            ${user.jobID ? '&middot; 📎 ID Card uploaded' : ''}
                            ${user.nid ? '&middot; 🆔 NID uploaded' : ''}
                        </p>
                    </div>
                    <span class="badge-status pending"><i class="bi bi-hourglass"></i> Pending</span>
                    <div class="actions" style="display: flex; gap: 8px;">
                        <button class="btn-success-custom btn-small" onclick="approveUser('${user.id}', '${approval.type}')">
                            <i class="bi bi-check-lg"></i> Approve
                        </button>
                        <button class="btn-danger-custom btn-small" onclick="rejectUser('${user.id}', '${approval.type}')">
                            <i class="bi bi-x-lg"></i> Reject
                        </button>
                    </div>
                </div>
            `;
            adminDiv.innerHTML += adminCardHTML;
        });
    } catch (error) {
        adminDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <p>Failed to load approvals.</p>
            </div>
        `;
    }
}

// ==================== ADMIN STATS ====================
function renderAdminStats(stats) {
    const statsDiv = document.getElementById('adminStats');
    if (!stats) {
        statsDiv.innerHTML = '';
        return;
    }

    statsDiv.innerHTML = `
        <div class="admin-stat-card">
            <div class="stat-icon" style="color: var(--primary);">👨‍💻</div>
            <div class="stat-number">${stats.totalDevelopers}</div>
            <div class="stat-label">Total Developers (${stats.approvedDevelopers} approved)</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-icon" style="color: var(--secondary);">🏢</div>
            <div class="stat-number">${stats.totalClients}</div>
            <div class="stat-label">Total Clients (${stats.approvedClients} approved)</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-icon" style="color: var(--accent);">💼</div>
            <div class="stat-number">${stats.totalJobs}</div>
            <div class="stat-label">Total Jobs Posted</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-icon" style="color: var(--warning);">⏳</div>
            <div class="stat-number">${stats.pendingApprovals}</div>
            <div class="stat-label">Pending Account Approvals</div>
        </div>
        <div class="admin-stat-card">
            <div class="stat-icon" style="color: var(--warning);">🕐</div>
            <div class="stat-number">${stats.pendingJobApprovals ?? 0}</div>
            <div class="stat-label">Pending Job Posts</div>
        </div>
    `;
}

// ==================== ADMIN: PENDING JOB POSTS ====================
async function renderAdminJobPanel() {
    const jobDiv = document.getElementById('adminJobPanel');
    jobDiv.innerHTML = '<div class="loading-spinner"><div class="spinner-custom"></div></div>';

    try {
        const result = await apiRequest('/jobs/pending');
        const jobs = result.jobs || [];

        if (jobs.length === 0) {
            jobDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--gray-500);">
                    <i class="bi bi-check-all" style="font-size: 48px; display: block; margin-bottom: 16px;"></i>
                    <p style="font-size: 16px;">No pending job posts. All caught up! 🎉</p>
                </div>
            `;
            return;
        }

        jobDiv.innerHTML = jobs.map(job => `
            <div class="admin-user-card">
                <img src="${job.clientImage || '/placeholder.jpg'}" class="avatar" onerror="this.src='/placeholder.jpg'" />
                <div class="user-info">
                    <h6>${escapeHtml(job.title)}</h6>
                    <p>
                        <strong>🏢 ${escapeHtml(job.clientName)}</strong>
                        &middot; ${escapeHtml(formatBudget(job.budget))}
                        &middot; ${escapeHtml(job.duration)}
                        &middot; 📞 ${escapeHtml(job.phone)}
                    </p>
                </div>
                <span class="badge-status pending"><i class="bi bi-hourglass"></i> Pending</span>
                <div class="actions" style="display: flex; gap: 8px;">
                    <button class="btn-success-custom btn-small" onclick="approveJob('${job.id}')">
                        <i class="bi bi-check-lg"></i> Approve
                    </button>
                    <button class="btn-danger-custom btn-small" onclick="rejectJob('${job.id}')">
                        <i class="bi bi-x-lg"></i> Reject
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        jobDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <p>Failed to load pending job posts.</p>
            </div>
        `;
    }
}

async function approveJob(jobId) {
    try {
        await apiRequest(`/jobs/approve/${jobId}`, 'POST');
        showToast('Job approved! Now visible to everyone. ✅', 'success');
        await renderAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function rejectJob(jobId) {
    try {
        await apiRequest(`/jobs/reject/${jobId}`, 'POST');
        showToast('Job rejected.', 'warning');
        await renderAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==================== APPROVE USER ====================
async function approveUser(userId, type) {
    try {
        const result = await apiRequest(`/admin/approve/${userId}`, 'POST', { type });
        showToast(`${type === 'developer' ? 'Developer' : 'Client'} approved successfully! ✅`, 'success');
        await renderAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==================== DOWNLOAD EXCEL ====================
function downloadExcel() {
    showToast('Generating Excel file...', 'info');
    const link = document.createElement('a');
    link.href = `${API_BASE}/admin/export-excel`;
    link.download = `JobPortal_Data.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Excel file downloaded successfully! 📊', 'success');
}

// ==================== REJECT USER ====================
async function rejectUser(userId, type) {
    try {
        const result = await apiRequest(`/admin/reject/${userId}`, 'POST', { type });
        showToast(`User rejected and removed`, 'warning');
        await renderAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==================== HELPERS ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatBudget(budget) {
    const num = parseFloat(budget);
    if (isNaN(num)) return budget;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
}

// ==================== AUTO-LOGIN CHECK ====================
window.addEventListener('load', async () => {
    if (currentUser) {
        if (currentUser.role === 'developer') {
            await renderJobFeed();
            togglePages('devHomePage');
            showToast(`Welcome back, ${currentUser.name}!`, 'success');
        } else if (currentUser.role === 'client') {
            await renderClientJobs();
            togglePages('clientHomePage');
            showToast(`Welcome back, ${currentUser.name}!`, 'success');
        } else if (currentUser.role === 'admin') {
            await renderAdminPanel();
            togglePages('adminPage');
            showToast('Welcome back, Admin!', 'success');
        }
    }
});

// ==================== ADMIN LOGIN ====================
// Admin access via devLoginForm - "admin" + "admin123" triggers admin panel
// The admin check is done in the dev login handler above