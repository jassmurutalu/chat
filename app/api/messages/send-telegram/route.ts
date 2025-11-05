import { sendTelegramMessage } from '@/lib/platforms/telegram'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { conversationId, content } = await request.json()

    if (!conversationId || !content) {
      return Response.json(
        { error: 'Missing conversationId or content' },
        { status: 400 }
      )
    }

    // Initialize Supabase with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const botToken = process.env.TELEGRAM_BOT_TOKEN!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get conversation to find the customer_id (Telegram chat ID)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('customer_id, platform')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return Response.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Only send to Telegram if it's a Telegram conversation
    if (conversation.platform !== 'telegram') {
      return Response.json(
        { error: 'Not a Telegram conversation' },
        { status: 400 }
      )
    }

    // Send message to Telegram
    const chatId = parseInt(conversation.customer_id)
    const result = await sendTelegramMessage(chatId, content, botToken)

    console.log('Message sent to Telegram:', result)

    return Response.json({ success: true, result })
  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
