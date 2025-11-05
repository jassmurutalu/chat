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
    return data
  }

  return { sendMessage }
}