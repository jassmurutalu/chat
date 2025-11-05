import { NextResponse } from 'next/server'

export async function GET() {
  const pageAccessToken = process.env.MESSENGER_PAGE_ACCESS_TOKEN
  const verifyToken = process.env.MESSENGER_VERIFY_TOKEN

  if (!pageAccessToken) {
    return NextResponse.json({
      error: 'MESSENGER_PAGE_ACCESS_TOKEN not set',
      instructions: 'Add MESSENGER_PAGE_ACCESS_TOKEN to your .env.local file'
    }, { status: 500 })
  }

  // Test token by getting page info
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${pageAccessToken}`
    )
    const data = await response.text()

    return NextResponse.json({
      verifyTokenSet: !!verifyToken,
      pageAccessTokenSet: !!pageAccessToken,
      tokenLength: pageAccessToken.length,
      tokenPrefix: pageAccessToken.substring(0, 20) + '...',
      meEndpointTest: {
        status: response.status,
        ok: response.ok,
        response: data
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to test token',
      details: String(error)
    }, { status: 500 })
  }
}
