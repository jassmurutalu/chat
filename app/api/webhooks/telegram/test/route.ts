export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log('=== SIMPLE TEST POST CALLED ===')
  return Response.json({ success: true, message: 'POST works' })
}

export async function GET() {
  console.log('=== SIMPLE TEST GET CALLED ===')
  return Response.json({ success: true, message: 'GET works' })
}
