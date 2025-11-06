'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types/database'

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isRealtimeConnected = useRef(false)

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId, supabase])

  useEffect(() => {
    loadMessages()

    // Subscribe to real-time message updates
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload)
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === payload.new.id)) {
              return prev
            }
            return [...prev, payload.new as Message]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated:', payload)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? (payload.new as Message) : msg
            )
          )
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for conversation ${conversationId}:`, status)

        if (status === 'SUBSCRIBED') {
          console.log('✓ Successfully subscribed to realtime messages')
          isRealtimeConnected.current = true
        } else if (status === 'CHANNEL_ERROR') {
          console.error('✗ Failed to subscribe to realtime messages')
          isRealtimeConnected.current = false
        } else if (status === 'TIMED_OUT') {
          console.error('✗ Realtime subscription timed out')
          isRealtimeConnected.current = false
        } else if (status === 'CLOSED') {
          console.log('Realtime subscription closed')
          isRealtimeConnected.current = false
        }
      })

    // Polling fallback - check for new messages every 5 seconds
    // This ensures messages still appear even if realtime is not working
    const pollInterval = setInterval(() => {
      if (!isRealtimeConnected.current) {
        console.log('Polling for new messages (realtime not connected)')
      }
      loadMessages()
    }, 5000)

    return () => {
      channel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [conversationId, loadMessages, supabase])

  return { messages, loading, refresh: loadMessages }
}