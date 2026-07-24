'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, LogOut, Settings } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface ClientDashboardProps {
  userId: string
  profile: any
}

export default function ClientDashboard({ userId, profile }: ClientDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="bg-background border-b border-input sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">JobPortal</h1>
            <p className="text-sm text-muted-foreground">Client Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading}>
              <LogOut className="w-4 h-4 mr-2" />
              {loading ? 'Signing out...' : 'Sign Out'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        {/* Welcome Section */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {profile.companyName || 'Client'}!
          </h2>
          <p className="text-muted-foreground mb-6">
            Post projects and connect with talented developers
          </p>
          <Link href="/jobs/create">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Post a New Job
            </Button>
          </Link>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Active Jobs</h3>
            <p className="text-3xl font-bold text-foreground mt-2">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Applications Received</h3>
            <p className="text-3xl font-bold text-foreground mt-2">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Completed Projects</h3>
            <p className="text-3xl font-bold text-foreground mt-2">0</p>
          </Card>
        </div>

        {/* Recent Jobs */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Jobs</h3>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No jobs posted yet</p>
            <Link href="/jobs/create">
              <Button variant="outline">Post Your First Job</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
