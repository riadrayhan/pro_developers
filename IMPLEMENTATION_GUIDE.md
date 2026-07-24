# JobPortal Implementation Guide

This guide provides step-by-step instructions for implementing the remaining features of JobPortal.

## Phase 3: Google Drive & Email Integration

### 3.1 Google Drive Integration Setup

#### Prerequisites
- Google Cloud Project created
- Google Drive API enabled
- OAuth 2.0 credentials (Client ID and Secret)
- Google Service Account key (for server-side operations)

#### Implementation Steps

1. **Install Google Libraries**
```bash
pnpm add @google-cloud/drive google-auth-library googleapis
```

2. **Create Google Drive Service**
```typescript
// lib/google-drive.ts
import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  scopes: ['https://www.googleapis.com/auth/drive'],
})

export const drive = google.drive({ version: 'v3', auth })
```

3. **Create File Upload Action**
```typescript
// app/actions/drive.ts
export async function uploadFileToGoogleDrive(
  file: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
) {
  // Upload to specific folder (e.g., user profiles, jobs, applications)
  // Return Google Drive file ID for reference
}
```

4. **Create Folder Structure**
```
JobPortal/
├── User Profiles/
│   └── [userId]/
│       ├── profile-image.jpg
│       └── nid-image.jpg
├── Jobs/
│   └── [clientId]/
│       └── [jobId]/
│           └── attachments/
└── Applications/
    └── [applicationId]/
        └── portfolio-files/
```

### 3.2 Google Sheets Integration

1. **Create Backup Sheets**
```typescript
// Create three sheets in Google Drive
// 1. Users Sheet - tracks all signups
// 2. Jobs Sheet - tracks all job postings
// 3. Applications Sheet - tracks all applications
```

2. **Sync Data to Sheets**
```typescript
// app/actions/sheets.ts
export async function syncUsersToSheets() {
  // Fetch all approved users
  // Append to Google Sheet
}

export async function syncJobsToSheets() {
  // Fetch all jobs
  // Append to Google Sheet
}
```

### 3.3 Gmail/SMTP Email Integration

#### Setup for Gmail

1. **Enable Gmail API**
```bash
pnpm add nodemailer @types/nodemailer
```

2. **Create Email Service**
```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  return transporter.sendMail({
    from: process.env.GMAIL_EMAIL,
    to,
    subject,
    html,
  })
}
```

3. **Create Email Templates**

**Approval Email**
```typescript
// lib/email-templates/approval.ts
export const approvalEmail = (userName: string) => ({
  subject: 'Your JobPortal Account Has Been Approved',
  html: `
    <h1>Welcome to JobPortal, ${userName}!</h1>
    <p>Your account has been approved and is ready to use.</p>
    <a href="${process.env.BETTER_AUTH_URL}/dashboard">Go to Dashboard</a>
  `,
})
```

**Job Application Email**
```typescript
// Job application received notification for client
export const jobApplicationEmail = (
  clientName: string,
  developerName: string,
  jobTitle: string
) => ({
  subject: `New Application for ${jobTitle}`,
  html: `...`,
})
```

**Application Status Change Email**
```typescript
// Developer notification of application status
export const applicationStatusEmail = (
  developerName: string,
  jobTitle: string,
  status: string
) => ({
  subject: `Your Application Status: ${status}`,
  html: `...`,
})
```

4. **Integrate Emails into Actions**
```typescript
// Update admin.ts
export async function approveUser(userId: string) {
  // Update status...
  
  // Send approval email
  const user = await db.select().from(user).where(eq(user.id, userId))
  await sendEmail(
    user.email,
    approvalEmail(user.name).subject,
    approvalEmail(user.name).html
  )
}
```

### 3.4 Environment Variables

Add to `.env.local`:
```
# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
GOOGLE_DRIVE_FOLDER_ID=root

# Gmail
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

## Phase 4: Additional Features

### 4.1 Messaging System

1. **Add Messages Table**
```typescript
// lib/db/schema.ts
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  senderId: text('senderId').notNull(),
  recipientId: text('recipientId').notNull(),
  jobId: text('jobId'),
  content: text('content').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
```

2. **Create Messaging Pages**
- `/messages` - Message inbox
- `/messages/[userId]` - Conversation with specific user

### 4.2 Reviews & Ratings

1. **Add Reviews Table**
```typescript
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  jobId: text('jobId').notNull(),
  fromUserId: text('fromUserId').notNull(),
  toUserId: text('toUserId').notNull(),
  rating: integer('rating'), // 1-5
  comment: text('comment'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
```

2. **Create Review Components**
- Review submission form
- Reviews display on user profiles
- Star rating calculation

### 4.3 Advanced Search & Filters

```typescript
// app/jobs/page.tsx enhancements
- Search by job title
- Filter by category
- Filter by budget range
- Filter by skills
- Sort by newest/budget/deadline
```

## Phase 5: Payment & Escrow

### 5.1 Stripe Integration

1. **Install Stripe**
```bash
pnpm add stripe @stripe/stripe-js
```

2. **Create Payment Actions**
```typescript
// app/actions/payments.ts
export async function createPaymentIntent(jobId: string, amount: number) {
  // Create Stripe payment intent
  // Return client secret
}
```

3. **Implement Escrow Flow**
- Client deposits funds for job
- Developer completes work
- Client releases payment
- Funds transferred to developer

## Deployment Checklist

Before deploying to production:

- [ ] Set all environment variables in Vercel
- [ ] Enable HTTPS
- [ ] Set up custom domain
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Enable rate limiting on API routes
- [ ] Configure CORS properly
- [ ] Set up CDN for static assets
- [ ] Enable analytics
- [ ] Test email delivery
- [ ] Test file uploads
- [ ] Set up error tracking (Sentry)

## Testing

### Manual Testing Checklist

- [ ] User signup flow
- [ ] User approval workflow
- [ ] Job posting
- [ ] Job application
- [ ] Email notifications
- [ ] File uploads to Google Drive
- [ ] Data sync to Google Sheets
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] Performance metrics

### Automated Testing

```bash
# Add to package.json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

## Performance Optimization

1. **Database Optimization**
- Add indexes on frequently queried columns (done in schema)
- Use pagination for large result sets
- Implement caching strategies

2. **Frontend Optimization**
- Code splitting for routes
- Image optimization
- Lazy loading
- Memoization of expensive components

3. **API Optimization**
- Implement rate limiting
- Use compression (gzip)
- Cache responses where appropriate
- Batch database queries

## Security Hardening

1. **Input Validation**
- Validate all form inputs
- Sanitize user content
- Use TypeScript for type safety

2. **OWASP Top 10 Mitigation**
- [ ] Injection prevention (parameterized queries)
- [ ] Broken authentication (session management)
- [ ] Sensitive data exposure (HTTPS, encryption)
- [ ] XML External Entities (not applicable)
- [ ] Broken access control (role-based access)
- [ ] Security misconfiguration (environment variables)
- [ ] XSS prevention (React's built-in escaping)
- [ ] Insecure deserialization (avoid unsafe JSON)
- [ ] Using components with known vulnerabilities (npm audit)
- [ ] Insufficient logging & monitoring (implement logging)

## Monitoring & Analytics

1. **Set Up Logging**
```typescript
// lib/logger.ts
export function log(level: string, message: string, data?: any) {
  console.log(JSON.stringify({ level, message, data, timestamp: new Date() }))
}
```

2. **Error Tracking**
- Integrate Sentry or similar
- Monitor server-side errors
- Track client-side errors

3. **Performance Monitoring**
- Web Vitals
- Database query performance
- API response times

## Maintenance & Updates

- [ ] Regular dependency updates
- [ ] Security patch management
- [ ] Database maintenance
- [ ] Log rotation
- [ ] Backup verification
- [ ] Performance monitoring
- [ ] User feedback collection

---

For more information, refer to the main README.md file.
