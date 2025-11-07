const TELEGRAM_API = 'https://api.telegram.org/bot'

export type TelegramUpdate = {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
    caption?: string
    date: number
    photo?: Array<{
      file_id: string
      file_unique_id: string
      file_size: number
      width: number
      height: number
    }>
    document?: {
      file_id: string
      file_unique_id: string
      file_name?: string
      mime_type?: string
      file_size?: number
    }
  }
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  botToken: string
) {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

export async function sendTelegramPhoto(
  chatId: number,
  photoUrl: string,
  caption: string | undefined,
  botToken: string
) {
  const url = `${TELEGRAM_API}${botToken}/sendPhoto`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption || undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

export async function sendTelegramDocument(
  chatId: number,
  documentUrl: string,
  caption: string | undefined,
  botToken: string
) {
  const url = `${TELEGRAM_API}${botToken}/sendDocument`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      document: documentUrl,
      caption: caption || undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

export async function setTelegramWebhook(botToken: string, webhookUrl: string) {
  const url = `${TELEGRAM_API}${botToken}/setWebhook`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to set webhook: ${error}`)
  }

  return response.json()
}

export async function getTelegramWebhookInfo(botToken: string) {
  const url = `${TELEGRAM_API}${botToken}/getWebhookInfo`
  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to get webhook info: ${JSON.stringify(data)}`)
  }

  // Return the result object directly
  return data.result || data
}

export async function deleteTelegramWebhook(botToken: string) {
  const url = `${TELEGRAM_API}${botToken}/deleteWebhook`
  const response = await fetch(url, { method: 'POST' })
  return response.json()
}

export function getTelegramUserName(user: NonNullable<TelegramUpdate['message']>['from']) {
  if (user.username) return `@${user.username}`
  return [user.first_name, user.last_name].filter(Boolean).join(' ')
}

export async function getTelegramFile(fileId: string, botToken: string) {
  const url = `${TELEGRAM_API}${botToken}/getFile`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_id: fileId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${error}`)
  }

  return response.json()
}

export async function downloadTelegramFile(filePath: string, botToken: string): Promise<ArrayBuffer> {
  const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  return response.arrayBuffer()
}