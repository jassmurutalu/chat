import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ConversationView from '@/components/conversations/conversationView'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Get conversation from database
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !conversation) {
    notFound()
  }

  return (
    <ConversationView
      conversation={conversation}
      currentUserId={user.id}
    />
  )
}