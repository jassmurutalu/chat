export async function sendMessengerMessage(
  recipientId: string,
  text: string,
  pageAccessToken: string
) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Messenger API error: ${error}`)
  }

  return response.json()
}