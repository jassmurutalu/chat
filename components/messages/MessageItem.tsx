import { format } from 'date-fns'
import type { Message } from '@/lib/types/database'

type Props = {
  message: Message
  isOwn: boolean
}

export default function MessageItem({ message, isOwn }: Props) {
  const time = format(new Date(message.created_at), 'HH:mm')

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}