'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { userProfiles, adminQueue } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function createUserProfile(data: {
  role: 'client' | 'developer' | 'admin'
  skills?: string
  portfolio?: string
  hourlyRate?: number
  companyName?: string
  jobTitle?: string
  location?: string
  bio?: string
}) {
  const userId = await getUserId()

  // Create user profile with pending status
  await db.insert(userProfiles).values({
    id: crypto.randomUUID(),
    userId,
    role: data.role,
    status: 'pending', // Admin approval needed
    skills: data.skills || null,
    portfolio: data.portfolio || null,
    hourlyRate: data.hourlyRate ? data.hourlyRate.toString() : null,
    companyName: data.companyName || null,
    jobTitle: data.jobTitle || null,
    location: data.location || null,
    bio: data.bio || null,
  })

  // Add to admin queue for approval
  await db.insert(adminQueue).values({
    id: crypto.randomUUID(),
    userId,
    action: `User signup as ${data.role}`,
    status: 'pending',
  })

  revalidatePath('/dashboard')
}

export async function getUserProfile() {
  const userId = await getUserId()
  
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)

  return profile[0] || null
}

export async function updateUserProfile(data: Partial<typeof userProfiles.$inferInsert>) {
  const userId = await getUserId()
  
  await db
    .update(userProfiles)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId))

  revalidatePath('/dashboard')
  revalidatePath('/profile')
}
