'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { handleSignOut } from '@/app/dashboard/actions'

type Props = {
  userEmail: string
}

export default function DashboardHeader({ userEmail }: Props) {
  const { requestPermission, permission } = useNotifications()

  useEffect(() => {
    console.log('Current notification permission:', permission)
    if (permission === 'default') {
      console.log('Requesting notification permission...')
      requestPermission()
    }
  }, [permission, requestPermission])

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customer Chat</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Admin
          </Link>
          <span className="text-sm text-gray-600">{userEmail}</span>
          <form action={handleSignOut}>
            <button className="text-sm text-red-600 hover:text-red-700">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
