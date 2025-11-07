import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { botToken, orgId } = await request.json()

    if (!botToken || !orgId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify bot token with Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    )

    if (!response.ok) {
      return Response.json(
        { error: 'Invalid bot token' },
        { status: 400 }
      )
    }

    const data = await response.json()

    if (!data.ok) {
      return Response.json(
        { error: 'Invalid bot token' },
        { status: 400 }
      )
    }

    // Save to database (TODO: Encrypt token in production!)
    const { error } = await supabase
      .from('integrations')
      .upsert({
        organization_id: orgId,
        platform: 'telegram',
        telegram_bot_token: botToken,
        telegram_bot_username: data.result.username,
        status: 'pending',
      }, {
        onConflict: 'organization_id,platform'
      })

    if (error) throw error

    return Response.json({
      success: true,
      bot: data.result,
    })
  } catch (error) {
    console.error('Error verifying bot:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
