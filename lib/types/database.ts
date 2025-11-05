export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Conversation = {
  id: string
  platform: 'messenger' | 'telegram' | 'whatsapp'
  customer_name: string
  customer_id: string
  customer_avatar: string | null
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  assigned_to: string | null
  status: 'active' | 'archived' | 'resolved'
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent'
  sender_id: string | null
  content: string
  message_type: 'text' | 'image' | 'file'
  file_url: string | null
  platform_message_id: string | null
  read_at: string | null
  created_at: string
}

export type TypingIndicator = {
  id: string
  conversation_id: string
  user_id: string
  is_typing: boolean
  updated_at: string
}