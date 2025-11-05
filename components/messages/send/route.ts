import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage } from '@/lib/platforms/telegram'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { conversationId, content, userId } = await request.json()

    if (!conversationId || !content || !userId) {
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

    // Save message to database first
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        sender_id: userId,
        content,
        message_type: 'text',
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      throw messageError
    }

    // Send to platform
    if (conversation.platform === 'telegram') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN!
      const chatId = parseInt(conversation.customer_id)
      
      await sendTelegramMessage(chatId, content, botToken)
    }
    // Add other platforms here later (messenger, whatsapp)

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return Response.json({
      success: true,
      message,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}