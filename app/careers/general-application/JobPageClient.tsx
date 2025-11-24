"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Job } from '../positions';
import ApplicationForm from '../../../components/features/ApplicationForm';
import Button from '../../../components/ui/Button';
import Section from '../../../components/ui/Section';
import Logo from '../../../components/ui/Logo';
import BookingModal from '../../../components/features/BookingModal';

interface JobPageClientProps {
  job: Job;
}

export default function JobPageClient({ job }: JobPageClientProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const openBooking = () => {
    setIsBookingOpen(true);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">
      
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white/90 backdrop-blur-md shadow-sm py-4`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-green-700 font-medium transition-colors">Home</Link>
            <Button variant="primary" className="py-2.5 px-5 text-sm" onClick={openBooking}>Book Discovery Call</Button>
          </div>
        </div>
      </nav>

      {/* Job Details Section */}
      <Section className="pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/careers" className="flex items-center gap-2 text-gray-600 hover:text-green-700 font-medium mb-8">
              <ChevronLeft size={20} />
              Back to all openings
            </Link>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">{job.title}</h1>
            <p className="text-xl text-gray-600 mb-8">{job.location} • {job.department}</p>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>{job.description}</p>
            </div>
          </div>
        </div>
      </Section>
      
      {/* Application Form Section */}
      <Section id="apply" className="bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <ApplicationForm jobTitle={job.title} />
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