'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { jobs, jobApplications } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createJob(data: {
  title: string
  description: string
  category: string
  budget: number
  deadline?: Date
  requiredSkills?: string
  experienceLevel?: string
}) {
  const userId = await getUserId()

  const jobId = crypto.randomUUID()
  
  await db.insert(jobs).values({
    id: jobId,
    clientId: userId,
    title: data.title,
    description: data.description,
    category: data.category,
    budget: data.budget.toString(),
    deadline: data.deadline,
    requiredSkills: data.requiredSkills,
    experienceLevel: data.experienceLevel,
    status: 'open',
  })

  revalidatePath('/dashboard')
  revalidatePath('/jobs')
  
  return jobId
}

export async function getClientJobs() {
  const userId = await getUserId()

  return db
    .select()
    .from(jobs)
    .where(eq(jobs.clientId, userId))
    .orderBy(desc(jobs.createdAt))
}

export async function getAllJobs() {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'open'))
    .orderBy(desc(jobs.createdAt))
}

export async function getJobById(jobId: string) {
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1)
    .then((result) => result[0] || null)
}

export async function updateJobStatus(jobId: string, status: 'open' | 'in_progress' | 'completed' | 'cancelled') {
  const userId = await getUserId()

  const job = await getJobById(jobId)
  if (!job || job.clientId !== userId) {
    throw new Error('Unauthorized')
  }

  await db
    .update(jobs)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobs.id, jobId))

  revalidatePath('/dashboard')
  revalidatePath('/jobs')
}

export async function getJobApplications(jobId: string) {
  const userId = await getUserId()

  // Verify user is the job owner
  const job = await getJobById(jobId)
  if (!job || job.clientId !== userId) {
    throw new Error('Unauthorized')
  }

  return db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.jobId, jobId))
    .orderBy(desc(jobApplications.createdAt))
}

export async function getDeveloperApplications() {
  const userId = await getUserId()

  return db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.developerId, userId))
    .orderBy(desc(jobApplications.createdAt))
}

export async function applyForJob(jobId: string, data: {
  proposedBudget?: number
  coverLetter?: string
}) {
  const userId = await getUserId()

  // Check if already applied
  const existingApplication = await db
    .select()
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.jobId, jobId),
        eq(jobApplications.developerId, userId)
      )
    )
    .limit(1)

  if (existingApplication.length > 0) {
    throw new Error('You have already applied for this job')
  }

  await db.insert(jobApplications).values({
    id: crypto.randomUUID(),
    jobId,
    developerId: userId,
    proposedBudget: data.proposedBudget ? data.proposedBudget.toString() : null,
    coverLetter: data.coverLetter,
    status: 'pending',
  })

  revalidatePath('/jobs')
  revalidatePath('/dashboard')
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
) {
  const userId = await getUserId()

  // Get the application
  const app = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.id, applicationId))
    .limit(1)
    .then((result) => result[0])

  if (!app) throw new Error('Application not found')

  // Verify user is the job owner
  const job = await getJobById(app.jobId)
  if (!job || job.clientId !== userId) {
    throw new Error('Unauthorized')
  }

  await db
    .update(jobApplications)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobApplications.id, applicationId))

  revalidatePath('/dashboard')
}
