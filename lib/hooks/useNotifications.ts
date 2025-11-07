'use client'

import { useEffect, useState } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    // Initialize with actual browser permission if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  const sendNotification = (title: string, body: string, icon?: string) => {
    console.log('🔔 sendNotification called:', { title, body, permission })

    if (permission !== 'granted') {
      console.log('❌ Notification blocked - permission not granted:', permission)
      return
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/icon.png',
        badge: '/badge.png',
      })

      console.log('✅ Notification created successfully')

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000)
    } catch (error) {
      console.error('❌ Error creating notification:', error)
    }
  }

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
  }
}