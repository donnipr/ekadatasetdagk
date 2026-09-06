'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    {
      name: 'Dasbor',
      href: '/',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Program Kegiatan',
      href: '/kegiatan',
      icon: FolderOpen,
      show: true,
    },
    {
      name: 'Pengaturan',
      href: '/pengaturan',
      icon: Settings,
      show: isAdmin,
    },
  ]

  return (
    <div className={`flex h-full flex-col bg-white border-r border-gray-200 relative transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-50 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header / Logo */}
      <div className={`flex h-16 items-center border-b border-gray-100 overflow-hidden transition-all ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        {isCollapsed ? (
          <h1 className="text-lg font-bold text-red-600">GK</h1>
        ) : (
          <h1 className="text-lg font-bold text-slate-800 whitespace-nowrap">Ekadata <span className="text-red-600">Setda GK</span></h1>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1 px-3 py-4">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${
                    isActive
                      ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                      : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900 border-l-4 border-transparent'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 transition-all ${
                      isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-500'
                    } ${isCollapsed ? 'mr-0' : 'mr-3'}`}
                    aria-hidden="true"
                  />
                  <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                    {item.name}
                  </span>
                </Link>
              )
            })}
        </nav>
      </div>
    </div>
  )
}
