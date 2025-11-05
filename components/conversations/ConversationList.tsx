'use client'

import { useState } from 'react'
import { MessageSquare, Search, Loader2 } from 'lucide-react'
import ConversationItem from './ConversationItem'
import { useConversations } from '@/lib/hooks/useConversations'

export default function ConversationList() {
  const [searchQuery, setSearchQuery] = useState('')
  const { conversations, loading } = useConversations()

  const filteredConversations = conversations.filter(conv =>
    conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-gray-200 flex flex-col h-full bg-white">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="text-center">
              {conversations.length === 0
                ? 'No conversations yet'
                : 'No conversations match your search'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
            />
          ))
        )}
      </div>
    </div>
  )
}