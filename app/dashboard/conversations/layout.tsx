import ConversationList from '@/components/conversations/ConversationList'
import { ConversationsProvider } from '@/lib/contexts/ConversationsContext'

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConversationsProvider>
      <div className="flex h-full">
        <ConversationList />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </ConversationsProvider>
  )
}