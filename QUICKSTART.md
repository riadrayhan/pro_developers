# JobPortal - Quick Start Guide

Get started with JobPortal in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- A Neon PostgreSQL database (or any PostgreSQL database)

## Installation Steps

### 1. Clone & Install

```bash
# Install dependencies
pnpm install
```

### 2. Setup Environment

Create `.env.local` file in the project root:

```
# Generate BETTER_AUTH_SECRET with:
# openssl rand -base64 32

DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
BETTER_AUTH_SECRET=<your-generated-secret>
```

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Test the App

### 1. Create a Developer Account

1. Click "Get Started" → "Join as Developer"
2. Sign up with:
   - Name: John Doe
   - Email: john@example.com
   - Password: Password123!
3. Select "Developer" role
4. Complete profile:
   - Skills: React, Node.js, TypeScript
   - Portfolio: https://portfolio.example.com
   - Hourly Rate: $50

### 2. Create a Client Account

1. Click "Sign In"
2. Log out (top right)
3. Click "Get Started" → "Hire Developers"
4. Sign up with:
   - Name: Jane Smith
   - Email: jane@example.com
   - Password: Password123!
5. Select "Client" role
6. Complete profile:
   - Company: Acme Corp
   - Job Title: Project Manager

### 3. Test Admin Approval (Optional)

To fully test the approval flow:

1. Access the database directly (Neon dashboard)
2. Update both users' approval status:
   ```sql
   UPDATE "userProfiles" SET status = 'approved' WHERE userId = '<user-id>';
   ```

### 4. Post & Apply for Jobs

**As Client:**
1. Log in with jane@example.com
2. Dashboard → "Post a New Job"
3. Fill in job details:
   - Title: Build React Dashboard
   - Category: Web Development
   - Budget: $5,000
   - Experience Level: Intermediate
   - Description: Create a modern dashboard with charts and analytics

**As Developer:**
1. Log in with john@example.com
2. Browse Jobs
3. Click on the posted job
4. Click "Apply Now"
5. Submit cover letter and proposed budget

## Project Structure Overview

```
app/              - Next.js app routes
├── page.tsx      - Landing page
├── sign-in/      - Login page
├── sign-up/      - Registration page
├── dashboard/    - Main dashboard
└── jobs/         - Job listing & details

lib/
├── auth.ts       - Authentication config
└── db/
    ├── index.ts  - Database client
    └── schema.ts - Database schema

components/
├── ui/           - UI components (buttons, inputs, etc)
├── auth-form.tsx - Login/signup form
└── dashboards/   - Role-specific dashboards
```

## Common Tasks

### Change User Role

```bash
# Access your database and run:
UPDATE "userProfiles" SET role = 'admin' WHERE userId = '<user-id>';
```

### Reset User Status

```bash
UPDATE "userProfiles" SET status = 'approved' WHERE userId = '<user-id>';
```

### View All Jobs

Navigate to: http://localhost:3000/jobs

### Delete Test Data

```bash
DELETE FROM "jobApplications";
DELETE FROM "jobs";
DELETE FROM "adminQueue";
DELETE FROM "userProfiles";
DELETE FROM "user";
```

## Troubleshooting

### "Module not found" Error

**Solution**: 
```bash
pnpm install
rm -rf .next
pnpm dev
```

### Database Connection Failed

**Solution**: 
- Verify DATABASE_URL in .env.local
- Check Neon dashboard for active connections
- Ensure IP whitelist includes your connection

### Authentication Not Working

**Solution**:
- Verify BETTER_AUTH_SECRET is set
- Check browser cookies (DevTools → Application → Cookies)
- Try clearing cookies and logging in again

### Buttons Not Responding

**Solution**:
- Wait for page to fully load (React hydration)
- Check browser console for errors
- Restart dev server: `pnpm dev`

## Key Files to Edit

### Change App Name
- `app/page.tsx` - Landing page
- `lib/auth.ts` - Auth configuration
- Search for "JobPortal" to find all references

### Customize Colors
- `app/globals.css` - Design tokens and Tailwind config

### Modify Database Schema
- `lib/db/schema.ts` - Add new tables/columns
- Run schema migrations via Neon dashboard

### Add New Routes
- Create folders in `app/` directory
- Next.js auto-routes based on file structure

## Deployment to Vercel

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Set environment variables (DATABASE_URL, BETTER_AUTH_SECRET)
5. Deploy!

## Available Scripts

```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm type-check    # Check TypeScript types
```

## API Endpoints

### Authentication
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-out`

### Server Actions (Called from Client)
- `createUserProfile()` - Create user profile
- `createJob()` - Post a new job
- `applyForJob()` - Apply to a job
- `getPendingApprovals()` - Get pending users (admin)
- `approveUser()` - Approve a user (admin)

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Better Auth](https://www.better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)

## Need Help?

1. Check the [README.md](./README.md) for detailed documentation
2. Review [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for advanced features
3. Check [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for project overview
4. Review code comments for specific functionality

## Next Steps

After testing:

1. Customize branding and colors
2. Add your own jobs and applications
3. Implement Phase 3 features (Google Drive, Email)
4. Deploy to Vercel
5. Collect user feedback

---

Happy coding! 🚀
