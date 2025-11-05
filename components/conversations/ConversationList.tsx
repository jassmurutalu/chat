'use client'

import { useState } from 'react'
import { MessageSquare, Search } from 'lucide-react'
import ConversationItem from './ConversationItem'
import type { Conversation } from '@/lib/types/database'

export default function ConversationList() {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock data for now - we'll replace with real data later
  const mockConversations: Conversation[] = [
    {
      id: '1',
      platform: 'telegram',
      customer_name: 'John Doe',
      customer_id: '123456',
      customer_avatar: null,
      last_message: 'Hello, I need help with my order',
      last_message_at: new Date().toISOString(),
      unread_count: 2,
      assigned_to: null,
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      platform: 'messenger',
      customer_name: 'Jane Smith',
      customer_id: '789012',
      customer_avatar: null,
      last_message: 'Thanks for your help!',
      last_message_at: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 0,
      assigned_to: null,
      status: 'active',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  const filteredConversations = mockConversations.filter(conv =>
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
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p>No conversations</p>
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