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
          if (event.message && event.message.text) {
            await handleMessage(event)
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
  const messageText = event.message.text
  const messageId = event.message.mid

  // Get sender info from Facebook
  const senderInfo = await fetchMessengerProfile(senderId)
  const customerName = `${senderInfo.first_name} ${senderInfo.last_name}`

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
        customer_id: senderId,
        last_message: messageText,
        last_message_at: new Date().toISOString(),
        unread_count: 1,
        assigned_to: user?.id,
        status: 'active',
      })
      .select()
      .single()

    conversation = newConv
  } else {
    await supabase
      .from('conversations')
      .update({
        last_message: messageText,
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
      message_type: 'text',
      platform_message_id: messageId,
    })
}

async function fetchMessengerProfile(userId: string) {
  try {
    const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN

    console.log('Fetching Messenger profile:', {
      userId,
      hasToken: !!token,
      tokenLength: token?.length || 0
    })

    if (!token) {
      console.error('MESSENGER_PAGE_ACCESS_TOKEN is not set')
      return { first_name: 'Unknown', last_name: 'User' }
    }

    const url = `https://graph.facebook.com/${userId}?fields=first_name,last_name,profile_pic&access_token=${token}`
    const response = await fetch(url)
    const responseText = await response.text()

    console.log('Profile API response:', {
      status: response.status,
      body: responseText
    })

    if (!response.ok) {
      console.error('Failed to fetch Messenger profile:', responseText)
      return { first_name: 'Unknown', last_name: 'User' }
    }

    const data = JSON.parse(responseText)
    console.log('Profile data:', data)
    return data
  } catch (error) {
    console.error('Error fetching Messenger profile:', error)
    return { first_name: 'Unknown', last_name: 'User' }
  }
}