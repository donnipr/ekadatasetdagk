'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, FolderOpen } from 'lucide-react'

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

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
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-slate-800">Ekadata <span className="text-red-600">Setda GK</span></h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 px-3 py-4">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                      : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900 border-l-4 border-transparent'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
        </nav>
      </div>
    </div>
  )
}
