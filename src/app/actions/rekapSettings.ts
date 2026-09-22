'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getAdminClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      }
    }
  )
}

export async function saveRekapSetting(tahun: string, sheetUrl: string) {
  try {
    const supabase = await getAdminClient()
    
    const { error } = await supabase
      .from('settings_rekapitulasi')
      .upsert(
        { tahun, sheet_url: sheetUrl, last_sync: new Date().toISOString() },
        { onConflict: 'tahun' }
      )

    if (error) throw error
    
    revalidatePath('/rekapitulasi')
    return { success: true, message: 'Pengaturan berhasil disimpan' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menyimpan pengaturan' }
  }
}

export async function deleteRekapSetting(tahun: string) {
  try {
    const supabase = await getAdminClient()
    
    const { error } = await supabase
      .from('settings_rekapitulasi')
      .delete()
      .eq('tahun', tahun)

    if (error) throw error
    
    revalidatePath('/rekapitulasi')
    return { success: true, message: `Pengaturan tahun ${tahun} berhasil dihapus` }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal menghapus pengaturan' }
  }
}
