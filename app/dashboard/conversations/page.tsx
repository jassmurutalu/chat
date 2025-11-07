import { MessageSquare } from 'lucide-react'

export default function ConversationsPage() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center text-gray-500">
        <MessageSquare className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">No conversation selected</h2>
        <p className="text-gray-700">Choose a conversation from the sidebar to start messaging</p>
      </div>
    </div>
  )
}