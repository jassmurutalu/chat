'use client'

import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types/database'

export function useSendMessage() {
  const supabase = createClient()

  async function sendMessage(
    conversationId: string,
    content: string,
    userId: string
  ): Promise<Message> {
    // Save message to database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        sender_id: userId,
        content,
        message_type: 'text',
      })
      .select()
      .single()

    if (error) throw error

    // Send message to Telegram
    try {
      const response = await fetch('/api/messages/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to send to Telegram:', errorData)
        // Don't throw - message is already saved to DB
      }
    } catch (telegramError) {
      console.error('Error sending to Telegram:', telegramError)
      // Don't throw - message is already saved to DB
    }

    return data
  }

  return { sendMessage }
}