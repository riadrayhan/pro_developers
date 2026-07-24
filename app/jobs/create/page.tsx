'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createJob } from '@/app/actions/jobs'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreateJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-development',
    budget: '',
    deadline: '',
    requiredSkills: '',
    experienceLevel: 'intermediate',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.title || !formData.description || !formData.budget) {
        throw new Error('Please fill in all required fields')
      }

      const jobId = await createJob({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        requiredSkills: formData.requiredSkills,
        experienceLevel: formData.experienceLevel,
      })

      router.push(`/jobs/${jobId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background py-8">
      <div className="container max-w-2xl">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Post a New Job</h1>
          <p className="text-muted-foreground mb-8">
            Create a job posting to find talented developers
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Build a React Dashboard"
                required
              />
            </div>

            {/* Category & Experience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="data-science">Data Science</option>
                  <option value="design">Design</option>
                  <option value="devops">DevOps</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <select
                  id="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the project, requirements, and deliverables..."
                rows={6}
                required
              />
            </div>

            {/* Required Skills */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
              <Input
                id="requiredSkills"
                value={formData.requiredSkills}
                onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                placeholder="React, Node.js, TypeScript..."
              />
            </div>

            {/* Budget & Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget">Budget (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="5000"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating Job...' : 'Post Job'}
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </main>
  )
}
