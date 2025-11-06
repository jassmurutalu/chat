import { createClient } from '@supabase/supabase-js'
import { sendMessengerTyping } from '@/lib/platforms/messenger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { conversationId, userId, action } = await request.json()

    if (!conversationId || !userId || !action) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return Response.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Only send to Messenger platform
    if (conversation.platform === 'messenger') {
      const pageAccessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN!

      try {
        await sendMessengerTyping(
          conversation.customer_id,
          action === 'start' ? 'typing_on' : 'typing_off',
          pageAccessToken
        )
      } catch (error) {
        console.error('Error sending typing to Messenger:', error)
        return Response.json(
          { error: `Failed to send typing indicator: ${String(error)}` },
          { status: 500 }
        )
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error in typing endpoint:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
