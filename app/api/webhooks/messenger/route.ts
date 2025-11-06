import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.MESSENGER_VERIFY_TOKEN) {
    console.log('Webhook verified')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

// Receive messages
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Messenger webhook:', JSON.stringify(body, null, 2))

    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const event of entry.messaging) {
          console.log('Messenger event type:', {
            hasMessage: !!event.message,
            hasTyping: !!event.typing,
            hasRead: !!event.read,
            hasDelivery: !!event.delivery,
            event
          })

          if (event.message) {
            await handleMessage(event)
          } else if (event.typing) {
            await handleTyping(event)
          }
        }
      }
    }

    return Response.json({ status: 'ok' })
  } catch (error) {
    console.error('Messenger webhook error:', error)
    return Response.json({ status: 'error' }, { status: 500 })
  }
}

async function handleMessage(event: any) {
  const senderId = event.sender.id
  const messageText = event.message.text || ''
  const messageId = event.message.mid

  // Get sender info from Facebook
  const senderInfo = await fetchMessengerProfile(senderId)
  const customerName = `${senderInfo.first_name} ${senderInfo.last_name}`
  const customerAvatar = senderInfo.profile_pic || null

  // Handle attachments
  let messageType: 'text' | 'image' | 'file' = 'text'
  let fileUrl: string | null = null

  if (event.message.attachments && event.message.attachments.length > 0) {
    const attachment = event.message.attachments[0]

    try {
      if (attachment.type === 'image' || attachment.type === 'video') {
        messageType = 'image'
      } else if (attachment.type === 'file' || attachment.type === 'audio') {
        messageType = 'file'
      }

      // Download file from Facebook
      const attachmentUrl = attachment.payload.url
      const fileResponse = await fetch(attachmentUrl)

      if (!fileResponse.ok) {
        throw new Error('Failed to download attachment from Facebook')
      }

      const fileBuffer = await fileResponse.arrayBuffer()

      // Determine file extension
      let fileExt = 'file'
      const contentType = fileResponse.headers.get('content-type') || ''

      if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
        fileExt = 'jpg'
      } else if (contentType.includes('image/png')) {
        fileExt = 'png'
      } else if (contentType.includes('image/gif')) {
        fileExt = 'gif'
      } else if (contentType.includes('video/mp4')) {
        fileExt = 'mp4'
      } else if (contentType.includes('application/pdf')) {
        fileExt = 'pdf'
      }

      // Upload to Supabase storage
      const fileName = `messenger/${senderId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, fileBuffer, {
          contentType: contentType || 'application/octet-stream',
          cacheControl: '3600',
        })

      if (uploadError) {
        console.error('Error uploading attachment:', uploadError)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName)
        fileUrl = publicUrl
        console.log('Attachment uploaded successfully:', fileUrl)
      }
    } catch (error) {
      console.error('Error processing attachment:', error)
      // Continue without the file
    }
  }

  // Find or create conversation
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', senderId)
    .eq('platform', 'messenger')
    .single()

  if (!conversation) {
    // Auto-assign to first user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        platform: 'messenger',
        customer_name: customerName,
        customer_avatar: customerAvatar,
        customer_id: senderId,
        last_message: messageText || '[Attachment]',
        last_message_at: new Date().toISOString(),
        unread_count: 1,
        assigned_to: user?.id,
        status: 'active',
      })
      .select()
      .single()

    conversation = newConv
  } else {
    // Update existing conversation with name, avatar, and message
    await supabase
      .from('conversations')
      .update({
        customer_name: customerName,
        customer_avatar: customerAvatar,
        last_message: messageText || '[Attachment]',
        last_message_at: new Date().toISOString(),
        unread_count: conversation.unread_count + 1,
      })
      .eq('id', conversation.id)
  }

  // Save message
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_type: 'customer',
      content: messageText,
      message_type: messageType,
      file_url: fileUrl,
      platform_message_id: messageId,
    })
}

async function handleTyping(event: any) {
  const senderId = event.sender.id
  // If event.typing exists, user is typing (typing_on)
  const isTyping = !!event.typing

  console.log('Typing event received:', { senderId, isTyping, event })

  // Find conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('customer_id', senderId)
    .eq('platform', 'messenger')
    .single()

  if (!conversation) {
    console.log('No conversation found for typing event')
    return
  }

  console.log('Updating typing indicator for conversation:', conversation.id)

  // Update typing indicator with customer ID as the user
  const { error } = await supabase
    .from('typing_indicators')
    .upsert({
      conversation_id: conversation.id,
      user_id: `customer_${senderId}`,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'conversation_id,user_id'
    })

  if (error) {
    console.error('Error updating typing indicator:', error)
  } else {
    console.log('Typing indicator updated successfully')
  }
}

async function fetchMessengerProfile(userId: string) {
  const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN!
  const response = await fetch(
    `https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic&access_token=${token}`
  )
  return response.json()
}