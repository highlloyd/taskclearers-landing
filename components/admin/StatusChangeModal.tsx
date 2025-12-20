'use client';

import { useState, useEffect } from 'react';
import { X, Mail, SkipForward } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  triggerStatus: string | null;
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newStatus: string;
  applicantName: string;
  onConfirm: (sendEmail: boolean, templateId?: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  rejected: 'Rejected',
  interviewed: 'Interviewed',
  offered: 'Offered',
};

const STATUS_EMAIL_PROMPTS: Record<string, string> = {
  rejected: 'Would you like to send a rejection email to the applicant?',
  interviewed: 'Would you like to send an interview invitation to the applicant?',
  offered: 'Would you like to send an offer letter to the applicant?',
};

export default function StatusChangeModal({
  isOpen,
  onClose,
  newStatus,
  applicantName,
  onConfirm,
}: StatusChangeModalProps) {
  const [suggestedTemplateId, setSuggestedTemplateId] = useState<string | undefined>();

  useEffect(() => {
    if (isOpen) {
      fetchSuggestedTemplate();
    }
  }, [isOpen, newStatus]);

  async function fetchSuggestedTemplate() {
    try {
      const res = await fetch('/api/admin/email-templates');
      if (res.ok) {
        const templates: EmailTemplate[] = await res.json();
        const suggested = templates.find(t => t.triggerStatus === newStatus);
        setSuggestedTemplateId(suggested?.id);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }

  if (!isOpen) return null;

  const statusLabel = STATUS_LABELS[newStatus] || newStatus;
  const promptMessage = STATUS_EMAIL_PROMPTS[newStatus] || 'Would you like to send an email to the applicant?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Status Changed to {statusLabel}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-2">
            You are changing the status for <strong>{applicantName}</strong>.
          </p>
          <p className="text-gray-600">
            {promptMessage}
          </p>
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
            onClick={() => onConfirm(false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <SkipForward className="w-4 h-4" />
            Skip Email
          </button>
          <button
            type="button"
            onClick={() => onConfirm(true, suggestedTemplateId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
