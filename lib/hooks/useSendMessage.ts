'use client'

import type { Message } from '@/lib/types/database'

export function useSendMessage() {
  async function sendMessage(
    conversationId: string,
    content: string,
    userId: string
  ): Promise<Message> {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        content,
        userId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }

    const data = await response.json()
    return data.message
  }

  return { sendMessage }
}