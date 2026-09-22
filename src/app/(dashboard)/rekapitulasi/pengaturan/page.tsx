export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SyncPengaturanClient } from '@/components/dashboard/SyncPengaturanClient'

export default async function PengaturanRekapitulasiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role || 'viewer'
  const isAdmin = role === 'admin' || role === 'superadmin'

  if (!isAdmin) {
    redirect('/rekapitulasi')
  }

  // Ambil semua pengaturan
  const { data: settingsData } = await supabase
    .from('settings_rekapitulasi')
    .select('id, tahun, sheet_url, last_sync')
    .order('tahun', { ascending: false })

  const settings = settingsData || []

  return <SyncPengaturanClient settings={settings} />
}
