# JobPortal - Modern Job Marketplace Platform

A full-stack job marketplace platform connecting clients who need projects with developers looking for work. Built with Next.js 16, Neon PostgreSQL, Better Auth, and Tailwind CSS.

## Features

### Authentication & User Management
- **Email/Password Authentication** - Secure user registration and login using Better Auth
- **Role-Based Access Control** - Three user roles: Client, Developer, and Admin
- **Admin Approval System** - All new users enter a pending approval queue for admin review
- **User Profiles** - Customizable profiles with skills, portfolio, hourly rates, and company information
- **Session Management** - Secure session handling with automatic cleanup

### Job Management
- **Job Posting** - Clients can post jobs with detailed descriptions, budgets, and requirements
- **Job Browsing** - Developers can browse available jobs with filters and search
- **Job Details** - Comprehensive job listings with skills, deadlines, and project requirements
- **Application System** - Developers can apply to jobs with cover letters and proposed budgets
- **Application Management** - Clients can review, accept, or reject applications

### Dashboard & User Experience
- **Role-Specific Dashboards** - Customized dashboards for Clients, Developers, and Admins
- **Admin Dashboard** - Approve/reject users, manage platform, view statistics
- **Client Dashboard** - Post jobs, manage applications, track project status
- **Developer Dashboard** - Browse jobs, track applications, view earnings

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Lucide React** - Icon library
- **TypeScript** - Type-safe development

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Server Actions** - Type-safe server-side operations
- **Better Auth** - Authentication framework
- **Drizzle ORM** - Type-safe database queries

### Database
- **Neon PostgreSQL** - Managed PostgreSQL database
- **Connection Pooling** - Efficient database connection management

## Project Structure

```
├── app/
│   ├── page.tsx                    # Landing page
│   ├── sign-in/page.tsx           # Sign-in page
│   ├── sign-up/page.tsx           # Sign-up page
│   ├── role-setup/page.tsx        # Role selection after signup
│   ├── dashboard/page.tsx         # Main dashboard
│   ├── jobs/
│   │   ├── page.tsx               # Job listing
│   │   ├── create/page.tsx        # Create job
│   │   └── [id]/page.tsx          # Job details & apply
│   ├── api/auth/[...all]/route.ts # Auth API handler
│   ├── actions/
│   │   ├── profile.ts             # Profile management
│   │   ├── jobs.ts                # Job operations
│   │   └── admin.ts               # Admin operations
│   └── profile/page.tsx           # User profile (to be built)
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── auth-form.tsx              # Authentication form
│   └── dashboards/
│       ├── client-dashboard.tsx   # Client dashboard
│       ├── developer-dashboard.tsx # Developer dashboard
│       └── admin-dashboard.tsx    # Admin dashboard
├── lib/
│   ├── auth.ts                    # Better Auth configuration
│   ├── auth-client.ts             # Client-side auth
│   ├── db/
│   │   ├── index.ts               # Database client
│   │   └── schema.ts              # Database schema
│   └── utils.ts                   # Utility functions
└── public/                        # Static assets
```

## Database Schema

### Core Tables
- **user** - User accounts (Better Auth)
- **session** - User sessions (Better Auth)
- **account** - OAuth/password accounts (Better Auth)
- **verification** - Email verification tokens (Better Auth)

### Application Tables
- **userProfiles** - Extended user information with role and status
- **jobs** - Job postings by clients
- **jobApplications** - Developer applications to jobs
- **adminQueue** - Pending user approvals for admin review

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- Neon PostgreSQL database
- BETTER_AUTH_SECRET environment variable

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd jobportal
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
Create `.env.local`:
```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
```

4. **Initialize database**
The database schema is automatically created when you first connect.

5. **Start development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Flows

### Developer Signup Flow
1. Visit homepage → Click "Join as Developer"
2. Sign up with email/password/name
3. Select "Developer" role
4. Complete profile (skills, portfolio, hourly rate, bio)
5. Profile enters admin approval queue
6. Upon approval, access developer dashboard and job listings

### Client Signup Flow
1. Visit homepage → Click "Hire Developers"
2. Sign up with email/password/name
3. Select "Client" role
4. Complete profile (company name, job title, bio)
5. Profile enters admin approval queue
6. Upon approval, access client dashboard and can post jobs

### Admin Approval Flow
1. Admin logs in to dashboard
2. Views pending user approvals
3. Reviews user profiles and details
4. Approves or rejects each application
5. Users receive status updates in their dashboard

### Job Posting Flow
1. Client logs in and goes to dashboard
2. Clicks "Post a New Job"
3. Fills in job details (title, description, budget, skills, etc.)
4. Job is published and appears in job listings
5. Developers can browse and apply

### Job Application Flow
1. Developer browses available jobs
2. Clicks on a job to view details
3. Clicks "Apply Now"
4. Fills in proposed budget and cover letter
5. Submits application
6. Client can review and respond to applications

## API Endpoints

### Authentication
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

### Server Actions (Client-side calls)
- `createUserProfile()` - Create user profile after signup
- `getUserProfile()` - Get current user profile
- `updateUserProfile()` - Update user profile
- `createJob()` - Post a new job
- `getClientJobs()` - Get user's posted jobs
- `getAllJobs()` - Get all available jobs
- `getJobById()` - Get specific job details
- `applyForJob()` - Apply to a job
- `getPendingApprovals()` - Get pending users (admin only)
- `approveUser()` - Approve a user (admin only)
- `rejectUser()` - Reject a user (admin only)

## Security Features

### Authentication & Authorization
- Secure password hashing with bcrypt
- Session-based authentication
- CSRF protection via Better Auth
- Role-based access control

### Data Protection
- Secure database connections
- SQL injection prevention via parameterized queries
- Input validation on all forms
- User data scoping (users can only see their own data)

### Cookie Security
- HttpOnly cookies (can't be accessed by JavaScript)
- Secure flag on production
- SameSite protection
- Cross-origin handling for iframe environments

## Future Enhancements

### Phase 3 (In Progress)
- [ ] Google Drive integration for file uploads
- [ ] Google Sheets integration for data export
- [ ] Email notifications (Gmail/SMTP)
- [ ] Payment processing (Stripe)
- [ ] Messaging system between clients and developers

### Phase 4
- [ ] Reviews and ratings system
- [ ] Portfolio showcase
- [ ] Advanced job search and filtering
- [ ] Notification system
- [ ] Analytics dashboard

### Phase 5
- [ ] Mobile app (React Native)
- [ ] Video interview integration
- [ ] Skills certification
- [ ] Escrow payment system
- [ ] Dispute resolution

## Configuration

### Environment Variables
```
DATABASE_URL              # PostgreSQL connection string
BETTER_AUTH_SECRET        # Session encryption key
BETTER_AUTH_URL          # (Optional) Custom auth domain
```

### Tailwind Configuration
Customizable theme in `globals.css` with design tokens for colors and typography.

## Troubleshooting

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Restart dev server: `pnpm dev`

### Database Connection Issues
- Verify DATABASE_URL in environment
- Check Neon dashboard for active connections
- Ensure IP whitelist includes your connection

### Authentication Issues
- Verify BETTER_AUTH_SECRET is set
- Check session cookies in browser DevTools
- Ensure auth routes are accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal and commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js, React, and Tailwind CSS
