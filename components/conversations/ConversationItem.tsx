'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Send } from 'lucide-react'
import type { Conversation } from '@/lib/types/database'

type Props = {
  conversation: Conversation
}

export default function ConversationItem({ conversation }: Props) {
  const pathname = usePathname()
  const isActive = pathname === `/dashboard/conversations/${conversation.id}`

  const platformIcons = {
    telegram: '✈️',
    messenger: '💬',
    whatsapp: '📱',
  }

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
    : 'No messages'

  return (
    <Link
      href={`/dashboard/conversations/${conversation.id}`}
      className={`block border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{platformIcons[conversation.platform]}</span>
            <h3 className="font-semibold text-gray-900">
              {conversation.customer_name}
            </h3>
          </div>
          {/* Only show unread badge if not currently viewing this conversation */}
          {conversation.unread_count > 0 && !isActive && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {conversation.unread_count}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600 truncate mb-1">
          {conversation.last_message || 'No messages yet'}
        </p>
        
        <p className="text-xs text-gray-400">{timeAgo}</p>
      </div>
    </Link>
  )
}