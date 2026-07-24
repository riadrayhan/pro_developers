import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-svh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-input">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-foreground">JobPortal</h1>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Connect Clients with Developers
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            JobPortal is a modern platform connecting businesses with talented developers. 
            Post projects, apply to jobs, and build amazing things together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Join as Developer
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Hire Developers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-input mt-auto">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 JobPortal. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
