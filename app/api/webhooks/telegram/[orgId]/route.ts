import { createClient } from '@supabase/supabase-js'
import { getTelegramUserName, getTelegramFile, downloadTelegramFile } from '@/lib/platforms/telegram'
import type { TelegramUpdate } from '@/lib/platforms/telegram'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = {
  params: Promise<{ orgId: string }>
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { orgId } = await params
    const update: TelegramUpdate = await request.json()

    console.log(`==========================================`)
    console.log(`Telegram webhook for org ${orgId}:`, JSON.stringify(update, null, 2))
    console.log(`==========================================`)

    // Get integration for this org
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('platform', 'telegram')
      .eq('status', 'active')
      .single()

    if (intError || !integration) {
      console.error('Integration not found:', intError)
      return Response.json({ ok: false, error: 'Integration not found' }, { status: 404 })
    }

    // Verify secret token (security)
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
    const expectedToken = crypto
      .createHash('sha256')
      .update(integration.telegram_bot_token + orgId)
      .digest('hex')

    if (secretToken !== expectedToken) {
      console.error('Invalid secret token')
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Only process messages
    if (!update.message) {
      console.log('No message in update, skipping')
      return Response.json({ ok: true })
    }

    const message = update.message

    console.log('Message type check:')
    console.log('- Has text:', !!message.text)
    console.log('- Has photo:', !!message.photo)
    console.log('- Has document:', !!message.document)

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

    const botToken = integration.telegram_bot_token!

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
        const fileName = `telegram/${orgId}/${customerId}/${Date.now()}.jpg`
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
        const fileName = `telegram/${orgId}/${customerId}/${Date.now()}.${fileExt}`
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
      }
    }

    // Find or create conversation (linked to org and integration)
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('platform', 'telegram')
      .eq('organization_id', orgId)
      .single()

    if (!conversation) {
      // Get first user from this org to assign the conversation
      const { data: member } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .single()

      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          platform: 'telegram',
          customer_name: customerName,
          customer_id: customerId,
          last_message: messageText,
          last_message_at: new Date(message.date * 1000).toISOString(),
          unread_count: 1,
          status: 'active',
          organization_id: orgId,
          integration_id: integration.id,
          assigned_to: member?.user_id,
        })
        .select()
        .single()

      conversation = newConversation
    } else {
      // Update existing conversation - use RPC to increment atomically
      const { error: updateError } = await supabase.rpc('increment_unread_count', {
        conversation_id: conversation.id,
        new_last_message: messageText,
        new_last_message_at: new Date(message.date * 1000).toISOString(),
      })

      // Fallback to direct update if RPC doesn't exist yet
      if (updateError && updateError.message?.includes('function')) {
        await supabase
          .from('conversations')
          .update({
            last_message: messageText,
            last_message_at: new Date(message.date * 1000).toISOString(),
            unread_count: conversation.unread_count + 1,
          })
          .eq('id', conversation.id)
      } else if (updateError) {
        console.error('Error updating conversation:', updateError)
      }
    }

    // Save message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation!.id,
        sender_type: 'customer',
        content: messageText,
        message_type: messageType,
        file_url: fileUrl,
        platform_message_id: message.message_id.toString(),
        created_at: new Date(message.date * 1000).toISOString(),
      })

    // Update last webhook time
    await supabase
      .from('integrations')
      .update({ last_webhook_received_at: new Date().toISOString() })
      .eq('id', integration.id)

    console.log('Message saved successfully')

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return Response.json({ ok: false }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'Telegram multi-tenant webhook is running'
  })
}
