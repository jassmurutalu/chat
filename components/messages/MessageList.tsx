'use client'

import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import type { Message } from '@/lib/types/database'
import TypingIndicator from './TypingIndicator'

type Props = {
  messages: Message[]
  currentUserId: string
  conversationId: string
}

export default function MessageList({ messages, currentUserId, conversationId }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {    
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.sender_type === 'agent'}
            />
          ))}
          <TypingIndicator conversationId={conversationId} currentUserId={currentUserId} />
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}