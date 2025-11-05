import { setTelegramWebhook, getTelegramWebhookInfo } from '@/lib/platforms/telegram'

export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!
    
    // Get current webhook info
    const currentInfo = await getTelegramWebhookInfo(botToken)
    console.log('Current webhook:', currentInfo)

    // Set new webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/api/webhooks/telegram`
    
    console.log('Setting webhook to:', webhookUrl)
    const result = await setTelegramWebhook(botToken, webhookUrl)
    
    return Response.json({
      success: true,
      webhookUrl,
      result,
    })
  } catch (error) {
    console.error('Error setting webhook:', error)
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN!
    const info = await getTelegramWebhookInfo(botToken)
    
    return Response.json(info)
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}