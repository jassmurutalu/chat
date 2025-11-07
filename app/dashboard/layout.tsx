import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { OrganizationProvider } from '@/lib/contexts/OrganizationContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <OrganizationProvider>
      <div className="h-screen flex flex-col">
        <DashboardHeader userEmail={user.email || ''} />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </OrganizationProvider>
  )
}
