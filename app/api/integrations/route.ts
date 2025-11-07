import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return Response.json({ error: 'Missing orgId' }, { status: 400 })
    }

    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ integrations })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
