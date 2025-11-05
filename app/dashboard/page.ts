import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Redirect to first conversation or show empty state
  redirect('/dashboard/conversations')
}