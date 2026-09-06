import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { createClient } from '@/utils/supabase/server'
import { DashboardProvider } from '@/components/providers/DashboardContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Custom claims or user_metadata could hold role and bagian. 
  // For demonstration, let's assume `role: admin` and `bagian: Umum` in metadata, 
  // or default to viewer if undefined.
  const role = user?.user_metadata?.role || 'viewer'
  const userBagian = user?.user_metadata?.bagian || ''
  
  // Fetch available Bagian list from master_bagian table for dropdowns
  const { data: bagianData } = await supabase.from('master_bagian').select('nama_bagian').order('nama_bagian')
  const availableBagianList = bagianData 
    ? bagianData.map(b => b.nama_bagian).filter(Boolean)
    : []

  const isAdmin = role === 'admin' || role === 'superadmin'

  return (
    <DashboardProvider role={role} userBagian={userBagian} availableBagianList={availableBagianList as string[]}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar isAdmin={isAdmin} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar userEmail={user?.email || ''} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  )
}
