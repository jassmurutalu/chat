'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle } from 'lucide-react'

type Props = {
  onClose: () => void
  orgId: string
}

export default function TelegramSetup({ onClose, orgId }: Props) {
  const [step, setStep] = useState(1)
  const [botToken, setBotToken] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [botInfo, setBotInfo] = useState<any>(null)

  async function verifyBot() {
    if (!botToken) {
      setError('Please enter a bot token')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/integrations/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, orgId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify bot')
      }

      setBotInfo(data.bot)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function setupWebhook() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/integrations/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, orgId, webhookUrl: webhookUrl || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup webhook')
      }

      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Connect Telegram Bot</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Enter Bot Token */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 1: Create a Telegram Bot</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Open Telegram and search for <strong>@BotFather</strong></li>
                  <li>Send the command: <code className="bg-gray-100 px-2 py-1 rounded">/newbot</code></li>
                  <li>Follow the instructions to create your bot</li>
                  <li>Copy the bot token provided by BotFather</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your bot token should look like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Webhook URL <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://yourdomain.com (leave empty to use default)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  If you want to use a custom domain for webhooks, enter it here. Otherwise, the default from environment will be used.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={verifyBot}
                disabled={loading || !botToken}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Bot'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Confirm Bot Info */}
          {step === 2 && botInfo && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Bot Verified!</h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Bot Name:</strong> {botInfo.first_name}</p>
                <p><strong>Username:</strong> @{botInfo.username}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Step 2: Setup Webhook</h3>
                <p className="text-gray-600 mb-3">
                  We'll configure your bot to send messages to your workspace.
                  This happens automatically.
                </p>
                {webhookUrl && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">Custom webhook URL will be used:</p>
                    <code className="text-xs text-blue-700 break-all">{webhookUrl}/api/webhooks/telegram/{orgId}</code>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={setupWebhook}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Setup Webhook'
                )}
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  All Set!
                </h3>
                <p className="text-gray-600">
                  Your Telegram bot is now connected and ready to receive messages.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="font-semibold mb-2">Test your bot:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Open Telegram and find your bot (@{botInfo?.username})</li>
                  <li>Send a message to your bot</li>
                  <li>Check your conversations list - it should appear!</li>
                </ol>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
