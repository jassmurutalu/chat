export async function GET() {
  return Response.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
    supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}

export async function POST() {
  return Response.json({
    message: 'POST request received',
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}
