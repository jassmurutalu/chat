'use client'

import { useState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [webhookInfo, setWebhookInfo] = useState<any>(null)

  async function checkWebhook() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/telegram/setup')
      const data = await res.json()
      setWebhookInfo(data)
    } catch (error) {
      alert('Error checking webhook')
    } finally {
      setLoading(false)
    }
  }

  async function setupWebhook() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/telegram/setup', { method: 'POST' })
      const data = await res.json()
      alert(data.success ? 'Webhook set successfully!' : 'Failed to set webhook')
      checkWebhook()
    } catch (error) {
      alert('Error setting webhook')
    } finally {
      setLoading(false)
    }
  }

  async function assignConversations() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/assign-conversations', { method: 'POST' })
      const data = await res.json()
      alert(`Assigned ${data.assigned} conversations`)
    } catch (error) {
      alert('Error assigning conversations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="space-y-6">
        {/* Webhook Status */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Telegram Webhook</h2>
          <div className="space-y-3">
            <button
              onClick={checkWebhook}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Check Webhook Status
            </button>
            
            <button
              onClick={setupWebhook}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Setup Webhook
            </button>

            {webhookInfo && (
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(webhookInfo, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Conversation Management */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>
          <button
            onClick={assignConversations}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Assign Unassigned Conversations
          </button>
        </div>

        {/* Bot Info */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Bot Information</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Webhook URL:</strong></p>
            <code className="bg-gray-50 px-2 py-1 rounded block">
              {process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/telegram
            </code>
            <p className="text-gray-600 mt-4">
              To test: Send a message to your bot on Telegram, then check the conversations list.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}