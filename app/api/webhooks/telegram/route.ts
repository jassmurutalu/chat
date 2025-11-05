import { createClient } from '@supabase/supabase-js'
import { getTelegramUserName } from '@/lib/platforms/telegram'
import type { TelegramUpdate } from '@/lib/platforms/telegram'

// Configure the route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log('[Webhook] POST handler called - START')

  try {
    console.log('[Webhook] Inside try block')

    // Initialize Supabase with service role key for webhook
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

    console.log('[Webhook] Env vars loaded')
    console.log('[Webhook] Supabase URL available:', !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co')
    console.log('[Webhook] Service key available:', !!supabaseServiceKey && supabaseServiceKey !== 'placeholder-service-key')

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    console.log('[Webhook] Supabase client created')

    const update: TelegramUpdate = await request.json()

    console.log('[Webhook] Request parsed')
    console.log('Telegram webhook received:', JSON.stringify(update, null, 2))

    // Only process messages (ignore other update types)
    if (!update.message || !update.message.text) {
      return Response.json({ ok: true })
    }

    const message = update.message
    const customerId = message.from.id.toString()
    const customerName = getTelegramUserName(message.from)
    const messageText = message.text

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('platform', 'telegram')
      .single()

    if (convError || !conversation) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          platform: 'telegram',
          customer_name: customerName,
          customer_id: customerId,
          last_message: messageText,
          last_message_at: new Date(message.date * 1000).toISOString(),
          unread_count: 1,
          status: 'active',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError)
        throw createError
      }

      conversation = newConversation
    } else {
      // Update existing conversation
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date(message.date * 1000).toISOString(),
          unread_count: conversation.unread_count + 1,
        })
        .eq('id', conversation.id)
    }

    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'customer',
        content: messageText,
        message_type: 'text',
        platform_message_id: message.message_id.toString(),
        created_at: new Date(message.date * 1000).toISOString(),
      })

    if (messageError) {
      console.error('Error saving message:', messageError)
      throw messageError
    }

    console.log('Message saved successfully')

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return Response.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({ 
    status: 'ok',
    message: 'Telegram webhook is running'
  })
}