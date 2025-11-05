export async function sendMessengerMessage(
  recipientId: string,
  text: string,
  pageAccessToken: string
) {
  // Debug logging
  console.log('Sending Messenger message:', {
    recipientId,
    hasToken: !!pageAccessToken,
    tokenLength: pageAccessToken?.length || 0,
    tokenPrefix: pageAccessToken?.substring(0, 20) + '...'
  })

  if (!pageAccessToken) {
    throw new Error('Missing MESSENGER_PAGE_ACCESS_TOKEN environment variable')
  }

  const url = `https://graph.facebook.com/v18.0/me/messages`
  const body = {
    recipient: { id: recipientId },
    message: { text },
    access_token: pageAccessToken,
  }

  console.log('Request body:', JSON.stringify(body, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  console.log('Messenger API response:', {
    status: response.status,
    statusText: response.statusText,
    body: responseText
  })

  if (!response.ok) {
    throw new Error(`Messenger API error: ${responseText}`)
  }

  return JSON.parse(responseText)
}