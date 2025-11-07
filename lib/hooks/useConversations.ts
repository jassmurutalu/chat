'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/lib/types/database'
import { useNotifications } from './useNotifications'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { sendNotification } = useNotifications()

  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadConversations()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Conversation change received:', payload)

          if (payload.eventType === 'INSERT') {
            console.log('Adding new conversation:', payload.new)
            const newConv = payload.new as Conversation
            setConversations((prev) => [newConv, ...prev])
            // Send notification
            sendNotification(
              'New conversation',
              `${newConv.customer_name}: ${newConv.last_message}`,
            )                   
          } else if (payload.eventType === 'UPDATE') {
            console.log('Updating conversation:', payload.new)
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === payload.new.id ? (payload.new as Conversation) : conv
              )
            )
          } else if (payload.eventType === 'DELETE') {
            console.log('Deleting conversation:', payload.old)
            setConversations((prev) =>
              prev.filter((conv) => conv.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Conversations subscription status:', status)
        if (err) {
          console.error('Subscription error:', err)
        }
      })

    return () => {
      console.log('Unsubscribing from conversations channel')
      channel.unsubscribe()
    }
  }, [supabase, loadConversations])

  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      )
    )
  }, [])

  return { conversations, loading, markConversationAsRead }
}