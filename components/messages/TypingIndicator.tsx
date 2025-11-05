'use client'

import { useWatchTyping } from '@/lib/hooks/useTypingIndicator'

type Props = {
  conversationId: string
  currentUserId: string
}

export default function TypingIndicator({ conversationId, currentUserId }: Props) {
  const { isTyping } = useWatchTyping(conversationId, currentUserId)

  if (!isTyping) return null

  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>Customer is typing...</span>
    </div>
  )
}