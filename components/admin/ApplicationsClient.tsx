'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Search, LayoutGrid, List, MessageCircle, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';
import KanbanBoard from './KanbanBoard';
import { ApplicationData } from './ApplicationCard';

interface Job {
  id: string;
  title: string;
}

interface ApplicationsClientProps {
  applications: ApplicationData[];
  jobs: Job[];
}

export default function ApplicationsClient({ applications, jobs }: ApplicationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get('view') || 'table';
  const statusFilter = searchParams.get('status') || '';
  const jobFilter = searchParams.get('job') || '';
  const searchQuery = searchParams.get('search') || '';
  const dateFromFilter = searchParams.get('dateFrom') || '';
  const dateToFilter = searchParams.get('dateTo') || '';

  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(statusFilter);
  const [job, setJob] = useState(jobFilter);
  const [dateFrom, setDateFrom] = useState(dateFromFilter);
  const [dateTo, setDateTo] = useState(dateToFilter);
  const [localApplications, setLocalApplications] = useState(applications);

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/admin/applications?${newParams.toString()}`);
  };

  const setView = (newView: 'table' | 'kanban') => {
    updateURL({ view: newView });
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ search, status, job, dateFrom, dateTo });
  };

  const filteredApplications = useMemo(() => {
    let result = localApplications;

    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (jobFilter) {
      result = result.filter((a) => a.jobId === jobFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.firstName.toLowerCase().includes(query) ||
          a.lastName.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query)
      );
    }

    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((a) => {
        if (!a.createdAt) return false;
        const appDate = new Date(a.createdAt);
        return appDate >= fromDate;
      });
    }

    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((a) => {
        if (!a.createdAt) return false;
        const appDate = new Date(a.createdAt);
        return appDate <= toDate;
      });
    }

    return result;
  }, [localApplications, statusFilter, jobFilter, searchQuery, dateFromFilter, dateToFilter]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const response = await fetch(`/api/admin/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }

    // Update local state
    setLocalApplications((apps) =>
      apps.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                view === 'table'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors ${
                view === 'kanban'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
          </div>
          <a
            href="/api/admin/export?type=applications"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {view === 'table' && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleFilter} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              >
                <option value="">All Jobs</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    placeholder="From"
                    title="From date"
                  />
                </div>
                <span className="text-gray-400">–</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    placeholder="To"
                    title="To date"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className={`hover:bg-gray-50 ${app.hasReply ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {app.firstName} {app.lastName}
                            </p>
                            {app.hasReply && (
                              <span title="Has replied" className="flex-shrink-0">
                                <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-100" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{app.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {app.jobTitle}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {app.createdAt?.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'kanban' && (
        <KanbanBoard
          applications={filteredApplications}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
