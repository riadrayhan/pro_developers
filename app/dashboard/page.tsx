import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { userProfiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import ClientDashboard from '@/components/dashboards/client-dashboard'
import DeveloperDashboard from '@/components/dashboards/developer-dashboard'
import AdminDashboard from '@/components/dashboards/admin-dashboard'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id))
    .limit(1)

  if (!profile.length) {
    redirect('/role-setup')
  }

  const userProfile = profile[0]

  // Show approval pending message
  if (userProfile.status === 'pending') {
    return (
      <main className="min-h-svh bg-background">
        <div className="container py-8">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-4">
              Profile Under Review
            </h1>
            <p className="text-muted-foreground mb-8">
              Your account is pending admin approval. You will receive an email once it has been reviewed.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/profile">
                <Button variant="outline">View Profile</Button>
              </Link>
              <form action={async () => {
                'use server'
                await auth.api.signOut({ headers: await headers() })
                redirect('/sign-in')
              }}>
                <Button type="submit" variant="ghost">Sign Out</Button>
              </form>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  if (userProfile.status === 'rejected') {
    return (
      <main className="min-h-svh bg-background">
        <div className="container py-8">
          <Card className="p-8 text-center border-destructive">
            <h1 className="text-2xl font-semibold text-destructive mb-4">
              Application Rejected
            </h1>
            <p className="text-muted-foreground mb-8">
              We regret to inform you that your application has been rejected. Please contact support for more information.
            </p>
            <form action={async () => {
              'use server'
              await auth.api.signOut({ headers: await headers() })
              redirect('/sign-in')
            }}>
              <Button type="submit" variant="outline">Sign Out</Button>
            </form>
          </Card>
        </div>
      </main>
    )
  }

  // Render role-specific dashboard
  return (
    <main className="min-h-svh bg-background">
      {userProfile.role === 'admin' && <AdminDashboard userId={session.user.id} />}
      {userProfile.role === 'client' && <ClientDashboard userId={session.user.id} profile={userProfile} />}
      {userProfile.role === 'developer' && <DeveloperDashboard userId={session.user.id} profile={userProfile} />}
    </main>
  )
}
