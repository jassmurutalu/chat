'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/lib/types/database'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isRealtimeConnected = useRef(false)

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
            setConversations((prev) => {
              // Avoid duplicates
              if (prev.some(conv => conv.id === payload.new.id)) {
                return prev
              }
              return [payload.new as Conversation, ...prev]
            })
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
        console.log('Conversations realtime subscription status:', status)

        if (err) {
          console.error('✗ Conversations subscription error:', err)
          isRealtimeConnected.current = false
        } else if (status === 'SUBSCRIBED') {
          console.log('✓ Successfully subscribed to realtime conversations')
          isRealtimeConnected.current = true
        } else if (status === 'CHANNEL_ERROR') {
          console.error('✗ Failed to subscribe to realtime conversations')
          isRealtimeConnected.current = false
        } else if (status === 'TIMED_OUT') {
          console.error('✗ Conversations subscription timed out')
          isRealtimeConnected.current = false
        } else if (status === 'CLOSED') {
          console.log('Conversations subscription closed')
          isRealtimeConnected.current = false
        }
      })

    // Polling fallback - check for conversation updates every 5 seconds
    const pollInterval = setInterval(() => {
      if (!isRealtimeConnected.current) {
        console.log('Polling for conversation updates (realtime not connected)')
      }
      loadConversations()
    }, 5000)

    return () => {
      console.log('Unsubscribing from conversations channel')
      channel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [supabase, loadConversations])

  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      )
    )
  }, [])

  return { conversations, loading, markConversationAsRead, refresh: loadConversations }
}