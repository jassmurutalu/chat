import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    let assignedUserId: string | null = null

    // Try environment variable first
    if (process.env.DEFAULT_ASSIGNED_USER_ID) {
      assignedUserId = process.env.DEFAULT_ASSIGNED_USER_ID
      console.log('Using DEFAULT_ASSIGNED_USER_ID from env:', assignedUserId)
    } else {
      // Try to get first user from auth.users using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      })

      if (authError) {
        console.error('Error fetching auth users:', authError)
        return Response.json(
          { error: `Failed to fetch users: ${authError.message}` },
          { status: 500 }
        )
      }

      if (!authData?.users || authData.users.length === 0) {
        return Response.json(
          { error: 'No users found in the system. Please create a user first or set DEFAULT_ASSIGNED_USER_ID env variable.' },
          { status: 404 }
        )
      }

      assignedUserId = authData.users[0].id
      console.log('Assigning to first auth user:', assignedUserId)
    }

    // Assign all unassigned conversations to this user
    const { data, error } = await supabase
      .from('conversations')
      .update({ assigned_to: assignedUserId })
      .is('assigned_to', null)
      .select()

    if (error) {
      console.error('Error updating conversations:', error)
      throw error
    }

    console.log(`Successfully assigned ${data.length} conversations to user ${assignedUserId}`)

    return Response.json({
      success: true,
      assigned: data.length,
      userId: assignedUserId,
    })
  } catch (error) {
    console.error('Bulk assignment error:', error)
    return Response.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
