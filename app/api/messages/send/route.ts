import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage, sendTelegramPhoto, sendTelegramDocument } from '@/lib/platforms/telegram'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Add fileUrl handling
    const { conversationId, content, userId, fileUrl } = await request.json()

    if (!conversationId || (!content && !fileUrl) || !userId) {
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

    // Determine message type
    let messageType: 'text' | 'image' | 'file' = 'text'
    if (fileUrl) {
      messageType = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file'
    }

    // Send to platform first - fail fast if delivery fails
    if (conversation.platform === 'telegram') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN!
      const chatId = parseInt(conversation.customer_id)

      try {
        if (messageType === 'image' && fileUrl) {
          await sendTelegramPhoto(chatId, fileUrl, content || undefined, botToken)
        } else if (messageType === 'file' && fileUrl) {
          await sendTelegramDocument(chatId, fileUrl, content || undefined, botToken)
        } else {
          await sendTelegramMessage(chatId, content, botToken)
        }
      } catch (error) {
        console.error('Error sending to Telegram:', error)
        return Response.json(
          { error: `Failed to send message to Telegram: ${String(error)}` },
          { status: 500 }
        )
      }
    }
    // Add other platforms here later (messenger, whatsapp)

    // Only save message to database after successful platform delivery
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'agent',
        sender_id: userId,
        content,
        message_type: messageType,
        file_url: fileUrl,
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      throw messageError
    }

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