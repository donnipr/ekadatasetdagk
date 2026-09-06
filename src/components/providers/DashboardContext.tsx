'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type Role = 'admin' | 'superadmin' | 'viewer'

interface DashboardContextType {
  role: Role
  userBagian: string // Bagian of the logged-in user
  activeBagian: string // Bagian currently selected in the UI filter
  setActiveBagian: (bagian: string) => void
  availableBagianList: string[] // List of all parts available for selection
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({
  children,
  role,
  userBagian,
  availableBagianList,
}: {
  children: ReactNode
  role: Role
  userBagian: string
  availableBagianList: string[]
}) {
  // If user is admin, they are locked to their own bagian
  // If they are superadmin or viewer, they can view all, so default active is empty (Semua Bagian)
  const initialActive = role === 'admin' ? userBagian : ''
  const [activeBagian, setActiveBagian] = useState(initialActive)

  return (
    <DashboardContext.Provider
      value={{
        role,
        userBagian,
        activeBagian,
        setActiveBagian,
        availableBagianList,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
