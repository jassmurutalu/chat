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
    date: number
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
  return response.json()
}

export async function deleteTelegramWebhook(botToken: string) {
  const url = `${TELEGRAM_API}${botToken}/deleteWebhook`
  const response = await fetch(url, { method: 'POST' })
  return response.json()
}

export function getTelegramUserName(user: TelegramUpdate['message']['from']) {
  if (user.username) return `@${user.username}`
  return [user.first_name, user.last_name].filter(Boolean).join(' ')
}