export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { KegiatanClient, type Program } from '@/components/dashboard/KegiatanClient'

export default async function KegiatanPage() {
  const supabase = await createClient()

  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false })

  const typedPrograms: Program[] = programs || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Program Kegiatan</h1>
      </div>
      
      {error && error.code !== '42P01' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          Gagal mengambil data dari database: {error.message}
        </div>
      )}

      {error?.code === '42P01' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm">
          Tabel "programs" belum tersedia di database. Silakan sinkronisasi data melalui menu Pengaturan.
        </div>
      )}

      <KegiatanClient initialPrograms={typedPrograms} />
    </div>
  )
}
