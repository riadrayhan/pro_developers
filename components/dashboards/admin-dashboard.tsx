'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, Settings, CheckCircle, XCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { getPendingApprovals, approveUser, rejectUser } from '@/app/actions/admin'

interface AdminDashboardProps {
  userId: string
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [approvals, setApprovals] = useState<any[]>([])
  const [loadingApprovals, setLoadingApprovals] = useState(true)

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    try {
      setLoadingApprovals(true)
      const data = await getPendingApprovals()
      setApprovals(data)
    } catch (err) {
      console.error('Failed to load approvals:', err)
    } finally {
      setLoadingApprovals(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId)
      loadApprovals()
    } catch (err) {
      console.error('Failed to approve user:', err)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      await rejectUser(userId)
      loadApprovals()
    } catch (err) {
      console.error('Failed to reject user:', err)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <header className="bg-background border-b border-input sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">JobPortal</h1>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Pending Approvals</h3>
            <p className="text-3xl font-bold text-foreground mt-2">{approvals.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Total Users</h3>
            <p className="text-3xl font-bold text-foreground mt-2">—</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Active Jobs</h3>
            <p className="text-3xl font-bold text-foreground mt-2">—</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground">Completed Projects</h3>
            <p className="text-3xl font-bold text-foreground mt-2">—</p>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">User Approvals Queue</h3>
          
          {loadingApprovals ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading approvals...</p>
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 border border-input rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{approval.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {approval.role === 'developer' ? '👨‍💻 Developer' : '🏢 Client'} • 
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </p>
                    {approval.bio && (
                      <p className="text-sm text-foreground mt-1">{approval.bio.substring(0, 100)}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(approval.userId)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(approval.userId)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
