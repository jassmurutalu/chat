'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { MessageSquare, CheckCircle, XCircle, Plus, Settings, ArrowLeft } from 'lucide-react'
import TelegramSetup from '@/components/integrations/TelegramSetup'
import MessengerSetup from '@/components/integrations/MessengerSetup'
import WhatsAppSetup from '@/components/integrations/WhatsAppSetup'

type Integration = {
  id: string
  platform: 'telegram' | 'messenger' | 'whatsapp'
  status: 'pending' | 'active' | 'error' | 'disconnected'
  telegram_bot_username?: string
  messenger_page_id?: string
  whatsapp_phone_number_id?: string
  error_message?: string
  created_at: string
}

export default function IntegrationsPage() {
  const { currentOrg } = useOrganization()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [setupPlatform, setSetupPlatform] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrg) {
      loadIntegrations()
    }
  }, [currentOrg])

  async function loadIntegrations() {
    try {
      const res = await fetch(`/api/integrations?orgId=${currentOrg?.id}`)
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function disconnectIntegration(integrationId: string) {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    try {
      await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      })
      loadIntegrations()
    } catch (error) {
      alert('Failed to disconnect integration')
    }
  }

  const platforms = [
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      description: 'Connect your Telegram bot',
      color: 'bg-blue-500',
    },
    {
      id: 'messenger',
      name: 'Messenger',
      icon: '💬',
      description: 'Connect your Facebook page',
      color: 'bg-blue-600',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '📱',
      description: 'Connect your WhatsApp Business',
      color: 'bg-green-500',
    },
  ]

  if (!currentOrg) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600">Please select an organization first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your messaging platforms to start receiving messages
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid gap-6">
          {platforms.map((platform) => {
            const integration = integrations.find((i) => i.platform === platform.id)
            const isConnected = integration?.status === 'active'

            return (
              <div
                key={platform.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`${platform.color} text-white p-3 rounded-lg text-2xl`}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        {platform.name}
                        {isConnected && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {integration?.status === 'error' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1">{platform.description}</p>

                      {isConnected && (
                        <div className="mt-2 text-sm text-gray-500">
                          {integration.telegram_bot_username && (
                            <span>Bot: @{integration.telegram_bot_username}</span>
                          )}
                          {integration.messenger_page_id && (
                            <span>Page ID: {integration.messenger_page_id}</span>
                          )}
                          {integration.whatsapp_phone_number_id && (
                            <span>Phone ID: {integration.whatsapp_phone_number_id}</span>
                          )}
                        </div>
                      )}

                      {integration?.status === 'error' && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {integration.error_message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => setSetupPlatform(platform.id)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Configure
                        </button>
                        <button
                          onClick={() => disconnectIntegration(integration.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSetupPlatform(platform.id)}
                        className={`${platform.color} text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2`}
                      >
                        <Plus className="h-4 w-4" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Setup Modals */}
      {setupPlatform === 'telegram' && (
        <TelegramSetup
          onClose={() => {
            setSetupPlatform(null)
            loadIntegrations()
          }}
          orgId={currentOrg?.id!}
        />
      )}
      {setupPlatform === 'messenger' && (
        <MessengerSetup
          onClose={() => {
            setSetupPlatform(null)
            loadIntegrations()
          }}
          orgId={currentOrg?.id!}
        />
      )}
      {setupPlatform === 'whatsapp' && (
        <WhatsAppSetup
          onClose={() => {
            setSetupPlatform(null)
            loadIntegrations()
          }}
          orgId={currentOrg?.id!}
        />
      )}
    </div>
  )
}
