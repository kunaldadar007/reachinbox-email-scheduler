/**
 * Compose Email Modal Component
 * 
 * Modal form for composing and scheduling emails.
 * Supports manual email entry and CSV file upload.
 */

import { useState, useRef } from 'react';
import { scheduleEmail, scheduleEmailFromCSV } from '../services/api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ isOpen, onClose, onSuccess }: ComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(5000);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [useCSV, setUseCSV] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle CSV file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  // Parse recipients from text input
  const parseRecipients = (text: string): string[] => {
    return text
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0 && email.includes('@'));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Prevent double submission
    if (loading) {
      console.warn('[UI] Submit attempted while loading, ignoring');
      return;
    }
    
    console.log('[UI] Form submission started, setting loading = true');
    setLoading(true);

    try {
      // Validate form
      if (!subject || !body || !startTime) {
        throw new Error('Please fill in all required fields');
      }

      let response;
      
      if (useCSV) {
        if (!csvContent) {
          throw new Error('Please upload a CSV file');
        }

        // Schedule from CSV
        console.log('[UI] Scheduling from CSV');
        response = await scheduleEmailFromCSV({
          subject,
          body,
          csvData: csvContent,
          startTime: new Date(startTime).toISOString(),
          delayBetweenEmails,
          hourlyLimit,
        });
      } else {
        // Parse recipients
        const recipientList = parseRecipients(recipients);
        if (recipientList.length === 0) {
          throw new Error('Please enter at least one valid email address');
        }

        // Schedule emails
        console.log('[UI] Scheduling', recipientList.length, 'emails');
        response = await scheduleEmail({
          subject,
          body,
          recipients: recipientList,
          startTime: new Date(startTime).toISOString(),
          delayBetweenEmails,
          hourlyLimit,
        });
      }

      // Validate response
      if (!response) {
        throw new Error('No response from server');
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Invalid server response');
      }

      console.log('[UI] Scheduling successful:', response);
      console.log('[UI] Resetting form and state');
      
      // Reset form
      setSubject('');
      setBody('');
      setRecipients('');
      setStartTime('');
      setCsvFile(null);
      setCsvContent('');
      setUseCSV(false);
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      console.log('[UI] Calling onSuccess callback to refresh list');
      onSuccess();
      
      console.log('[UI] Closing modal');
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to schedule emails';
      console.error('[UI] Error during scheduling:', errorMessage, err);
      setError(errorMessage);
    } finally {
      console.log('[UI] Finally block: setting loading = false');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Count emails from CSV or manual input
  const emailCount = useCSV
    ? csvContent.split(/[,\n]/).filter((line) => line.trim().includes('@')).length
    : parseRecipients(recipients).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Compose Email</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Input method toggle */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useCSV}
                  onChange={() => setUseCSV(false)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Manual Entry</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useCSV}
                  onChange={() => setUseCSV(true)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">CSV Upload</span>
              </label>
            </div>

            {/* Recipients input */}
            {!useCSV ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients (comma or line-separated) *
                </label>
                <textarea
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  rows={4}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!useCSV}
                />
                {recipients && (
                  <p className="mt-1 text-sm text-gray-500">
                    {parseRecipients(recipients).length} email(s) detected
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CSV File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={useCSV}
                />
                {csvFile && (
                  <p className="mt-1 text-sm text-gray-500">
                    {csvFile.name} - {emailCount} email(s) detected
                  </p>
                )}
              </div>
            )}

            {/* Start time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Delay between emails */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay Between Emails (ms)
              </label>
              <input
                type="number"
                value={delayBetweenEmails}
                onChange={(e) => setDelayBetweenEmails(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Hourly limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Limit
              </label>
              <input
                type="number"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 100)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : `Schedule ${emailCount} Email(s)`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
