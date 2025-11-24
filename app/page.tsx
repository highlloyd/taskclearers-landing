"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Zap, 
  ShieldCheck, 
  Calendar, 
  Mail, 
  Database, 
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  HelpCircle,
  Plus,
  Clock,
  Briefcase,
  XCircle,
  Check
} from 'lucide-react';

// --- Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-500/30",
    outline: "border-2 border-green-600 text-green-700 hover:bg-green-50",
    ghost: "text-gray-600 hover:text-green-600 hover:bg-green-50/50",
    white: "bg-white text-green-700 hover:bg-gray-100 shadow-md"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Section = ({ children, className = "", id = "" }: any) => (
  <section id={id} className={`py-16 md:py-24 ${className}`}>
    {children}
  </section>
);

const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-xl md:text-2xl tracking-tight text-gray-900">
    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    </div>
    <span>Taskclearers</span>
  </div>
);

const AccordionItem = ({ question, answer }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        className="w-full py-6 flex items-center justify-between text-left hover:text-green-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-lg pr-4">{question}</span>
        <div className={`p-2 rounded-full bg-gray-50 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
          <Plus size={20} className="text-gray-500" />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-gray-600 leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
};

const FeatureBlock = ({ title, description, image, imagePosition = 'right', tags = [] }: any) => {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-12 mb-24 last:mb-0">
      <div className={`w-full lg:w-1/2 ${imagePosition === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
          <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
          <img src={image} alt={title} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
        </div>
      </div>
      <div className={`w-full lg:w-1/2 ${imagePosition === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
        <h3 className="text-3xl font-bold mb-4 text-gray-900">{title}</h3>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Logo />
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-green-700 font-medium">How It Works</button>
            <button onClick={() => scrollToSection('why-us')} className="text-gray-600 hover:text-green-700 font-medium">Why Us</button>
            <button onClick={() => scrollToSection('services')} className="text-gray-600 hover:text-green-700 font-medium">Services</button>
            <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-green-700 font-medium">FAQ</button>
            <Button variant="primary" className="py-2.5 px-5 text-sm">Book Discovery Call</Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b md:hidden shadow-xl flex flex-col p-4 gap-4 animate-in slide-in-from-top-5">
            <button onClick={() => scrollToSection('how-it-works')} className="text-left p-2 hover:bg-gray-50 rounded-lg">How It Works</button>
            <button onClick={() => scrollToSection('why-us')} className="text-left p-2 hover:bg-gray-50 rounded-lg">Why Us</button>
            <button onClick={() => scrollToSection('services')} className="text-left p-2 hover:bg-gray-50 rounded-lg">Services</button>
            <Button variant="primary" className="w-full justify-center">Book Discovery Call</Button>
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Available for immediate start
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6 text-gray-900">
                Clear Your To-Do List. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                  Pre-Trained Remote Workers
                </span> in 5-7 Days.
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg">
                Stop drowning in tasks. We provide vetted professionals ready to integrate with your tools instantly—so you can focus on growth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" className="text-lg px-8">
                  Start Clearing Tasks
                </Button>
                <Button variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+20}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p>Join our exclusive network</p>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-w-md mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
                 {/* Hero Image Placeholder */}
                 <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3] mb-6 group">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" 
                      alt="Professional working" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Floating Cards Overlay */}
                    <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce-slow">
                        <div className="bg-blue-100 p-2 rounded-md"><Mail size={16} className="text-blue-600"/></div>
                        <div className="text-xs font-bold text-gray-700">Inbox Zero</div>
                        <CheckCircle2 size={16} className="text-green-500 ml-auto" />
                    </div>

                    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce-slow delay-700">
                        <div className="bg-purple-100 p-2 rounded-md"><Database size={16} className="text-purple-600"/></div>
                        <div className="text-xs font-bold text-gray-700">CRM Updated</div>
                        <CheckCircle2 size={16} className="text-green-500 ml-auto" />
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

      {/* Social Proof / Trust Bar */}
      <div className="border-y border-gray-100 bg-gray-50/50 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Tools our experts are trained on</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['Slack', 'HubSpot', 'Salesforce', 'Asana', 'Zoom', 'Shopify'].map((brand) => (
              <span key={brand} className="text-xl md:text-2xl font-bold text-gray-400 hover:text-gray-800 cursor-default select-none">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* NEW: Stats Section */}
      <Section className="bg-green-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-green-500/50">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">1%</div>
              <div className="text-green-100 text-sm md:text-base">Acceptance Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24h</div>
              <div className="text-green-100 text-sm md:text-base">Average Start Time</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-green-100 text-sm md:text-base">Skill Sets</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-green-100 text-sm md:text-base">Replacement Guarantee</div>
            </div>
          </div>
        </div>
      </Section>

      {/* EXPANDED: Detailed Features (Zig Zag) */}
      <Section id="why-us" className="bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">More than just a freelancer platform</h2>
            <p className="text-gray-600 text-lg">We manage the talent lifecycle so you can manage your business.</p>
          </div>

          <FeatureBlock 
            title="Rigorous 4-Step Vetting" 
            description="We don't just let anyone in. Our candidates pass English fluency tests, logic assessments, and behavioral interviews. We filter out 99% of applicants so you only see the top 1%."
            image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800"
            imagePosition="right"
            tags={['Identity Verification', 'Skill Assessment', 'Video Interview']}
          />

          <FeatureBlock 
            title="Seamless Tech Integration" 
            description="Our remote workers are digital natives. They plug directly into your Slack, manage your Jira tickets, and update your HubSpot CRM without needing basic training."
            image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
            imagePosition="left"
            tags={['Slack Native', 'Google Workspace', 'Asana Expert']}
          />

          <FeatureBlock 
            title="Dedicated Success Manager" 
            description="You are never alone. Every account gets a dedicated Customer Success Manager to handle payroll, compliance, and performance reviews, ensuring your new hire succeeds."
            image="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800"
            imagePosition="right"
            tags={['Performance Reviews', 'Payroll Handled', 'Dispute Resolution']}
          />
        </div>
      </Section>

      {/* NEW: Comparison Table */}
      <Section className="bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why we win against the alternatives</h2>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[700px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-4 p-6 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                <div className="col-span-1">Comparison</div>
                <div className="col-span-1 text-center text-green-600">Taskclearers</div>
                <div className="col-span-1 text-center text-gray-400">Freelance Sites</div>
                <div className="col-span-1 text-center text-gray-400">Traditional Hiring</div>
              </div>

              {[
                { feature: "Time to Start", us: "3-5 Days", them1: "1-3 Weeks", them2: "2-3 Months" },
                { feature: "Vetting Quality", us: "Top 1% Pre-Vetted", them1: "Hit or Miss", them2: "High (Time Consuming)" },
                { feature: "Management", us: "Success Manager Included", them1: "Self-Managed", them2: "HR Heavy" },
                { feature: "Replacement Cost", us: "Free & Immediate", them1: "Lost Time/Money", them2: "Expensive Severance" },
                { feature: "Training Required", us: "Minimal (Tool Ready)", them1: "Varies", them2: "Extensive" }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-4 p-6 border-b border-gray-100 hover:bg-green-50/10 transition-colors items-center">
                   <div className="col-span-1 font-semibold text-gray-800">{row.feature}</div>
                   <div className="col-span-1 text-center font-bold text-green-700 bg-green-50 py-2 rounded-lg">{row.us}</div>
                   <div className="col-span-1 text-center text-gray-500">{row.them1}</div>
                   <div className="col-span-1 text-center text-gray-500">{row.them2}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section id="how-it-works" className="bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            
            <div className="w-full md:w-1/2">
               <h2 className="text-3xl md:text-4xl font-bold mb-6">How we clear your tasks in 3 simple steps</h2>
               <p className="text-gray-400 text-lg mb-8">No lengthy interviews. No contracts. Just results.</p>
               <Button variant="white">Get Started Now</Button>
            </div>

            <div className="w-full md:w-1/2 space-y-6">
              {[
                { step: "01", title: "Book a Discovery Call", desc: "Tell us about your bottlenecks and the tools you use." },
                { step: "02", title: "Get Matched Expertly", desc: "We select the perfect pre-trained pro from our bench to match your specific needs." },
                { step: "03", title: "Start Clearing Tasks", desc: "Your new team member joins your Slack and starts working efficiently." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                   <div className="text-4xl font-bold text-gray-700 group-hover:text-green-500 transition-colors">
                     {item.step}
                   </div>
                   <div>
                     <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                     <p className="text-gray-400">{item.desc}</p>
                   </div>
                </div>
              ))}
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
            <p className="text-gray-600">Everything you need to know about working with Taskclearers.</p>
          </div>
          
          <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <AccordionItem 
              question="Are the workers full-time or part-time?" 
              answer="We offer flexible arrangements. You can start with as little as 10 hours a week or hire a full-time dedicated professional depending on your workload."
            />
            <AccordionItem 
              question="Where are your assistants located?" 
              answer="Our talent pool is global, allowing us to find the best skills at competitive rates. All workers are fluent in English and work during your preferred business hours."
            />
            <AccordionItem 
              question="What if it's not a good fit?" 
              answer="We have a replacement guarantee. If you feel your assigned pro isn't the right match in the first week, we will pair you with a new team member at no extra cost."
            />
            <AccordionItem 
              question="Do I need to train them?" 
              answer="Our workers come pre-trained on standard remote work tools (Slack, Zoom, Google Workspace). You only need to show them your specific company processes."
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
                Join forward-thinking founders who are scaling their business by delegating to Taskclearers. 
                Zero risk, cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <Button variant="white" className="text-lg px-10 py-4">
                  Book Your Discovery Call
                </Button>
              </div>
           </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Logo />
              <p className="mt-4 text-gray-500 max-w-xs">
                We provide pre-trained, vetted remote professionals to help growing businesses scale without the hiring headaches.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600">About Us</a></li>
                <li><a href="#" className="hover:text-green-600">Careers</a></li>
                <li><a href="#" className="hover:text-green-600">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-green-600">Twitter</a></li>
                <li><a href="#" className="hover:text-green-600">LinkedIn</a></li>
                <li><a href="#" className="hover:text-green-600">Contact Sales</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-100 text-gray-400 text-sm">
            © {new Date().getFullYear()} Taskclearers. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}