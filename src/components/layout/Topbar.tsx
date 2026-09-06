'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export function Topbar({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U'

  return (
    <header className="flex h-16 w-full items-center justify-between bg-white px-6 shadow-sm z-10 border-b border-gray-100">
      <div className="flex items-center">
        <h2 className="text-lg font-bold text-slate-800">
          Ekadata Setda GK
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-600 hidden sm:block">
          {userEmail}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white font-medium shadow-sm">
            {initial}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  )
}
