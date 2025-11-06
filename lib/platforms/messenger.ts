export async function sendMessengerMessage(
  recipientId: string,
  text: string,
  pageAccessToken: string
) {
  const response = await fetch(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        access_token: pageAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Messenger API error: ${error}`)
  }

  return response.json()
}

export async function sendMessengerImage(
  recipientId: string,
  imageUrl: string,
  pageAccessToken: string
) {
  const response = await fetch(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true,
            },
          },
        },
        access_token: pageAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Messenger API error: ${error}`)
  }

  return response.json()
}

export async function sendMessengerFile(
  recipientId: string,
  fileUrl: string,
  pageAccessToken: string
) {
  const response = await fetch(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'file',
            payload: {
              url: fileUrl,
              is_reusable: true,
            },
          },
        },
        access_token: pageAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Messenger API error: ${error}`)
  }

  return response.json()
}

export async function sendMessengerTyping(
  recipientId: string,
  action: 'typing_on' | 'typing_off',
  pageAccessToken: string
) {
  const response = await fetch(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: action,
        access_token: pageAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Messenger API error: ${error}`)
  }

  return response.json()
}