'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Paperclip, X, Loader2 } from 'lucide-react'
import { uploadFile, formatFileSize } from '@/lib/storage/upload'
import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator'

type Props = {
  conversationId: string
  currentUserId: string
  onSendMessage: (content: string, fileUrl?: string) => Promise<void>
}

export default function MessageInput({ conversationId, currentUserId, onSendMessage }: Props) {
  const { sendTyping, clearTyping } = useTypingIndicator(conversationId, currentUserId)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.')
      return
    }

    setSelectedFile(file)
    setError('')
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Need either message or file
    if (!message.trim() && !selectedFile) return
    if (sending || uploading) return

    setSending(true)
    setError('')

    try {
      let fileUrl: string | undefined

      // Upload file if present
      if (selectedFile) {
        setUploading(true)
        const uploadResult = await uploadFile(selectedFile, conversationId)
        fileUrl = uploadResult.url
        setUploading(false)
      }

      // Send message
      await onSendMessage(
        message.trim() || `Sent ${selectedFile?.name}`,
        fileUrl
      )

      // Clear typing indicator immediately
      clearTyping()

      setMessage('')
      removeFile()
    } catch (error) {
      console.error('Failed to send:', error)
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 text-sm border-b border-red-100">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <span className="flex-1 truncate">{selectedFile.name}</span>
            <span className="text-gray-500">{formatFileSize(selectedFile.size)}</span>
            <button
              onClick={removeFile}
              className="text-gray-500 hover:text-gray-700"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Attach file"
            disabled={sending || uploading}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              if (e.target.value) {
                sendTyping() // Send typing indicator
              }
            }}
            
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
            disabled={sending || uploading}
          />
          
          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || sending || uploading}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {(sending || uploading) ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  )
}