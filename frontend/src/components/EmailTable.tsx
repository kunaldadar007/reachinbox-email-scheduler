/**
 * Email Table Component
 *
 * Displays scheduled or sent emails in a table format.
 * Shows loading and empty states.
 */

import { ScheduledEmail, SentEmail } from '../services/api';

interface EmailTableProps {
  emails: (ScheduledEmail | SentEmail)[];
  loading: boolean;
  type: 'scheduled' | 'sent';
}

// ✅ Safe date formatter (prevents Invalid Date)
const formatDate = (date?: string) => {
  if (!date) return '—';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

export default function EmailTable({ emails, loading, type }: EmailTableProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty state
  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No {type === 'scheduled' ? 'scheduled' : 'sent'} emails yet.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {type === 'scheduled'
            ? 'Schedule your first email using the "Compose Email" button above.'
            : 'Emails will appear here once they are sent.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Recipient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Subject
            </th>

            {type === 'scheduled' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            )}

            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {type === 'scheduled' ? 'Scheduled Time' : 'Sent At'}
            </th>

            {type === 'sent' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Message ID
              </th>
            )}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {emails.map((email, index) => {
            // ✅ Guaranteed unique key (no React warning)
            const key =
              (email as any).id ||
              (email as any)._id ||
              `${email.recipient_email}-${index}`;

            const status =
              'status' in email ? email.status?.toLowerCase() : '';

            return (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {email.recipient_email}
                </td>

                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={email.subject}>
                    {email.subject}
                  </div>
                </td>

                {type === 'scheduled' && 'status' in email && (
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : status === 'completed' || status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                )}

                <td className="px-6 py-4 text-sm text-gray-500">
                  {type === 'scheduled'
                    ? formatDate((email as ScheduledEmail).scheduled_time)
                    : formatDate((email as SentEmail).sent_at)}
                </td>

                {type === 'sent' && 'ethereal_message_id' in email && (
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {email.ethereal_message_id || '-'}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
