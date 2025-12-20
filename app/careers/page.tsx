import Link from 'next/link';
import { Mail, Briefcase, MapPin } from 'lucide-react';

import Button from '../../components/ui/Button';
import Section from '../../components/ui/Section';
import Logo from '../../components/ui/Logo';
import { db, jobs } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface Job {
  id: string;
  title: string;
  location: string;
  department: string;
  description: string;
}

async function getJobs(): Promise<Job[]> {
  const activeJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      location: jobs.location,
      department: jobs.department,
      description: jobs.description,
    })
    .from(jobs)
    .where(eq(jobs.isActive, true));

  return activeJobs;
}

export default async function CareersPage() {
  const jobOpenings = await getJobs();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-green-700 font-medium transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Section className="pt-32 pb-20 md:pt-48 md:pb-32 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6 text-gray-900">
          Join Our Team
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
          We&apos;re looking for passionate people to join us on our mission to clear tasks for businesses everywhere.
        </p>
      </Section>

      {/* Open Positions Section */}
      <Section id="open-positions" className="bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Open Positions</h2>
          <div className="max-w-4xl mx-auto">
            {jobOpenings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No open positions at the moment. Check back soon!
              </div>
            ) : (
              jobOpenings.map((job) => (
                <Link href={`/careers/${job.id}`} key={job.id} className="block bg-white p-6 rounded-lg shadow-md mb-6 cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <div className="flex items-center gap-4 text-gray-600 mt-2">
                        <div className="flex items-center gap-2">
                          <Briefcase size={16} />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline">
                      View
                    </Button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </Section>
      
      {/* General Application Section */}
      <Section>
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Don&apos;t see a fit?</h2>
          <p className="text-gray-600 text-lg mb-8">
            We&apos;re always looking for talented people. If you don&apos;t see a position that fits your skills, you can submit a general application.
          </p>
          <div className="flex justify-center">
            <Link href="/careers/general-application">
              <Button variant="primary" className="text-lg px-8">
                <Mail className="mr-2" /> Apply Generally
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <Logo />
            <div className="text-sm text-gray-500">
              © {currentYear} TaskClearers. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}