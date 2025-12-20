'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Mail, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import SalesLeadStatusBadge, { stageLabels } from './SalesLeadStatusBadge';
import SalesLeadEmailComposeModal from './SalesLeadEmailComposeModal';

interface Note {
  id: string;
  content: string;
  category: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  adminUserId: string;
  adminName: string | null;
  adminEmail: string | null;
}

interface SentEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  adminName: string | null;
  adminEmail: string | null;
  templateName: string | null;
}

interface SalesLeadDetailClientProps {
  leadId: string;
  initialNotes: Note[];
  currentUserId?: string;
  lead: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    stage: string;
    estimatedValue: number | null;
    currency: string | null;
  };
}

const categoryColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  call: 'bg-blue-100 text-blue-700',
  meeting: 'bg-purple-100 text-purple-700',
  email: 'bg-green-100 text-green-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
};

const categoryLabels: Record<string, string> = {
  general: 'General',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  follow_up: 'Follow Up',
};

export default function SalesLeadDetailClient({
  leadId,
  initialNotes,
  currentUserId,
  lead,
}: SalesLeadDetailClientProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Stage change state
  const [showStageModal, setShowStageModal] = useState(false);
  const [newStage, setNewStage] = useState(lead.stage);
  const [lostReason, setLostReason] = useState('');
  const [stageLoading, setStageLoading] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Email history state
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Fetch email history
  const fetchEmails = async () => {
    try {
      const res = await fetch(`/api/admin/sales/${leadId}/email`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setEmailsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [leadId]);

  const handleEmailSent = () => {
    fetchEmails();
    router.refresh();
  };

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sales/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, category: noteCategory }),
      });

      if (res.ok) {
        setNewNote('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit note
  const handleEditNote = async (noteId: string) => {
    if (!editingContent.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sales/${leadId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, content: editingContent }),
      });

      if (res.ok) {
        setEditingNoteId(null);
        setEditingContent('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await fetch(`/api/admin/sales/${leadId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Change stage
  const handleStageChange = async () => {
    if (newStage === lead.stage) {
      setShowStageModal(false);
      return;
    }
    setStageLoading(true);

    try {
      const body: { stage: string; lostReason?: string } = { stage: newStage };
      if (newStage === 'lost' && lostReason) {
        body.lostReason = lostReason;
      }

      const res = await fetch(`/api/admin/sales/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowStageModal(false);
        setLostReason('');
        router.refresh();
      }
    } finally {
      setStageLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowStageModal(true)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Change Stage
        </button>
        <button
          onClick={() => setShowEmailModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          <Mail className="w-4 h-4" />
          Send Email
        </button>
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

        {/* Add Note Form */}
        <div className="mb-6">
          <div className="flex gap-2 mb-2">
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            >
              <option value="general">General</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
              <option value="email">Email</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this lead..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
          />
          <div className="mt-2">
            <Button onClick={handleAddNote} disabled={loading || !newNote.trim()} variant="primary">
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border-l-4 border-gray-200 pl-4 py-2">
              {editingNoteId === note.id ? (
                <div>
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => handleEditNote(note.id)} disabled={loading} variant="primary">
                      Save
                    </Button>
                    <Button onClick={() => setEditingNoteId(null)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full mb-2 ${categoryColors[note.category || 'general']}`}>
                        {categoryLabels[note.category || 'general']}
                      </span>
                      <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                    </div>
                    {note.adminUserId === currentUserId && (
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingContent(note.content);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {note.adminName || note.adminEmail} &middot;{' '}
                    {note.createdAt?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {note.updatedAt && note.updatedAt !== note.createdAt && ' (edited)'}
                  </p>
                </>
              )}
            </div>
          ))}

          {notes.length === 0 && (
            <p className="text-gray-500 text-sm">No notes yet. Add the first note above.</p>
          )}
        </div>
      </div>

      {/* Email History Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email History</h2>

        {emailsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
          </div>
        ) : emails.length === 0 ? (
          <p className="text-gray-500 text-sm">No emails sent yet.</p>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <div key={email.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedEmailId(expandedEmailId === email.id ? null : email.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {email.status === 'sent' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : email.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{email.subject}</p>
                      <p className="text-xs text-gray-500">
                        {email.adminName || email.adminEmail} &middot;{' '}
                        {new Date(email.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {email.templateName && (
                          <span className="ml-2 text-gray-400">
                            (Template: {email.templateName.replace(/_/g, ' ')})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {expandedEmailId === email.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {expandedEmailId === email.id && (
                  <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">To: </span>
                      <span className="text-sm text-gray-900">{email.recipientEmail}</span>
                    </div>
                    {email.status === 'failed' && email.errorMessage && (
                      <div className="mb-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                        Error: {email.errorMessage}
                      </div>
                    )}
                    <div
                      className="prose prose-sm max-w-none text-gray-700 bg-white p-3 rounded border border-gray-200"
                      dangerouslySetInnerHTML={{ __html: email.body }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stage Change Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Stage</h3>
              <button onClick={() => setShowStageModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stage</label>
                <SalesLeadStatusBadge stage={lead.stage} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {newStage === 'lost' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Loss</label>
                  <textarea
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    rows={3}
                    placeholder="Why was this lead lost?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleStageChange} disabled={stageLoading} variant="primary">
                  {stageLoading ? 'Updating...' : 'Update Stage'}
                </Button>
                <Button onClick={() => setShowStageModal(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      <SalesLeadEmailComposeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        leadId={leadId}
        contactName={lead.contactName}
        contactEmail={lead.contactEmail}
        companyName={lead.companyName}
        onEmailSent={handleEmailSent}
      />
    </div>
  );
}
