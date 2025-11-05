'use client'

import { useEffect, useCallback } from 'react'
import { useMessages } from '@/lib/hooks/useMessages'
import { useSendMessage } from '@/lib/hooks/useSendMessage'
import { useConversationsContext } from '@/lib/contexts/ConversationsContext'
import MessageList from '@/components/messages/MessageList'
import MessageInput from '@/components/messages/MessageInput'
import { Loader2 } from 'lucide-react'
import type { Conversation } from '@/lib/types/database'

type Props = {
  conversation: Conversation
  currentUserId: string
}

export default function ConversationView({
  conversation,
  currentUserId,
}: Props) {
  const { messages, loading } = useMessages(conversation.id)
  const { sendMessage } = useSendMessage()
  const { markConversationAsRead } = useConversationsContext()

  const markAsRead = useCallback(async () => {
    // Optimistically update the UI immediately
    markConversationAsRead(conversation.id)

    // Then update the database
    try {
      await fetch(`/api/conversations/${conversation.id}/mark-read`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error marking as read:', error)
      // Could revert the optimistic update here if needed
    }
  }, [conversation.id, markConversationAsRead])

  // Mark conversation as read when opened
  useEffect(() => {
    markAsRead()
  }, [conversation.id, markAsRead])

  // Mark as read when new messages arrive while viewing this conversation
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      markAsRead()
    }
  }, [messages.length, loading, markAsRead])

  const handleSendMessage = async (content: string, fileUrl?: string) => {
  try {
    await sendMessage(conversation.id, content, currentUserId, fileUrl)
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message. Please try again.')
  }
}

  const platformEmojis = {
    telegram: '✈️',
    messenger: '💬',
    whatsapp: '📱',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{platformEmojis[conversation.platform]}</span>
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversation.customer_name}
            </h2>
            <p className="text-sm text-gray-500 capitalize">
              via {conversation.platform}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          conversationId={conversation.id}
        />
      )}

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}