import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Params = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params

    // Get integration before deleting
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .single()

    if (!integration) {
      return Response.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // If it's Telegram, delete webhook
    if (integration.platform === 'telegram' && integration.telegram_bot_token) {
      try {
        await fetch(
          `https://api.telegram.org/bot${integration.telegram_bot_token}/deleteWebhook`,
          { method: 'POST' }
        )
      } catch (err) {
        console.error('Error deleting webhook:', err)
      }
    }

    // Delete integration
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting integration:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
