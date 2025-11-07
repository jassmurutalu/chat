import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params

    // Delete all messages in the conversation first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      console.error('Error deleting messages:', messagesError)
      throw messagesError
    }

    // Delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (conversationError) {
      console.error('Error deleting conversation:', conversationError)
      throw conversationError
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
