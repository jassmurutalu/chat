'use client'

import { X } from 'lucide-react'

type Props = {
  onClose: () => void
  orgId: string
}

export default function WhatsAppSetup({ onClose, orgId }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Connect WhatsApp Business</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">Coming Soon!</p>
              <p className="text-green-700">
                WhatsApp Business integration is currently under development.
                This will allow you to connect your WhatsApp Business account and manage conversations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">What you'll be able to do:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Connect your WhatsApp Business account</li>
                <li>Receive and respond to WhatsApp messages</li>
                <li>Send templates and media messages</li>
                <li>Manage conversations from your dashboard</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
