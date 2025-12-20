'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

const SOURCES = ['website', 'referral', 'cold_call', 'linkedin', 'trade_show', 'email', 'other'];

export default function NewSalesLeadPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const estimatedValueRaw = formData.get('estimatedValue');
    const estimatedValue = estimatedValueRaw
      ? Math.round(parseFloat(estimatedValueRaw as string) * 100) // Convert to cents
      : null;

    const data = {
      companyName: formData.get('companyName'),
      contactName: formData.get('contactName'),
      contactEmail: formData.get('contactEmail'),
      contactPhone: formData.get('contactPhone') || null,
      stage: formData.get('stage') || 'new',
      estimatedValue,
      currency: formData.get('currency') || 'USD',
      source: formData.get('source') || null,
    };

    try {
      const res = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create lead');
      }

      const result = await res.json();
      router.push(`/admin/sales/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/sales"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sales Pipeline
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Add New Lead</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>

            <div className="mb-4">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder="e.g., Acme Corporation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Source
                </label>
                <select
                  name="source"
                  id="source"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="">Select source...</option>
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Stage
                </label>
                <select
                  name="stage"
                  id="stage"
                  defaultValue="new"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="contactName"
                  id="contactName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  placeholder="e.g., John Smith"
                />
              </div>
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  placeholder="john@acme.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                id="contactPhone"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Deal Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Value
                </label>
                <input
                  type="number"
                  name="estimatedValue"
                  id="estimatedValue"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  placeholder="10000"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  id="currency"
                  defaultValue="USD"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
            <Link href="/admin/sales">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
