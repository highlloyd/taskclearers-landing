'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, LayoutGrid, List, Building, DollarSign, User, Calendar, X } from 'lucide-react';
import SalesLeadStatusBadge from './SalesLeadStatusBadge';
import SalesLeadKanbanBoard from './SalesLeadKanbanBoard';
import { SalesLeadData } from './SalesLeadCard';

interface AdminUser {
  id: string;
  name: string | null;
}

interface SalesLeadsClientProps {
  leads: SalesLeadData[];
  sources: string[];
  assignees: AdminUser[];
}

export default function SalesLeadsClient({ leads, sources, assignees }: SalesLeadsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = searchParams.get('view') || 'table';
  const stageFilter = searchParams.get('stage') || '';
  const sourceFilter = searchParams.get('source') || '';
  const assigneeFilter = searchParams.get('assignee') || '';
  const searchQuery = searchParams.get('search') || '';

  const [search, setSearch] = useState(searchQuery);
  const [stage, setStage] = useState(stageFilter);
  const [source, setSource] = useState(sourceFilter);
  const [assignee, setAssignee] = useState(assigneeFilter);
  const [localLeads, setLocalLeads] = useState(leads);

  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/admin/sales?${newParams.toString()}`);
  };

  const setView = (newView: 'table' | 'kanban') => {
    updateURL({ view: newView });
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ search, stage, source, assignee });
  };

  const clearFilters = () => {
    setSearch('');
    setStage('');
    setSource('');
    setAssignee('');
    updateURL({ search: '', stage: '', source: '', assignee: '' });
  };

  const hasFilters = search || stage || source || assignee;

  const filteredLeads = useMemo(() => {
    let result = localLeads;

    if (stageFilter) {
      result = result.filter((l) => l.stage === stageFilter);
    }

    if (sourceFilter) {
      result = result.filter((l) => l.source === sourceFilter);
    }

    if (assigneeFilter) {
      result = result.filter((l) => l.assignedToName === assigneeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.companyName.toLowerCase().includes(query) ||
          l.contactName.toLowerCase().includes(query) ||
          l.contactEmail.toLowerCase().includes(query)
      );
    }

    return result;
  }, [localLeads, stageFilter, sourceFilter, assigneeFilter, searchQuery]);

  const handleStageChange = async (leadId: string, newStage: string) => {
    const response = await fetch(`/api/admin/sales/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });

    if (!response.ok) {
      throw new Error('Failed to update stage');
    }

    setLocalLeads((leads) =>
      leads.map((lead) =>
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      )
    );
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  // Calculate pipeline stats
  const stats = useMemo(() => {
    const totalLeads = localLeads.length;
    const totalValue = localLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const wonLeads = localLeads.filter((l) => l.stage === 'won');
    const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const activeLeads = localLeads.filter((l) => !['won', 'lost'].includes(l.stage));
    const activeValue = activeLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    return { totalLeads, totalValue, wonValue, activeValue, activeLeads: activeLeads.length };
  }, [localLeads]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Sales Pipeline</h1>
        <div className="flex items-center gap-2 sm:gap-3">
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
          <Link
            href="/admin/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pipeline Value</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.activeValue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Leads</p>
          <p className="text-2xl font-bold text-blue-600">{stats.activeLeads}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Won Value</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(stats.wonValue)}
          </p>
        </div>
      </div>

      {view === 'table' && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-3 md:p-4 border-b border-gray-200">
            <form onSubmit={handleFilter} className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:gap-4">
              <div className="w-full md:flex-1 md:min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by company, contact, or email..."
                    className="w-full pl-10 pr-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 md:flex md:gap-4">
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full md:w-auto px-2 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">All Stages</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full md:w-auto px-2 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">All Sources</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full md:w-auto px-2 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-sm"
                >
                  <option value="">All Assignees</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.name || a.id}>{a.name || a.id}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 md:gap-4">
                <button
                  type="submit"
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Filter
                </button>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredLeads.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                {hasFilters ? (
                  <>No leads match your filters. <button onClick={clearFilters} className="text-green-600 hover:text-green-700">Clear filters</button></>
                ) : (
                  <>No leads yet. <Link href="/admin/sales/new" className="text-green-600 hover:text-green-700">Add your first lead</Link></>
                )}
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/sales/${lead.id}`}
                  className="block px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="font-medium text-gray-900 truncate">{lead.companyName}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{lead.contactName}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {lead.estimatedValue && (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(lead.estimatedValue, lead.currency || 'USD')}
                          </span>
                        )}
                        <span>{lead.createdAt?.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <SalesLeadStatusBadge stage={lead.stage} />
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {hasFilters ? (
                        <>No leads match your filters. <button onClick={clearFilters} className="text-green-600 hover:text-green-700">Clear filters</button></>
                      ) : (
                        <>No leads yet. <Link href="/admin/sales/new" className="text-green-600 hover:text-green-700">Add your first lead</Link></>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/admin/sales/${lead.id}`} className="block">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <p className="font-medium text-gray-900 hover:text-green-600">
                              {lead.companyName}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{lead.contactName}</p>
                            <p className="text-xs text-gray-500">{lead.contactEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <SalesLeadStatusBadge stage={lead.stage} />
                      </td>
                      <td className="px-6 py-4">
                        {lead.estimatedValue ? (
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {formatCurrency(lead.estimatedValue, lead.currency || 'USD')}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {lead.source || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {lead.createdAt?.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/sales/${lead.id}`}
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
        <SalesLeadKanbanBoard
          leads={filteredLeads}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  );
}
