import { format } from 'date-fns'
import { FileText, Download } from 'lucide-react'
import Image from 'next/image'
import type { Message } from '@/lib/types/database'

type Props = {
  message: Message
  isOwn: boolean
}

export default function MessageItem({ message, isOwn }: Props) {
  const time = format(new Date(message.created_at), 'HH:mm')
  const hasFile = message.file_url && message.message_type !== 'text'

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
          {/* File attachment */}
          {hasFile && (
            <div className="mb-2">
              {message.message_type === 'image' ? (
                <a
                  href={message.file_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Image
                    src={message.file_url!}
                    alt="Attachment"
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                  />
                </a>
              ) : (
                <a
                  href={message.file_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded ${
                    isOwn ? 'bg-blue-600' : 'bg-gray-100'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">View attachment</span>
                  <Download className="h-4 w-4 ml-auto" />
                </a>
              )}
            </div>
          )}

          {/* Message text */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>
        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}