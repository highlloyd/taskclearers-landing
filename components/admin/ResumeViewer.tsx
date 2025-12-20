'use client';

import { useState } from 'react';
import { Download, FileText, Maximize2, Minimize2, X, ExternalLink } from 'lucide-react';

interface ResumeViewerProps {
  resumePath: string;
}

export default function ResumeViewer({ resumePath }: ResumeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fileUrl = `/api/files/${resumePath}`;
  const viewUrl = `${fileUrl}?inline=true`;
  const isPdf = resumePath.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    // For DOC/DOCX files, show download-only option
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">Resume</p>
            <p className="text-sm text-gray-500">Word document - download to view</p>
          </div>
        </div>
        <a
          href={fileUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Resume
        </a>
      </div>
    );
  }

  return (
    <>
      <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${isExpanded ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Resume</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <a
              href={fileUrl}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
        <div className="relative" style={{ height: '500px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-500">
              <FileText className="w-12 h-12 mb-3 text-gray-400" />
              <p className="mb-3">Unable to preview PDF</p>
              <a
                href={fileUrl}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Instead
              </a>
            </div>
          ) : (
            <iframe
              src={viewUrl}
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              title="Resume preview"
            />
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <a
              href={fileUrl}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-full p-12 pt-16">
            <iframe
              src={viewUrl}
              className="w-full h-full rounded-lg bg-white"
              title="Resume preview"
            />
          </div>
        </div>
      )}
    </>
  );
}
