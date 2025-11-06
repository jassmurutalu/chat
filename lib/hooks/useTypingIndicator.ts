'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type TypingIndicatorPayload = {
  conversation_id: string
  user_id: string
  is_typing: boolean
  updated_at: string
}

export function useTypingIndicator(conversationId: string, userId: string) {
  const supabase = createClient()
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const sendTyping = useCallback(async () => {
    try {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }

      // Update local typing indicator
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: userId,
          is_typing: true,
          updated_at: new Date().toISOString(),
        })

      // Send typing indicator to Messenger (non-blocking)
      fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId,
          action: 'start',
        }),
      }).catch((err) => console.error('Failed to send typing to platform:', err))

      // Auto-clear after 3 seconds
      const timeoutId = setTimeout(async () => {
        await supabase
          .from('typing_indicators')
          .update({ is_typing: false })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)

        // Send typing_off to Messenger
        fetch('/api/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            userId,
            action: 'stop',
          }),
        }).catch((err) => console.error('Failed to stop typing on platform:', err))

        setTypingTimeout(null)
      }, 3000)

      setTypingTimeout(timeoutId)
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }, [conversationId, userId, supabase, typingTimeout])

  const clearTyping = useCallback(async () => {
    try {
      // Clear timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout)
        setTypingTimeout(null)
      }

      // Clear local typing indicator
      await supabase
        .from('typing_indicators')
        .update({ is_typing: false })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      // Send typing_off to Messenger
      fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId,
          action: 'stop',
        }),
      }).catch((err) => console.error('Failed to stop typing on platform:', err))
    } catch (error) {
      console.error('Error clearing typing indicator:', error)
    }
  }, [conversationId, userId, supabase, typingTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [typingTimeout])

  return { sendTyping, clearTyping }
}

export function useWatchTyping(conversationId: string, currentUserId: string) {
  const [isTyping, setIsTyping] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to typing indicators
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Only show if it's not the current user and payload.new exists
          if (payload.new && 'user_id' in payload.new && 'is_typing' in payload.new) {
            const typingData = payload.new as TypingIndicatorPayload
            if (typingData.user_id !== currentUserId) {
              setIsTyping(typingData.is_typing)
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, currentUserId, supabase])

  return { isTyping }
}