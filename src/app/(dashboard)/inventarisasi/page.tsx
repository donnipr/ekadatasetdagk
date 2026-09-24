export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { InventarisasiClient, type InventarisasiData } from '@/components/dashboard/InventarisasiClient'

export default async function InventarisasiPage() {
  const supabase = await createClient()

  // Ambil data user untuk mengetahui apakah dia admin
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role || 'viewer'
  const isAdmin = role === 'admin' || role === 'superadmin'

  // Ambil data inventarisasi dari database
  const { data: inventarisasi, error } = await supabase
    .from('inventarisasi_data')
    .select('*')
    .order('created_at', { ascending: false })

  const typedInventarisasi: InventarisasiData[] = inventarisasi || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Inventarisasi Data Dashboard</h1>
      </div>
      
      {error && error.code !== '42P01' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          Gagal mengambil data dari database: {error.message}
        </div>
      )}

      {error?.code === '42P01' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm">
          Tabel "inventarisasi_data" belum tersedia di database. Silakan jalankan skrip SQL terlebih dahulu.
        </div>
      )}

      <InventarisasiClient 
        initialData={typedInventarisasi} 
        isAdmin={isAdmin} 
      />
    </div>
  )
}
