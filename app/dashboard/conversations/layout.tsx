import ConversationList from '@/components/conversations/ConversationList'

export default function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <ConversationList />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}