import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { botToken, orgId, webhookUrl: customWebhookUrl } = await request.json()

    // Require custom webhook URL
    if (!customWebhookUrl) {
      return Response.json(
        { error: 'Webhook URL is required. Please provide your webhook base URL.' },
        { status: 400 }
      )
    }

    // Get integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', orgId)
      .eq('platform', 'telegram')
      .single()

    if (!integration) {
      return Response.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Generate unique webhook URL for this org
    const webhookPath = `/api/webhooks/telegram/${orgId}`
    const webhookUrl = `${customWebhookUrl}${webhookPath}`

    // Generate secret token for security
    const secretToken = crypto
      .createHash('sha256')
      .update(botToken + orgId)
      .digest('hex')

    // Set webhook
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: secretToken,
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      throw new Error(data.description || 'Failed to set webhook')
    }

    // Update integration
    await supabase
      .from('integrations')
      .update({
        status: 'active',
        webhook_url: webhookUrl,
      })
      .eq('id', integration.id)

    return Response.json({
      success: true,
      webhookUrl,
    })
  } catch (error) {
    console.error('Error setting up webhook:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
