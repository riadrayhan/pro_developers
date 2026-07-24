# JobPortal Database Schema

## Overview

JobPortal uses PostgreSQL via Neon with the following database schema:

## Entity Relationship Diagram

```
┌─────────────┐         ┌───────────────┐         ┌──────────────┐
│    user     │◄───────►│ userProfiles  │◄───────►│ userProfiles │
│             │         │               │         │   (Admin)    │
├─────────────┤         ├───────────────┤         └──────────────┘
│ id (PK)     │         │ id (PK)       │
│ email       │         │ userId (FK)   │
│ emailVerif  │         │ role          │         ┌──────────────┐
│ name        │         │ status        │────────►│   adminQueue │
│ image       │         │ profileImage  │         ├──────────────┤
│ createdAt   │         │ skills        │         │ id (PK)      │
│ updatedAt   │         │ location      │         │ userId (FK)  │
└─────────────┘         │ hourlyRate    │         │ action       │
      │                 │ companyName   │         │ status       │
      │                 └───────────────┘         │ createdAt    │
      │                        │                  └──────────────┘
      │                        │
      ├───────────────────────┤
      │                       │
      ▼                       │
   ┌──────────────────┐       │
   │    session       │       │
   ├──────────────────┤       │
   │ id (PK)          │       │
   │ token            │       │
   │ userId (FK)      │       │
   │ expiresAt        │       │
   │ createdAt        │       │
   └──────────────────┘       │
                              │
      ┌───────────────────────┘
      │
      ▼
   ┌──────────────────┐
   │    account       │
   ├──────────────────┤
   │ id (PK)          │
   │ userId (FK)      │
   │ password         │
   │ createdAt        │
   └──────────────────┘
      │
      ▼
   ┌──────────────────┐
   │  verification    │
   ├──────────────────┤
   │ id (PK)          │
   │ identifier       │
   │ value            │
   │ expiresAt        │
   └──────────────────┘


   ┌──────────────┐            ┌────────────────────┐           ┌──────────────────┐
   │    jobs      │────────────►│ jobApplications    │◄──────────│      user        │
   ├──────────────┤            ├────────────────────┤           │  (Developer)     │
   │ id (PK)      │            │ id (PK)            │           └──────────────────┘
   │ clientId (FK)│            │ jobId (FK)         │
   │ title        │            │ developerId (FK)   │
   │ description  │            │ proposedBudget     │
   │ category     │            │ coverLetter        │
   │ budget       │            │ status             │
   │ status       │            │ createdAt          │
   │ deadline     │            └────────────────────┘
   │ skills       │
   │ createdAt    │
   └──────────────┘
```

## Table Definitions

### user (Better Auth)

```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  name TEXT,
  image TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "user"(email);
```

**Purpose**: Store user account information  
**Security**: Passwords are NOT stored here (stored in account table)

### session (Better Auth)

```sql
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  expiresAt TIMESTAMP NOT NULL,
  token TEXT UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_userId ON "session"(userId);
```

**Purpose**: Manage user sessions (login tokens)  
**Lifetime**: Tokens expire after configured duration

### account (Better Auth)

```sql
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TIMESTAMP,
  refreshTokenExpiresAt TIMESTAMP,
  scope TEXT,
  password TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_account_userId ON "account"(userId);
```

**Purpose**: Store authentication credentials (passwords are hashed)  
**Security**: Passwords are bcrypt-hashed

### verification (Better Auth)

```sql
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(identifier, value)
);
```

**Purpose**: Email verification tokens  
**Lifetime**: Tokens expire after 24 hours

---

## Application-Specific Tables

### userProfiles

```sql
CREATE TABLE "userProfiles" (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'developer', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  profileImage TEXT,
  nidImage TEXT,
  bio TEXT,
  skills TEXT,
  location TEXT,
  portfolio TEXT,
  hourlyRate DECIMAL(10, 2),
  jobTitle TEXT,
  companyName TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_userProfiles_userId ON "userProfiles"(userId);
CREATE INDEX idx_userProfiles_role ON "userProfiles"(role);
CREATE INDEX idx_userProfiles_status ON "userProfiles"(status);
```

**Purpose**: Extended user profile information  
**Roles**: 
- `client` - Businesses posting jobs
- `developer` - Professionals applying for jobs
- `admin` - Platform administrators

**Status**:
- `pending` - Awaiting admin approval
- `approved` - Account active
- `rejected` - Application rejected

**Field Notes**:
- `skills` - Stored as comma-separated string (JSON serializable)
- `hourlyRate` - Decimal for financial precision
- Images stored as file paths/URLs

### jobs

```sql
CREATE TABLE "jobs" (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  deadline TIMESTAMP,
  requiredSkills TEXT,
  experienceLevel TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_clientId ON "jobs"(clientId);
CREATE INDEX idx_jobs_status ON "jobs"(status);
```

**Purpose**: Job postings from clients  
**Status**:
- `open` - Accepting applications
- `in_progress` - Developer assigned, work ongoing
- `completed` - Job finished
- `cancelled` - Job cancelled

**Field Notes**:
- `requiredSkills` - Comma-separated string
- `experienceLevel` - beginner, intermediate, expert
- `budget` - Decimal for financial accuracy

### jobApplications

```sql
CREATE TABLE "jobApplications" (
  id TEXT PRIMARY KEY,
  jobId TEXT NOT NULL REFERENCES "jobs"(id) ON DELETE CASCADE,
  developerId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  proposedBudget DECIMAL(12, 2),
  coverLetter TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(jobId, developerId)
);

CREATE INDEX idx_jobApplications_jobId ON "jobApplications"(jobId);
CREATE INDEX idx_jobApplications_developerId ON "jobApplications"(developerId);
```

**Purpose**: Developer applications to jobs  
**Status**:
- `pending` - Awaiting client response
- `accepted` - Client accepted the proposal
- `rejected` - Client rejected the proposal
- `withdrawn` - Developer withdrew application

**Constraints**:
- UNIQUE constraint prevents duplicate applications from same developer to same job
- Both foreign keys have CASCADE delete for data consistency

### adminQueue

```sql
CREATE TABLE "adminQueue" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adminQueue_userId ON "adminQueue"(userId);
CREATE INDEX idx_adminQueue_status ON "adminQueue"(status);
```

**Purpose**: Track admin approval workflows  
**Status**:
- `pending` - Awaiting admin review
- `approved` - Admin approved
- `rejected` - Admin rejected with optional reason

**Field Notes**:
- `action` - Description of action (e.g., "User signup as developer")
- `reason` - Admin's reason for rejection

---

## Data Types

| Type | Example | Usage |
|------|---------|-------|
| TEXT | "email@example.com" | Strings, URLs, JSON |
| TIMESTAMP | 2024-07-23 10:30:00 | Dates and times |
| DECIMAL(12,2) | 5000.50 | Financial amounts |
| BOOLEAN | true/false | Yes/No values |

---

## Query Performance

### Frequently Used Queries

```sql
-- Get user profile with approval status
SELECT * FROM "userProfiles" 
WHERE userId = '...' AND status = 'approved';
-- Uses: idx_userProfiles_status, idx_userProfiles_userId

-- Get all jobs for client
SELECT * FROM jobs 
WHERE clientId = '...' AND status = 'open'
ORDER BY createdAt DESC;
-- Uses: idx_jobs_clientId, idx_jobs_status

-- Get applications for a job
SELECT * FROM "jobApplications"
WHERE jobId = '...'
ORDER BY createdAt DESC;
-- Uses: idx_jobApplications_jobId

-- Get pending approvals (admin)
SELECT * FROM "adminQueue"
WHERE status = 'pending'
ORDER BY createdAt ASC;
-- Uses: idx_adminQueue_status
```

---

## Constraints & Relationships

### Foreign Keys
- `session.userId` → `user.id` (DELETE CASCADE)
- `account.userId` → `user.id` (DELETE CASCADE)
- `userProfiles.userId` → `user.id` (DELETE CASCADE)
- `jobs.clientId` → `user.id` (DELETE CASCADE)
- `jobApplications.jobId` → `jobs.id` (DELETE CASCADE)
- `jobApplications.developerId` → `user.id` (DELETE CASCADE)
- `adminQueue.userId` → `user.id` (DELETE CASCADE)

### Unique Constraints
- `user.email` - Email addresses must be unique
- `verification.(identifier, value)` - Prevents duplicate tokens
- `jobApplications.(jobId, developerId)` - One application per developer per job

### Check Constraints
- Role values: client, developer, admin
- User status: pending, approved, rejected
- Job status: open, in_progress, completed, cancelled
- Application status: pending, accepted, rejected, withdrawn
- Admin queue status: pending, approved, rejected

---

## Backup & Recovery

### Daily Backup
- Neon automatically backs up database daily
- Access backups via Neon dashboard
- Retention: 7 days

### Manual Backup
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup
```bash
psql $DATABASE_URL < backup.sql
```

---

## Monitoring

### Table Sizes
```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

---

## Future Schema Enhancements

### Phase 3
```sql
-- Messages table for user-to-user communication
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  senderId TEXT NOT NULL,
  recipientId TEXT NOT NULL,
  jobId TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backup table for Google Sheets export
CREATE TABLE backup_exports (
  id TEXT PRIMARY KEY,
  dataType TEXT,
  driveFileId TEXT,
  exportedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 4
```sql
-- Reviews and ratings
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  fromUserId TEXT NOT NULL,
  toUserId TEXT NOT NULL,
  jobId TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 5
```sql
-- Payments and escrow
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  jobId TEXT NOT NULL,
  fromUserId TEXT NOT NULL,
  toUserId TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

**Last Updated**: July 23, 2026  
**Schema Version**: 1.0.0  
**Database**: PostgreSQL 14+ (Neon)
