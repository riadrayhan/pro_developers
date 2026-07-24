'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { createUserProfile } from '@/app/actions/profile'

export default function RoleSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'client' | 'developer'>('developer')
  
  // Developer fields
  const [skills, setSkills] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  
  // Client fields
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  
  // Shared fields
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createUserProfile({
        role,
        skills: role === 'developer' ? skills : '',
        portfolio: role === 'developer' ? portfolio : '',
        hourlyRate: role === 'developer' ? parseFloat(hourlyRate) : undefined,
        companyName: role === 'client' ? companyName : '',
        jobTitle: role === 'client' ? jobTitle : '',
        location,
        bio,
      })

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete your profile to get started with JobPortal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Role Selection */}
          <div className="flex flex-col gap-3">
            <Label className="text-base font-medium">Select Your Role</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  role === 'client'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-input bg-background text-foreground hover:border-primary'
                }`}
              >
                <div className="font-semibold">I am a Client</div>
                <div className="text-sm text-muted-foreground mt-1">Post jobs</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('developer')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  role === 'developer'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-input bg-background text-foreground hover:border-primary'
                }`}
              >
                <div className="font-semibold">I am a Developer</div>
                <div className="text-sm text-muted-foreground mt-1">Find jobs</div>
              </button>
            </div>
          </div>

          {/* Shared Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          {/* Developer Fields */}
          {role === 'developer' && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, TypeScript..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="portfolio">Portfolio URL</Label>
                <Input
                  id="portfolio"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  type="url"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="50"
                  type="number"
                  step="0.01"
                />
              </div>
            </>
          )}

          {/* Client Fields */}
          {role === 'client' && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Manager, Director, etc."
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full py-2 text-base" size="lg">
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
