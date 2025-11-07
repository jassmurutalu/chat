import { createClient } from '@/lib/supabase/server'
import { getTelegramWebhookInfo } from '@/lib/platforms/telegram'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the integration and verify user has access through organization membership
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*, organizations!inner(id)')
      .eq('id', params.id)
      .single()

    if (integrationError || !integration) {
      return Response.json({ error: 'Integration not found' }, { status: 404 })
    }

    // Verify user is a member of the organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', integration.organization_id)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only Telegram integrations support webhook status checking
    if (integration.platform !== 'telegram') {
      return Response.json({
        error: 'Webhook status check is only supported for Telegram integrations'
      }, { status: 400 })
    }

    if (!integration.telegram_bot_token) {
      return Response.json({
        error: 'Bot token not found for this integration'
      }, { status: 400 })
    }

    // Get webhook info from Telegram
    const webhookInfo = await getTelegramWebhookInfo(integration.telegram_bot_token)

    return Response.json({
      success: true,
      webhookInfo,
      lastReceived: integration.last_webhook_received_at,
    })
  } catch (error) {
    console.error('Error checking webhook status:', error)
    return Response.json(
      { error: 'Failed to check webhook status', details: String(error) },
      { status: 500 }
    )
  }
}
