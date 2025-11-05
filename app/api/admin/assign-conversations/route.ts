import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Get first user (or implement your assignment logic)
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()

    if (!users) {
      return Response.json({ error: 'No users found' }, { status: 404 })
    }

    // Assign all unassigned conversations to this user
    const { data, error } = await supabase
      .from('conversations')
      .update({ assigned_to: users.id })
      .is('assigned_to', null)
      .select()

    if (error) throw error

    return Response.json({
      success: true,
      assigned: data.length,
    })
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
