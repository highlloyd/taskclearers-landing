"use client";

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { useAnalytics } from '../analytics/AnalyticsProvider';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
}

export default function ApplicationForm({ jobId, jobTitle }: ApplicationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const { trackEvent } = useAnalytics();

  // Track when user views the application form
  useEffect(() => {
    trackEvent('application_start', {}, jobId);
  }, [trackEvent, jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (file) {
      if (file.type !== 'application/pdf') {
        setFileError('Please upload a PDF file.');
        e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        e.target.value = '';
        return;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (fileError) {
      return;
    }

    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('jobId', jobId);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input type="text" name="firstName" id="firstName" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input type="text" name="lastName" id="lastName" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" name="email" id="email" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input type="tel" name="phone" id="phone" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
            <input
              type="file"
              name="resume"
              id="resume"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="mt-1 text-xs text-gray-500">PDF only, max {MAX_FILE_SIZE_MB}MB</p>
            {fileError && (
              <p className="mt-1 text-sm text-red-600">{fileError}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
            <textarea name="coverLetter" id="coverLetter" rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"></textarea>
          </div>
          {jobTitle === 'General Application' && (
            <div className="md:col-span-2">
              <label htmlFor="goodAt" className="block text-sm font-medium text-gray-700 mb-2">What would you be good at?</label>
              <textarea name="goodAt" id="goodAt" rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"></textarea>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Button type="submit" variant="primary" className="w-full py-3 text-lg" disabled={loading || !!fileError}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}
