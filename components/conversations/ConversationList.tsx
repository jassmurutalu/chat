'use client'

import { useState } from 'react'
import { MessageSquare, Search, Loader2 } from 'lucide-react'
import ConversationItem from './ConversationItem'
import { useConversationsContext } from '@/lib/contexts/ConversationsContext'

export default function ConversationList() {
  const [searchQuery, setSearchQuery] = useState('')
  const { conversations, loading } = useConversationsContext()

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase()
  return (
    conv.customer_name.toLowerCase().includes(searchLower) ||
    conv.last_message?.toLowerCase().includes(searchLower) ||
    conv.platform.toLowerCase().includes(searchLower)
  )
})

const [platformFilter, setPlatformFilter] = useState<'all' | 'telegram' | 'messenger' | 'whatsapp'>('all')

const filteredByPlatform = platformFilter === 'all' 
  ? filteredConversations
  : filteredConversations.filter(conv => conv.platform === platformFilter)



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
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Add platform filter UI */}
      <div className="flex gap-1 p-2 border-b border-gray-200 overflow-x-auto">
        {['all', 'telegram', 'messenger', 'whatsapp'].map(platform => (
          <button
            key={platform}
            onClick={() => setPlatformFilter(platform as any)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
              platformFilter === platform
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {platform === 'all' ? 'All' : platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredByPlatform.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <MessageSquare className="h-12 w-12 mb-2" />
            <p className="text-center text-gray-700">
              {conversations.length === 0
                ? 'No conversations yet'
                : 'No conversations match your search'}
            </p>
          </div>
        ) : (
          filteredByPlatform.map((conversation) => (
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