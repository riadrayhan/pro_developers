'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getJobById, applyForJob } from '@/app/actions/jobs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  
  const [applicationData, setApplicationData] = useState({
    proposedBudget: '',
    coverLetter: '',
  })

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true)
        const jobData = await getJobById(jobId)
        if (!jobData) {
          setError('Job not found')
        } else {
          setJob(jobData)
        }
      } catch (err) {
        setError('Failed to load job')
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [jobId])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setApplying(true)

    try {
      if (!applicationData.coverLetter) {
        throw new Error('Please write a cover letter')
      }

      await applyForJob(jobId, {
        proposedBudget: applicationData.proposedBudget
          ? parseFloat(applicationData.proposedBudget)
          : undefined,
        coverLetter: applicationData.coverLetter,
      })

      setShowApplicationForm(false)
      setApplicationData({ proposedBudget: '', coverLetter: '' })
      alert('Application submitted successfully!')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background py-8">
        <div className="container text-center">
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </main>
    )
  }

  if (!job) {
    return (
      <main className="min-h-svh bg-background py-8">
        <div className="container">
          <Link href="/jobs">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{error || 'Job not found'}</p>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background py-8">
      <div className="container max-w-3xl">
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="mb-4 flex gap-2">
                <Badge>{job.category}</Badge>
                <Badge variant="secondary">{job.experienceLevel}</Badge>
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4">{job.title}</h1>

              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {job.requiredSkills && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.split(',').map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {skill.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-input">
                <p className="text-sm text-muted-foreground">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </p>
                {job.deadline && (
                  <p className="text-sm text-muted-foreground">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-3xl font-bold text-primary mb-4">
                ${parseFloat(job.budget || '0').toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground mb-6">Estimated Budget</p>

              {!showApplicationForm ? (
                <Button
                  onClick={() => setShowApplicationForm(true)}
                  className="w-full"
                  size="lg"
                >
                  Apply Now
                </Button>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="proposedBudget">Your Proposed Budget</Label>
                    <Input
                      id="proposedBudget"
                      type="number"
                      step="0.01"
                      value={applicationData.proposedBudget}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          proposedBudget: e.target.value,
                        })
                      }
                      placeholder="Enter your rate"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="coverLetter">Cover Letter *</Label>
                    <Textarea
                      id="coverLetter"
                      value={applicationData.coverLetter}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          coverLetter: e.target.value,
                        })
                      }
                      placeholder="Tell the client why you're a great fit for this job..."
                      rows={4}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={applying} className="flex-1">
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApplicationForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
