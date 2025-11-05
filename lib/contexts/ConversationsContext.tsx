'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useConversations } from '@/lib/hooks/useConversations'
import type { Conversation } from '@/lib/types/database'

type ConversationsContextType = {
  conversations: Conversation[]
  loading: boolean
  markConversationAsRead: (conversationId: string) => void
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined)

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { conversations, loading, markConversationAsRead } = useConversations()

  return (
    <ConversationsContext.Provider value={{ conversations, loading, markConversationAsRead }}>
      {children}
    </ConversationsContext.Provider>
  )
}

export function useConversationsContext() {
  const context = useContext(ConversationsContext)
  if (context === undefined) {
    throw new Error('useConversationsContext must be used within a ConversationsProvider')
  }
  return context
}
