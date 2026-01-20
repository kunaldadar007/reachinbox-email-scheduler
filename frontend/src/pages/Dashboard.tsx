/**
 * Dashboard Page Component
 *
 * Main dashboard with tabs for scheduled and sent emails.
 * Includes compose email button and email tables.
 */

import { useState, useEffect } from 'react';
import {
  getScheduledEmails,
  getSentEmails,
  ScheduledEmail,
  SentEmail,
} from '../services/api';
import ComposeModal from '../components/ComposeModal';
import EmailTable from '../components/EmailTable';

type TabType = 'scheduled' | 'sent';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔹 Fetch scheduled emails (FIXED)
  const fetchScheduledEmails = async () => {
    console.log('[Dashboard] Fetching scheduled emails');
    setLoadingScheduled(true);

    try {
      const response = await getScheduledEmails(1, 100);
      console.log('[Dashboard] Scheduled emails response:', response);

      const rawData = response.data || [];

      // ✅ NORMALIZE ARRAY-BASED RESPONSE → OBJECTS
      const normalizedEmails: ScheduledEmail[] = rawData.map(
        (item: any, index: number) => {
          if (Array.isArray(item)) {
            return {
              recipient_email: item[0],
              subject: item[1],
              body: item[2],
              scheduled_time: item[3],
              status: item[4] || 'pending',
              id: item[5] ?? `scheduled-${index}`,
            };
          }
          return item;
        }
      );

      setScheduledEmails(normalizedEmails);
      console.log(
        '[Dashboard] Updated state with',
        normalizedEmails.length,
        'emails'
      );
    } catch (error) {
      console.error('[Dashboard] Failed to fetch scheduled emails:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  // 🔹 Fetch sent emails (kept safe)
  const fetchSentEmails = async () => {
    console.log('[Dashboard] Fetching sent emails');
    setLoadingSent(true);

    try {
      const response = await getSentEmails(1, 100);
      console.log('[Dashboard] Sent emails response:', response);

      setSentEmails(response.data || []);
      console.log(
        '[Dashboard] Updated state with',
        (response.data || []).length,
        'emails'
      );
    } catch (error) {
      console.error('[Dashboard] Failed to fetch sent emails:', error);
    } finally {
      setLoadingSent(false);
    }
  };

  // Load emails on mount & tab switch
  useEffect(() => {
    if (activeTab === 'scheduled') {
      fetchScheduledEmails();
    } else {
      fetchSentEmails();
    }
  }, [activeTab]);

  // Refresh after scheduling email
  const handleScheduleSuccess = () => {
    console.log('[Dashboard] Schedule success callback triggered');
    fetchScheduledEmails();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Email Dashboard
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Compose Email
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scheduled Emails
              {scheduledEmails.length > 0 && (
                <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  {scheduledEmails.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sent Emails
              {sentEmails.length > 0 && (
                <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                  {sentEmails.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'scheduled' ? (
            <EmailTable
              emails={scheduledEmails}
              loading={loadingScheduled}
              type="scheduled"
            />
          ) : (
            <EmailTable
              emails={sentEmails}
              loading={loadingSent}
              type="sent"
            />
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  );
}
