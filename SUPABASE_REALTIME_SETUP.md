# Supabase Realtime Setup

## Issue: Real-time updates not working for conversations

If the unread count is not updating in real-time when another conversation receives a message, you need to enable Realtime on the `conversations` table in Supabase.

## Steps to Enable Realtime

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the `conversations` table in the list
4. Toggle the switch to **enable** Realtime for the `conversations` table
5. Also enable Realtime for the `messages` table (if not already enabled)

## How to Verify Realtime is Working

1. Open your app in the browser
2. Open the browser console (F12 → Console tab)
3. You should see:
   - `Conversations subscription status: SUBSCRIBED` when the page loads
   - `Conversation change received:` logs when a conversation is updated

## Expected Behavior

- **When opening a conversation**: Unread count goes to 0 instantly
- **When a message arrives in another conversation**: Unread badge appears immediately
- **When a message arrives in the active conversation**: It stays marked as read (unread count remains 0)

## Troubleshooting

If you see subscription status as `CHANNEL_ERROR` or `SUBSCRIPTION_ERROR`:
- Check that Realtime is enabled on the table
- Verify your Supabase project has Realtime enabled (it should be enabled by default)
- Check browser console for any CORS or authentication errors
