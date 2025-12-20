'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Pencil, Trash2, Check, X, UserPlus } from 'lucide-react';
import { statusLabels } from '@/components/admin/StatusBadge';
import EmailComposeModal from '@/components/admin/EmailComposeModal';
import StatusChangeModal from '@/components/admin/StatusChangeModal';

interface Note {
  id: string;
  content: string;
  createdAt: Date | null;
  adminUserId: string;
  adminName: string | null;
  adminEmail: string | null;
}

interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
}

interface Props {
  applicationId: string;
  notes: Note[];
  currentStatus: string;
  currentUserId?: string;
  application: ApplicationData;
  onEmailSent?: () => void;
}

// Statuses that should prompt for email
const EMAIL_PROMPT_STATUSES = ['rejected', 'interviewed', 'offered'];

export default function ApplicationActions({
  applicationId,
  notes,
  currentStatus,
  currentUserId,
  application,
  onEmailSent,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Modal states
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [showEmailComposeModal, setShowEmailComposeModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [suggestedTemplateId, setSuggestedTemplateId] = useState<string | undefined>();

  // Note edit/delete states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handleStatusSelectChange = (newStatus: string) => {
    if (newStatus === status) return;

    // Check if this status should prompt for email
    if (EMAIL_PROMPT_STATUSES.includes(newStatus)) {
      setPendingStatus(newStatus);
      setShowStatusChangeModal(true);
    } else {
      // Directly update status without email prompt
      updateStatus(newStatus);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setStatus(newStatus);
      router.refresh();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeConfirm = (sendEmail: boolean, templateId?: string) => {
    setShowStatusChangeModal(false);

    if (pendingStatus) {
      // Update the status first
      updateStatus(pendingStatus);

      if (sendEmail) {
        // Open email compose modal with suggested template
        setSuggestedTemplateId(templateId);
        setShowEmailComposeModal(true);
      }
    }

    setPendingStatus(null);
  };

  const handleStatusChangeCancel = () => {
    setShowStatusChangeModal(false);
    setPendingStatus(null);
  };

  const handleComposeEmail = () => {
    setSuggestedTemplateId(undefined);
    setShowEmailComposeModal(true);
  };

  const handleEmailSent = () => {
    onEmailSent?.();
    router.refresh();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });
      setNoteContent('');
      router.refresh();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingNoteContent.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: editingNoteId, content: editingNoteContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to update note:', data.error);
        return;
      }
      setEditingNoteId(null);
      setEditingNoteContent('');
      router.refresh();
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('Failed to delete note:', data.error);
        return;
      }
      setDeletingNoteId(null);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setLoading(false);
    }
  };

  const applicantName = `${application.firstName} ${application.lastName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Update Status
          </label>
          <select
            value={status}
            onChange={(e) => handleStatusSelectChange(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-6 flex gap-2">
          <button
            type="button"
            onClick={handleComposeEmail}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          {status === 'hired' && (
            <Link
              href={`/admin/employees/new?fromApplication=${applicationId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" />
              Convert to Employee
            </Link>
          )}
        </div>
      </div>

      <div>
        <form onSubmit={handleAddNote}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Note
          </label>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            placeholder="Add a note about this applicant..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white mb-2"
          />
          <button
            type="submit"
            disabled={loading || !noteContent.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Add Note
          </button>
        </form>
      </div>

      {notes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Previous Notes</h3>
          {notes.map((note) => {
            const isOwner = currentUserId === note.adminUserId;
            const isEditing = editingNoteId === note.id;
            const isDeleting = deletingNoteId === note.id;

            return (
              <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingNoteContent}
                      onChange={(e) => setEditingNoteContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading || !editingNoteContent.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isDeleting ? (
                  <div className="space-y-2">
                    <p className="text-gray-700">Are you sure you want to delete this note?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingNoteId(null)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-500">
                        {note.adminName || note.adminEmail} -{' '}
                        {note.createdAt?.toLocaleDateString()}
                      </p>
                      {isOwner && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEdit(note)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                            title="Edit note"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingNoteId(note.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Change Modal */}
      <StatusChangeModal
        isOpen={showStatusChangeModal}
        onClose={handleStatusChangeCancel}
        newStatus={pendingStatus || ''}
        applicantName={applicantName}
        onConfirm={handleStatusChangeConfirm}
      />

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={showEmailComposeModal}
        onClose={() => setShowEmailComposeModal(false)}
        applicationId={applicationId}
        applicantName={applicantName}
        applicantEmail={application.email}
        jobTitle={application.jobTitle || 'Unknown Position'}
        suggestedTemplateId={suggestedTemplateId}
        onEmailSent={handleEmailSent}
      />
    </div>
  );
}
