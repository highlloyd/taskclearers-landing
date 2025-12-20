'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  salaryRange: string | null;
  isActive: boolean;
}

export default function EditJobPage() {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/admin/jobs/${id}`);
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError('Failed to load job');
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      department: formData.get('department'),
      location: formData.get('location'),
      description: formData.get('description'),
      salaryRange: formData.get('salaryRange') || null,
      isActive: formData.get('isActive') === 'on',
    };

    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update job');
      }

      router.push('/admin/jobs');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete job');
      }

      router.push('/admin/jobs');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Job not found</p>
        <Link href="/admin/jobs" className="text-green-600 hover:text-green-700 mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/jobs"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              defaultValue={job.title}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                id="department"
                required
                defaultValue={job.department}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                id="location"
                required
                defaultValue={job.location}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="salaryRange" className="block text-sm font-medium text-gray-700 mb-2">
              Salary Range (optional)
            </label>
            <input
              type="text"
              name="salaryRange"
              id="salaryRange"
              defaultValue={job.salaryRange || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              id="description"
              required
              rows={6}
              defaultValue={job.description}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={job.isActive}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Published (visible on careers page)
            </label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/admin/jobs">
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
