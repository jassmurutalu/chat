'use client'

import { useState } from 'react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { ChevronDown, Check, Building2 } from 'lucide-react'

export default function OrganizationSwitcher() {
  const { currentOrg, organizations, switchOrganization } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)

  if (organizations.length <= 1) {
    // Don't show switcher if user only has one organization
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Building2 className="h-4 w-4" />
        <span className="font-medium">{currentOrg?.name || 'Select workspace'}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-2">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  switchOrganization(org.id)
                  setIsOpen(false)
                }}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-left"
              >
                <span className={currentOrg?.id === org.id ? 'font-semibold' : ''}>
                  {org.name}
                </span>
                {currentOrg?.id === org.id && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
