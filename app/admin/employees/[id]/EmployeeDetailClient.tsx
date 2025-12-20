'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Upload, FileText, Download, X, Send, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmployeeEmailComposeModal from '@/components/admin/EmployeeEmailComposeModal';

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

interface Document {
  id: string;
  name: string;
  type: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  uploadedByName: string | null;
}

interface EmployeeDetailClientProps {
  employeeId: string;
  initialNotes: Note[];
  initialDocuments: Document[];
  currentUserId?: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    role: string;
    status: string;
  };
}

const categoryColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  performance: 'bg-blue-100 text-blue-700',
  feedback: 'bg-purple-100 text-purple-700',
  hr: 'bg-yellow-100 text-yellow-700',
};

const documentTypeLabels: Record<string, string> = {
  contract: 'Contract',
  id_document: 'ID Document',
  tax_form: 'Tax Form',
  certification: 'Certification',
  other: 'Other',
};

export default function EmployeeDetailClient({
  employeeId,
  initialNotes,
  initialDocuments,
  currentUserId,
  employee,
}: EmployeeDetailClientProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [documents, setDocuments] = useState(initialDocuments);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Document upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('other');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Status change state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState(employee.status);
  const [statusLoading, setStatusLoading] = useState(false);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/employees/${employeeId}/notes`, {
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
      const res = await fetch(`/api/admin/employees/${employeeId}/notes`, {
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
      const res = await fetch(`/api/admin/employees/${employeeId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Upload document
  const handleUploadDocument = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);
      formData.append('type', uploadType);
      formData.append('description', uploadDescription);

      const res = await fetch(`/api/admin/employees/${employeeId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowUpload(false);
        setUploadFile(null);
        setUploadName('');
        setUploadType('other');
        setUploadDescription('');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to upload document');
      }
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/admin/employees/${employeeId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Change status
  const handleStatusChange = async () => {
    if (newStatus === employee.status) {
      setShowStatusModal(false);
      return;
    }
    setStatusLoading(true);

    try {
      const res = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setShowStatusModal(false);
        router.refresh();
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowStatusModal(true)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Change Status
        </button>
        <button
          onClick={() => setShowEmailModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          <Mail className="w-4 h-4" />
          Send Email
        </button>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {documentTypeLabels[doc.type]} &middot; {formatFileSize(doc.fileSize)} &middot; {doc.uploadedByName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/files/${doc.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="general">General</option>
              <option value="performance">Performance</option>
              <option value="feedback">Feedback</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
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
                        {note.category || 'general'}
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

      {/* Upload Document Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File *</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      if (!uploadName) setUploadName(file.name);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Name *</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="contract">Contract</option>
                  <option value="id_document">ID Document</option>
                  <option value="tax_form">Tax Form</option>
                  <option value="certification">Certification</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleUploadDocument} disabled={uploading || !uploadFile || !uploadName.trim()} variant="primary">
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button onClick={() => setShowUpload(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Change Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleStatusChange} disabled={statusLoading} variant="primary">
                  {statusLoading ? 'Updating...' : 'Update Status'}
                </Button>
                <Button onClick={() => setShowStatusModal(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      <EmployeeEmailComposeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        employeeId={employeeId}
        employee={employee}
        onEmailSent={() => router.refresh()}
      />
    </div>
  );
}
