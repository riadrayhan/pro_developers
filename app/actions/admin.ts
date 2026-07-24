'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { adminQueue, userProfiles, user } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getAdminId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')

  // Check if user is admin
  const adminProfile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1)

  if (!adminProfile.length || adminProfile[0].role !== 'admin') {
    throw new Error('Admin access required')
  }

  return session.user.id
}

export async function getPendingApprovals() {
  await getAdminId()

  // Get pending admin queue items with user and profile data
  const pendingItems = await db
    .select({
      id: adminQueue.id,
      userId: adminQueue.userId,
      action: adminQueue.action,
      email: user.email,
      name: user.name,
      role: userProfiles.role,
      bio: userProfiles.bio,
      companyName: userProfiles.companyName,
      skills: userProfiles.skills,
      createdAt: adminQueue.createdAt,
    })
    .from(adminQueue)
    .innerJoin(user, eq(adminQueue.userId, user.id))
    .innerJoin(userProfiles, eq(user.id, userProfiles.userId))
    .where(eq(adminQueue.status, 'pending'))

  return pendingItems
}

export async function approveUser(userId: string) {
  await getAdminId()

  // Update user profile status to approved
  await db
    .update(userProfiles)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))

  // Update admin queue
  await db
    .update(adminQueue)
    .set({ status: 'approved', updatedAt: new Date() })
    .where(eq(adminQueue.userId, userId))

  revalidatePath('/dashboard')
}

export async function rejectUser(userId: string, reason?: string) {
  await getAdminId()

  // Update user profile status to rejected
  await db
    .update(userProfiles)
    .set({ status: 'rejected', updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))

  // Update admin queue
  await db
    .update(adminQueue)
    .set({ status: 'rejected', reason: reason || 'Application rejected', updatedAt: new Date() })
    .where(eq(adminQueue.userId, userId))

  revalidatePath('/dashboard')
}
