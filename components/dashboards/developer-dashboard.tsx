'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, Settings, Search } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface DeveloperDashboardProps {
  userId: string
  profile: any
}

export default function DeveloperDashboard({ userId, profile }: DeveloperDashboardProps) {
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
            <p className="text-sm text-muted-foreground">Developer Dashboard</p>
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
            Welcome, Developer!
          </h2>
          <p className="text-muted-foreground mb-2">
            Find exciting projects that match your skills
          </p>
          {profile.hourlyRate && (
            <p className="text-sm text-muted-foreground">
              <strong>Your Rate:</strong> ${parseFloat(profile.hourlyRate).toFixed(2)}/hour
            </p>
          )}
          <div className="mt-6">
            <Link href="/jobs">
              <Button size="lg">
                <Search className="w-5 h-5 mr-2" />
                Browse Available Jobs
              </Button>
            </Link>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Applications Sent</h3>
            <p className="text-3xl font-bold text-foreground mt-2">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Active Projects</h3>
            <p className="text-3xl font-bold text-foreground mt-2">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Completed Projects</h3>
            <p className="text-3xl font-bold text-foreground mt-2">0</p>
          </Card>
        </div>

        {/* Skills Display */}
        {profile.skills && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Your Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(',').map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Applications */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Applications</h3>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No applications yet</p>
            <Link href="/jobs">
              <Button variant="outline">Start Browsing Jobs</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
