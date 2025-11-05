'use client'

import { useState, KeyboardEvent } from 'react'
import { Send, Paperclip } from 'lucide-react'

type Props = {
  conversationId: string
  onSendMessage: (content: string) => Promise<void>
}

export default function MessageInput({ conversationId, onSendMessage }: Props) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const sendMessageHandler = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    setError('')

    try {
      await onSendMessage(message.trim())
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendMessageHandler()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageHandler()
    }
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Attach file (coming soon)"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
          disabled={sending}
        />
        
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
    </>
  )
}