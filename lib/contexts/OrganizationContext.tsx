'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Organization = {
  id: string
  name: string
  slug: string
  owner_id: string
  plan: string
}

type OrganizationContextType = {
  currentOrg: Organization | null
  organizations: Organization[]
  switchOrganization: (orgId: string) => Promise<void>
  loading: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadOrganizations()
  }, [])

  async function loadOrganizations() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        setLoading(false)
        return
      }

      console.log('Loading organizations for user:', user.id)

      // Get user's organization memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })

      if (membershipsError) {
        console.error('Error loading memberships:', membershipsError)
        setLoading(false)
        return
      }

      console.log('Memberships:', memberships)

      if (!memberships || memberships.length === 0) {
        console.log('No memberships found')
        setLoading(false)
        return
      }

      // Get organization details
      const orgIds = memberships.map(m => m.organization_id)
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)

      if (orgsError) {
        console.error('Error loading organizations:', orgsError)
        setLoading(false)
        return
      }

      console.log('Organizations loaded:', orgs)
      setOrganizations(orgs || [])

      // Get current organization from user profile
      const { data: userData } = await supabase
        .from('users')
        .select('current_organization_id')
        .eq('id', user.id)
        .single()

      console.log('User data:', userData)

      if (userData?.current_organization_id) {
        const current = orgs?.find((o: Organization) => o.id === userData.current_organization_id)
        setCurrentOrg(current || orgs?.[0] || null)
        console.log('Current org set to:', current || orgs?.[0])
      } else {
        setCurrentOrg(orgs?.[0] || null)
        console.log('Current org set to first org:', orgs?.[0])
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function switchOrganization(orgId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update user's current organization
      await supabase
        .from('users')
        .update({ current_organization_id: orgId })
        .eq('id', user.id)

      // Update local state
      const org = organizations.find((o: Organization) => o.id === orgId)
      setCurrentOrg(org || null)

      // Reload page to refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error switching organization:', error)
    }
  }

  return (
    <OrganizationContext.Provider
      value={{ currentOrg, organizations, switchOrganization, loading }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
