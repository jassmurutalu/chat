import { createClient } from '@supabase/supabase-js'
import { getTelegramUserName, getTelegramFile, downloadTelegramFile } from '@/lib/platforms/telegram'
import type { TelegramUpdate } from '@/lib/platforms/telegram'

export async function POST(request: Request) {
  try {
    // Initialize Supabase with service role key for webhook
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    )

    const update: TelegramUpdate = await request.json()

    console.log('==========================================')
    console.log('Telegram webhook received:', JSON.stringify(update, null, 2))
    console.log('==========================================')

    // Only process messages (ignore other update types)
    if (!update.message) {
      console.log('No message in update, skipping')
      return Response.json({ ok: true })
    }

    const message = update.message

    console.log('Message type check:')
    console.log('- Has text:', !!message.text)
    console.log('- Has photo:', !!message.photo)
    console.log('- Has document:', !!message.document)
    console.log('- Has caption:', !!message.caption)

    // Skip if no text, photo, or document
    if (!message.text && !message.photo && !message.document) {
      console.log('Message has no text, photo, or document - skipping')
      return Response.json({ ok: true })
    }

    const customerId = message.from.id.toString()
    const customerName = getTelegramUserName(message.from)
    const messageText = message.text || message.caption || ''

    console.log('Processing message from:', customerName)
    console.log('Message text:', messageText)

    // Determine message type and handle file upload
    let messageType: 'text' | 'image' | 'file' = 'text'
    let fileUrl: string | null = null

    const botToken = process.env.TELEGRAM_BOT_TOKEN!

    if (message.photo && message.photo.length > 0) {
      // Get the largest photo
      const photo = message.photo[message.photo.length - 1]
      messageType = 'image'

      try {
        console.log('Processing photo, file_id:', photo.file_id)

        // Get file path from Telegram
        const fileInfo: any = await getTelegramFile(photo.file_id, botToken)
        console.log('File info received:', JSON.stringify(fileInfo, null, 2))

        if (!fileInfo.ok || !fileInfo.result || !fileInfo.result.file_path) {
          throw new Error('Invalid file info from Telegram')
        }

        // Download file from Telegram
        const fileBuffer = await downloadTelegramFile(fileInfo.result.file_path, botToken)
        console.log('File downloaded, size:', fileBuffer.byteLength)

        // Upload to Supabase storage
        const fileName = `telegram/${customerId}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, fileBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          })

        if (uploadError) {
          console.error('Error uploading photo:', uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName)
        fileUrl = publicUrl
        console.log('Photo uploaded successfully:', fileUrl)
      } catch (error) {
        console.error('Error processing photo:', error)
        // Still save the message but without the file
      }
    } else if (message.document) {
      messageType = 'file'

      try {
        console.log('Processing document, file_id:', message.document.file_id)

        // Get file path from Telegram
        const fileInfo: any = await getTelegramFile(message.document.file_id, botToken)
        console.log('File info received:', JSON.stringify(fileInfo, null, 2))

        if (!fileInfo.ok || !fileInfo.result || !fileInfo.result.file_path) {
          throw new Error('Invalid file info from Telegram')
        }

        // Download file from Telegram
        const fileBuffer = await downloadTelegramFile(fileInfo.result.file_path, botToken)
        console.log('File downloaded, size:', fileBuffer.byteLength)

        // Upload to Supabase storage
        const fileExt = message.document.file_name?.split('.').pop() || 'file'
        const fileName = `telegram/${customerId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, fileBuffer, {
            contentType: message.document.mime_type || 'application/octet-stream',
            cacheControl: '3600',
          })

        if (uploadError) {
          console.error('Error uploading document:', uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName)
        fileUrl = publicUrl
        console.log('Document uploaded successfully:', fileUrl)
      } catch (error) {
        console.error('Error processing document:', error)
        // Still save the message but without the file
      }
    }

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
        message_type: messageType,
        file_url: fileUrl,
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