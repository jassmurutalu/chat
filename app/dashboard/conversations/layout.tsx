import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ConversationList from '@/components/conversations/ConversationList'
import { ConversationsProvider } from '@/lib/contexts/ConversationsContext'

export default async function ConversationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ConversationsProvider userId={user.id}>
      <div className="flex h-full">
        <ConversationList />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </ConversationsProvider>
  )
}