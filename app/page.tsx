"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  Users, 
  ShieldCheck, 
  Menu,
  X,
  Clock,
  Briefcase,
  Mail,
  Database,
  PhoneCall,
  UserCheck,
  Zap
} from 'lucide-react';

import Button from '../components/ui/Button';
import Section from '../components/ui/Section';
import Logo from '../components/ui/Logo';
import AccordionItem from '../components/ui/AccordionItem';
import BookingModal from '../components/features/BookingModal';
import FeatureBlock from '../components/features/FeatureBlock';

// --- Main Application ---

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false); // State for Modal

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const openBooking = () => {
    setIsBookingOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">
      
      {/* The Booking Modal */}
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo />
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="text-gray-600 hover:text-green-700 font-medium transition-colors">How It Works</a>
            <a href="#why-us" onClick={(e) => { e.preventDefault(); scrollToSection('why-us'); }} className="text-gray-600 hover:text-green-700 font-medium transition-colors">Why Us</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }} className="text-gray-600 hover:text-green-700 font-medium transition-colors">Services</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }} className="text-gray-600 hover:text-green-700 font-medium transition-colors">FAQ</a>
            <Button variant="primary" className="py-2.5 px-5 text-sm" onClick={openBooking}>Book Discovery Call</Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b md:hidden shadow-xl flex flex-col p-4 gap-4 animate-in slide-in-from-top-5">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }} className="text-left p-2 hover:bg-gray-50 rounded-lg font-medium text-gray-700">How It Works</a>
            <a href="#why-us" onClick={(e) => { e.preventDefault(); scrollToSection('why-us'); }} className="text-left p-2 hover:bg-gray-50 rounded-lg font-medium text-gray-700">Why Us</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services'); }} className="text-left p-2 hover:bg-gray-50 rounded-lg font-medium text-gray-700">Services</a>
            <Button variant="primary" className="w-full justify-center" onClick={openBooking}>Book Discovery Call</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-50/50 to-transparent -z-10 rounded-l-[100px]" />
        
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold mb-6 border border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Available for immediate start
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6 text-gray-900">
                Hire Top 1% Remote Talent in 5 Days <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                  (Pre-Trained & Ready).
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Focus on growth, not hiring. Get vetted professionals who are ready to seamlessly integrate into your team.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" className="text-lg px-8" onClick={openBooking}>
                  Start Clearing Tasks
                </Button>
                <Button variant="outline" className="text-lg px-8" onClick={() => scrollToSection('how-it-works')}>
                  See How It Works
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-3 text-sm text-gray-600">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p><span className="font-semibold text-gray-800">Vetted and Ready</span> Talent</p>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-w-md mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
                 {/* Hero Image Placeholder - Intended for High-Quality Video Testimonial or Trustworthy Portrait */}
                 <div className="relative rounded-xl overflow-hidden bg-gray-200 aspect-[4/3] mb-6 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="bg-gray-300 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                         <span className="text-gray-500 text-2xl">▶</span>
                      </div>
                      <p className="text-gray-500 font-medium text-sm">Candidate Intro / Hero Portrait</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                    <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                 </div>
              </div>
              
              {/* Decorative Elements behind */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-green-200/30 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -z-10" />
            </div>

          </div>
        </div>
      </div>

      {/* Service Guarantees Bar */}
      <div className="border-y border-gray-100 bg-gray-50/50 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
            {[
              { label: 'Talent Quality', value: 'Top 1%' },
              { label: 'Placement Speed', value: '< 48 Hrs' },
              { label: 'Satisfaction', value: 'Guaranteed' },
              { label: 'Contract Type', value: 'Flexible' }
            ].map((metric) => (
              <div key={metric.label} className="text-center">
                 <div className="text-2xl md:text-3xl font-bold text-gray-900">{metric.value}</div>
                 <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <Section className="bg-emerald-900 text-white relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { icon: Users, val: 'Top 1%', label: 'Talent Standard' },
              { icon: Clock, val: 'Rapid', label: 'Onboarding Speed' },
              { icon: Briefcase, val: '50+', label: 'Expert Skill Sets' },
              { icon: ShieldCheck, val: '100%', label: 'Satisfaction Guarantee' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-green-400 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                  <stat.icon size={24} />
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{stat.val}</div>
                  <div className="text-green-100/80 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section id="how-it-works" className="bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%)]" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Clear your tasks in 3 simple steps</h2>
             <p className="text-gray-600 text-lg">No lengthy interviews. No contracts. Just results.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: PhoneCall,
                step: "01",
                title: "Book a Discovery Call",
                desc: "In a brief 30-minute chat, tell us about your bottlenecks and the tools you use."
              },
              {
                icon: UserCheck,
                step: "02",
                title: "Get Matched Expertly",
                desc: "We select the ideal pre-trained professional from our team to meet your specific needs."
              },
              {
                icon: Zap,
                step: "03",
                title: "Start Clearing Tasks",
                desc: "Your new team member will join your Slack and begin working efficiently within a week."
              }
            ].map((item, idx, arr) => (
              <div key={item.step} className="relative flex flex-col gap-6 rounded-3xl bg-white/90 p-8 shadow-lg shadow-gray-200/60 border border-white/70 backdrop-blur">
                {/* Desktop connector */}
                {/* Mobile timeline connector */}
                {idx < arr.length - 1 && (
                  <div className="md:hidden absolute bottom-0 left-1/2 h-8 w-px bg-gradient-to-b from-green-400 to-transparent translate-y-full" />
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-2xl">
                      <item.icon size={30} />
                    </div>
                    <div className="hidden md:block text-sm font-semibold tracking-[0.15em] uppercase text-gray-500">
                      Step {item.step}
                    </div>
                  </div>
                  <div className="md:hidden">
                    <span className="text-sm font-semibold tracking-[0.15em] uppercase text-gray-500">Step {item.step}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 border border-green-100">
                    {item.step}
                  </span>
                  <span>{idx === 0 ? 'Kickoff' : idx === 1 ? 'Match & onboard' : 'Go live in Slack'}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button variant="primary" onClick={openBooking} className="text-lg px-8 py-4 shadow-lg shadow-green-200 mx-auto">
              Book a Discovery Call
            </Button>
          </div>
        </div>
      </Section>

      {/* Features (Zig Zag) */}
      <Section id="why-us" className="bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">More than just a freelancer platform</h2>
            <p className="text-gray-600 text-lg">We manage the talent lifecycle so you can manage your business.</p>
          </div>

          <FeatureBlock
            title="Rigorous 4-Step Vetting"
            description="We don't just let anyone in. Our candidates must pass English fluency tests, logic assessments, and behavioral interviews. We filter out 99% of applicants, so you only see the top 1%."
            image="https://placehold.co/800x600/e2e8f0/64748b?text=Modern+SaaS+Dashboard+UI"
            imagePosition="right"
            tags={['Identity Verification', 'Skill Assessment', 'Video Interview']}
          />

          <FeatureBlock
            title="Seamless Tech Integration"
            description="Our remote workers are digital natives. They can plug directly into your Slack, manage Jira tickets, and update your HubSpot CRM without requiring basic training."
            image="https://placehold.co/800x600/e2e8f0/64748b?text=Integration+Workflow+UI"
            imagePosition="left"
            tags={['Slack Native', 'Google Workspace', 'Asana Expert']}
          />

          <FeatureBlock
            title="Dedicated Success Manager"
            description="You are never alone. Every account includes a dedicated Customer Success Manager to handle payroll, compliance, and performance reviews, ensuring your new hire is successful."
            image="https://placehold.co/800x600/e2e8f0/64748b?text=Success+Manager+Dashboard"
            imagePosition="right"
            tags={['Performance Reviews', 'Payroll Handled', 'Dispute Resolution']}
          />
        </div>
      </Section>

      {/* Comparison Table */}
      <Section className="bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why we win against the alternatives</h2>
          </div>
          
          <div className="mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
              {/* Green Highlight Background */}
              <div className="absolute top-0 left-1/4 w-1/4 h-full bg-green-50 z-0"></div>

              <div className="relative z-10">
                {/* Table Header */}
                <div className="grid grid-cols-4 items-center p-5 bg-transparent border-b border-gray-200">
                  <div className="font-bold text-gray-800">Comparison</div>
                  <div className="text-center font-bold text-green-700">TaskClearers</div>
                  <div className="text-center font-semibold text-gray-500">Freelance Sites</div>
                  <div className="text-center font-semibold text-gray-500">Traditional Hiring</div>
                </div>

                {/* Table Body */}
                {[
                  { feature: "Time to Start", us: "3-5 Days", them1: "1-3 Weeks", them2: "2-3 Months" },
                  { feature: "Vetting Quality", us: "Top 1% Pre-Vetted", them1: "Hit or Miss", them2: "High (Time Consuming)" },
                  { feature: "Management", us: "Success Manager Included", them1: "Self-Managed", them2: "HR Heavy" },
                  { feature: "Replacement Cost", us: "Free & Immediate", them1: "Lost Time/Money", them2: "Expensive Severance" },
                  { feature: "Training Required", us: "Minimal (Tool Ready)", them1: "Varies", them2: "Extensive" }
                ].map((row, i, arr) => (
                  <div
                    key={i}
                    className={`grid grid-cols-4 items-center p-5 transition-colors hover:bg-gray-50/50 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="font-semibold text-gray-800">{row.feature}</div>
                    <div className="text-center font-bold text-green-800">{row.us}</div>
                    <div className="text-center text-gray-600">{row.them1}</div>
                    <div className="text-center text-gray-600">{row.them2}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Services Grid */}
      <Section id="services" className="bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Roles we can take off your plate</h2>
            <p className="text-gray-600">Don't see what you need? We probably have it.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Executive Assistant", "Data Entry Specialist", "Customer Support", "CRM Manager",
              "Social Media Manager", "Lead Generator", "Project Coordinator", "Bookkeeper"
            ].map((role, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-gray-100 flex flex-col items-center gap-3 group">
                 <div className="p-2 bg-white rounded-full text-gray-400 group-hover:text-green-600 shadow-sm transition-colors">
                    <CheckCircle2 size={20} />
                 </div>
                 <span className="font-semibold text-gray-800">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
      
      {/* FAQ Section */}
      <Section id="faq" className="bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
            <p className="text-gray-600">Everything you need to know about working with TaskClearers.</p>
          </div>
          
          <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <AccordionItem 
              question="Are the workers full-time or part-time?"
              answer="We provide flexible arrangements to suit your needs. You can begin with as little as 10 hours per week or hire a full-time dedicated professional, depending on your workload."
            />
            <AccordionItem
              question="Where are your assistants located?"
              answer="Our talent pool is global, which allows us to find the best skills at competitive rates. All our workers are fluent in English and can work during your preferred business hours."
            />
            <AccordionItem
              question="What if it's not a good fit?"
              answer="We offer a replacement guarantee. If you feel that your assigned professional isn't the right match during the first week, we will pair you with a new team member at no additional cost."
            />
            <AccordionItem
              question="Do I need to train them?"
              answer="Our workers come pre-trained on standard remote work tools like Slack, Zoom, and Google Workspace. You will only need to familiarize them with your specific company processes."
            />
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="py-20">
        <div className="container mx-auto px-4">
           <div className="bg-green-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white opacity-10"></div>

              <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to reclaim your time?</h2>
              <p className="text-green-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
                Scale your business faster by delegating your busy work to TaskClearers.
                There is zero risk, and you can cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <Button variant="white" className="text-lg px-10 py-4" onClick={openBooking}>
                  Book a Discovery Call
                </Button>
              </div>
           </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <Logo />
            <div className="text-sm text-gray-500">
              © 2024 TaskClearers. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}