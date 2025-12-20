'use client';

import { useState, useEffect } from 'react';
import { X, Send, Eye, Loader2, ChevronDown } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggerStatus: string | null;
}

interface EmailIdentity {
  id: string;
  email: string;
  name: string;
  label: string;
}

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  suggestedTemplateId?: string;
  onEmailSent?: () => void;
}

export default function EmailComposeModal({
  isOpen,
  onClose,
  applicationId,
  applicantName,
  applicantEmail,
  jobTitle,
  suggestedTemplateId,
  onEmailSent,
}: EmailComposeModalProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailIdentities, setEmailIdentities] = useState<EmailIdentity[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<string>('');

  // Fetch templates and email identities on mount
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      fetchEmailIdentities();
    }
  }, [isOpen]);

  async function fetchEmailIdentities() {
    try {
      const res = await fetch('/api/admin/email-identities?context=hiring');
      if (res.ok) {
        const data = await res.json();
        setEmailIdentities(data.identities);
        if (data.default && !selectedFrom) {
          setSelectedFrom(data.default);
        }
      }
    } catch (err) {
      console.error('Failed to fetch email identities:', err);
    }
  }

  // Set suggested template when available
  useEffect(() => {
    if (suggestedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id === suggestedTemplateId);
      if (template) {
        setSelectedTemplateId(template.id);
        setSubject(template.subject);
        setBody(template.body);
      }
    }
  }, [suggestedTemplateId, templates]);

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/email-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }

  function handleTemplateChange(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setSubject('');
      setBody('');
    }
    setPreviewHtml(null);
  }

  async function handlePreview() {
    if (!subject || !body) {
      setError('Please enter a subject and body');
      return;
    }

    setPreviewing(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          subject,
          body,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to preview email');
      }

      const data = await res.json();
      setPreviewHtml(data.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview email');
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSend() {
    if (!subject || !body) {
      setError('Please enter a subject and body');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId || null,
          subject,
          body,
          from: selectedFrom || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send email');
      }

      const data = await res.json();

      if (data.devMode) {
        alert('Email logged to console (Graph API not configured)');
      }

      onEmailSent?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  function insertPlaceholder(placeholder: string) {
    setBody(prev => prev + placeholder);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Compose Email</h2>
            <p className="text-sm text-gray-500">
              To: {applicantName} ({applicantEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Send As Selector */}
          {emailIdentities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send As
              </label>
              <select
                value={selectedFrom}
                onChange={(e) => setSelectedFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              >
                {emailIdentities.map((identity) => (
                  <option key={identity.email} value={identity.email}>
                    {identity.label} ({identity.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Template Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            >
              <option value="">Custom email (no template)</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>

          {/* Placeholder buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insert Placeholder
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: '{{applicant_name}}', label: 'Name' },
                { key: '{{applicant_first}}', label: 'First Name' },
                { key: '{{job_title}}', label: 'Job Title' },
                { key: '{{company_name}}', label: 'Company' },
                { key: '{{application_date}}', label: 'Applied Date' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertPlaceholder(key)}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body (HTML)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Enter email body (HTML supported)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 font-mono text-sm"
            />
          </div>

          {/* Preview */}
          {previewHtml && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview
              </label>
              <div
                className="border rounded-lg p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing || !subject || !body}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {previewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Preview
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !subject || !body}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
