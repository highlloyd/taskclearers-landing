'use client';

import { useState, useEffect } from 'react';
import { Mail, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Clock, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface EmailThread {
  id: string;
  type: 'sent' | 'received';
  subject: string;
  body: string;
  timestamp: string | null;
  // Sent email fields
  status?: string;
  errorMessage?: string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  templateName?: string | null;
  // Received email fields
  fromEmail?: string;
  fromName?: string | null;
  bodyPreview?: string;
  isRead?: boolean;
}

interface EmailHistoryProps {
  applicationId: string;
  refreshTrigger?: number;
}

export default function EmailHistory({ applicationId, refreshTrigger }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [applicationId, refreshTrigger]);

  async function fetchEmails() {
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/emails`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/emails/sync', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.synced > 0) {
          // Refresh emails list
          await fetchEmails();
        }
      }
    } catch (err) {
      console.error('Failed to sync emails:', err);
    } finally {
      setSyncing(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getStatusIcon(email: EmailThread) {
    if (email.type === 'received') {
      return <ArrowDownLeft className="w-4 h-4 text-blue-500" />;
    }
    switch (email.status) {
      case 'sent':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  }

  function getTypeBadge(email: EmailThread) {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full';
    if (email.type === 'received') {
      return (
        <span className={`${baseClasses} bg-blue-100 text-blue-700`}>
          Reply
        </span>
      );
    }
    switch (email.status) {
      case 'sent':
        return <span className={`${baseClasses} bg-green-100 text-green-700`}>Sent</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-700`}>Failed</span>;
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-700`}>Pending</span>;
    }
  }

  const hasReplies = emails.some(e => e.type === 'received');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Thread
        </h2>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Thread
          {emails.length > 0 && (
            <span className="text-sm font-normal text-gray-500">({emails.length})</span>
          )}
          {hasReplies && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              Has replies
            </span>
          )}
        </h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
          title="Sync emails from mailbox"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {emails.length === 0 ? (
        <p className="text-gray-500 text-sm">No emails yet.</p>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`border rounded-lg overflow-hidden ${
                email.type === 'received' ? 'border-blue-200 bg-blue-50/30' : ''
              }`}
            >
              {/* Email header - clickable */}
              <button
                onClick={() => toggleExpand(email.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(email)}
                    <span className="font-medium text-gray-900 truncate">
                      {email.subject}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(email.timestamp)}
                    {email.type === 'sent' && (email.adminName || email.adminEmail) && (
                      <span> • Sent by {email.adminName || email.adminEmail}</span>
                    )}
                    {email.type === 'received' && (
                      <span> • From {email.fromName || email.fromEmail}</span>
                    )}
                    {email.templateName && (
                      <span className="ml-2 text-gray-400">
                        ({email.templateName.replace(/_/g, ' ')})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {getTypeBadge(email)}
                  {expandedId === email.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded body */}
              {expandedId === email.id && (
                <div className="border-t p-4 bg-gray-50">
                  {email.type === 'sent' && email.status === 'failed' && email.errorMessage && (
                    <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
                      Error: {email.errorMessage}
                    </div>
                  )}
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: email.body }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
