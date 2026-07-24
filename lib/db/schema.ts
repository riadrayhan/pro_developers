import { pgTable, text, timestamp, boolean, numeric, decimal } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Add your app tables below. Always include a plain `userId` column so queries
// can be scoped per user — the security model depends on this column existing,
// not on a foreign key. Do NOT add a foreign key constraint
// (`.references(() => user.id, ...)`) unless the user explicitly asks for
// foreign keys or referential integrity; FK constraints make iterating on the
// schema harder.
//
// Example:
//
// import { serial } from "drizzle-orm/pg-core"
//
// export const todos = pgTable("todos", {
//   id: serial("id").primaryKey(),
//   userId: text("userId").notNull(),
//   title: text("title").notNull(),
//   completed: boolean("completed").notNull().default(false),
//   createdAt: timestamp("createdAt").notNull().defaultNow(),
// })
//
// If the user asks for foreign keys, add the reference back in:
//   userId: text("userId")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),

// JobPortal tables
export const userProfiles = pgTable('userProfiles', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'client', 'developer', 'admin'
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  profileImage: text('profileImage'),
  nidImage: text('nidImage'),
  bio: text('bio'),
  skills: text('skills'), // JSON string
  location: text('location'),
  portfolio: text('portfolio'),
  hourlyRate: decimal('hourlyRate', { precision: 10, scale: 2 }),
  jobTitle: text('jobTitle'),
  companyName: text('companyName'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  clientId: text('clientId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  budget: decimal('budget', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('open'), // 'open', 'in_progress', 'completed', 'cancelled'
  deadline: timestamp('deadline'),
  requiredSkills: text('requiredSkills'), // JSON string
  experienceLevel: text('experienceLevel'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const jobApplications = pgTable('jobApplications', {
  id: text('id').primaryKey(),
  jobId: text('jobId').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  developerId: text('developerId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  proposedBudget: decimal('proposedBudget', { precision: 12, scale: 2 }),
  coverLetter: text('coverLetter'),
  status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'withdrawn'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const adminQueue = pgTable('adminQueue', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reason: text('reason'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
