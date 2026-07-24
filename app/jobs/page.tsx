import { getAllJobs } from '@/app/actions/jobs'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, Settings } from 'lucide-react'

export default async function JobsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  const allJobs = await getAllJobs()

  return (
    <main className="min-h-svh bg-background">
      {/* Header */}
      <header className="bg-background border-b border-input sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">JobPortal</h1>
            <p className="text-sm text-muted-foreground">Available Jobs</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Available Jobs</h2>
            <p className="text-muted-foreground mt-2">
              {allJobs.length} {allJobs.length === 1 ? 'job' : 'jobs'} available
            </p>
          </div>
        </div>

        {allJobs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No jobs available at the moment.</p>
            <p className="text-sm text-muted-foreground">
              Check back soon for new opportunities!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {allJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {job.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(job.budget || '0').toLocaleString()}
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {job.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span>
                        Level: <strong>{job.experienceLevel}</strong>
                      </span>
                      {job.deadline && (
                        <span>
                          Deadline: <strong>{new Date(job.deadline).toLocaleDateString()}</strong>
                        </span>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>

                  {job.requiredSkills && (
                    <div className="mt-4 pt-4 border-t border-input">
                      <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.split(',').map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
