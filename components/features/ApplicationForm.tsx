"use client";

import React,  { useState } from 'react';
import Button from '../ui/Button';

interface ApplicationFormProps {
  jobTitle: string;
}

export default function ApplicationForm({ jobTitle }: ApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-green-800 mb-4">Thank you for applying!</h3>
        <p className="text-green-700">We have received your application for the {jobTitle} position and will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold mb-6">Apply for {jobTitle}</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input type="text" name="firstName" id="firstName" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input type="text" name="lastName" id="lastName" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" name="email" id="email" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" name="phone" id="phone" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
            <input type="file" name="resume" id="resume" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
            <textarea name="coverLetter" id="coverLetter" rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"></textarea>
          </div>
        </div>
        <div className="mt-8">
          <Button type="submit" variant="primary" className="w-full py-3 text-lg">Submit Application</Button>
        </div>
      </form>
    </div>
  );
}
