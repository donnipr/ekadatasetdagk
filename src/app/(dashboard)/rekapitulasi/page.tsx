export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { RekapitulasiClient, type RekapitulasiData } from '@/components/dashboard/RekapitulasiClient'

export default async function RekapitulasiPage() {
  const supabase = await createClient()

  // Ambil data user untuk mengetahui apakah dia admin
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role || 'viewer'
  const isAdmin = role === 'admin' || role === 'superadmin'

  // Ambil data rekapitulasi dari database
  const { data: rekapitulasi, error } = await supabase
    .from('rekapitulasi_capaian')
    .select('*')
    .order('created_at', { ascending: false })

  const typedRekapitulasi: RekapitulasiData[] = rekapitulasi || []

  // Ambil pengaturan (semua tahun)
  const { data: settingsData } = await supabase
    .from('settings_rekapitulasi')
    .select('*')
    .order('tahun', { ascending: true })

  // Extract tahun untuk dijadikan tab
  const settings = settingsData || []
  let availableYears = settings.map(s => s.tahun)
  
  const currentYear = new Date().getFullYear().toString()
  
  // Jika database kosong, beri nilai default 1 tab
  if (availableYears.length === 0) {
    availableYears = [currentYear]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Rekapitulasi Capaian</h1>
      </div>
      
      {error && error.code !== '42P01' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          Gagal mengambil data dari database: {error.message}
        </div>
      )}

      {error?.code === '42P01' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm">
          Tabel "rekapitulasi_capaian" belum tersedia di database. Silakan jalankan skrip SQL terlebih dahulu.
        </div>
      )}

      <RekapitulasiClient 
        initialData={typedRekapitulasi} 
        isAdmin={isAdmin} 
        availableYears={availableYears}
        currentYear={availableYears.includes(currentYear) ? currentYear : availableYears[0]}
        settings={settings}
      />
    </div>
  )
}
