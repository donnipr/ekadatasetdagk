export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SyncInventarisasiClient } from '@/components/dashboard/SyncInventarisasiClient'

export default async function PengaturanInventarisasiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role || 'viewer'
  const isAdmin = role === 'admin' || role === 'superadmin'

  if (!isAdmin) {
    redirect('/inventarisasi')
  }

  // Ambil semua pengaturan
  const { data: settingsData, error } = await supabase
    .from('settings_inventarisasi')
    .select('id, nama_pengaturan, sheet_url, last_sync')
    .order('created_at', { ascending: true })

  if (error) {
    console.error("Gagal mengambil data pengaturan:", error.message);
  }

  const settings = settingsData || []

  return <SyncInventarisasiClient settings={settings} />
}
