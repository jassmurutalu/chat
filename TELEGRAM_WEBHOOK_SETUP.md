# Telegram Webhook Setup Guide

## How to Change Your Telegram Webhook URL

### Method 1: Using the Admin Dashboard (Recommended)

1. **Update Environment Variable**

   Set the `NEXT_PUBLIC_SITE_URL` environment variable to your public URL:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

   Or for local development with a tunnel (like ngrok):
   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-ngrok-url.ngrok.io
   ```

2. **Restart Your Application**
   ```bash
   npm run dev  # or your start command
   ```

3. **Go to Admin Dashboard**
   - Navigate to: `http://localhost:3000/dashboard/admin` (or your domain)
   - Click **"Setup Webhook"** button
   - Click **"Check Webhook Status"** to verify

4. **Verify the Webhook**
   - You should see the webhook URL and status in the dashboard
   - Send a test message to your Telegram bot
   - Check if it appears in the conversations list

### Method 2: Using Telegram API Directly

You can also set the webhook manually using curl:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/webhooks/telegram"}'
```

Replace:
- `<YOUR_BOT_TOKEN>` with your actual Telegram bot token
- `https://yourdomain.com` with your actual domain

### Check Current Webhook

To check what webhook is currently set:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Delete Webhook

To remove the webhook (useful for testing locally without a webhook):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

## Environment Variables Needed

Create a `.env.local` file in the root directory:

```env
# Telegram Bot Token (from @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Your public URL (where the app is deployed)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Local Development with Tunnels

If you're developing locally and want to receive webhooks, you need to expose your localhost using a tunneling service:

### Using ngrok:

1. Install ngrok: https://ngrok.com/
2. Start your app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update your `.env.local`:
   ```env
   NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
   ```
6. Restart your app
7. Go to admin dashboard and click "Setup Webhook"

### Using Cloudflare Tunnel:

1. Install cloudflared
2. Run: `cloudflare tunnel --url http://localhost:3000`
3. Use the provided URL

## Webhook Endpoint

The webhook endpoint in your app is:
```
/api/webhooks/telegram
```

Full URL will be:
```
https://yourdomain.com/api/webhooks/telegram
```

## Troubleshooting

### Webhook not receiving messages

1. **Check webhook status** in admin dashboard
2. **Verify your URL is publicly accessible** (try opening it in a browser)
3. **Check that your bot token is correct** in `.env.local`
4. **Ensure HTTPS** - Telegram requires HTTPS for webhooks (except localhost)
5. **Check logs** - Look at your application logs for any errors

### "Webhook is already set" error

This is fine - it means the webhook is configured. You can:
- Check the current webhook with "Check Webhook Status"
- Update it with "Setup Webhook" (this will overwrite the old one)

### Testing without webhook (polling mode)

If you want to test without a webhook, you can delete the webhook and use Telegram's `getUpdates` API manually (not implemented in this app by default).

## Security Notes

- Never commit your `.env.local` file
- Keep your `TELEGRAM_BOT_TOKEN` secret
- Use HTTPS in production
- The webhook endpoint validates incoming requests from Telegram
