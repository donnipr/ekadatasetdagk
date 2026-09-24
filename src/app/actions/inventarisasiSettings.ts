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

export async function saveInventarisasiSetting(namaPengaturan: string, sheetUrl: string, id?: string) {
  try {
    const supabase = await getAdminClient()
    
    let error;

    if (id) {
      const { error: updateError } = await supabase
        .from('settings_inventarisasi')
        .update({ nama_pengaturan: namaPengaturan, sheet_url: sheetUrl, last_sync: new Date().toISOString() })
        .eq('id', id)
      error = updateError
    } else {
      const { error: upsertError } = await supabase
        .from('settings_inventarisasi')
        .upsert(
          { nama_pengaturan: namaPengaturan, sheet_url: sheetUrl, last_sync: new Date().toISOString() },
          { onConflict: 'nama_pengaturan' }
        )
      error = upsertError
    }

    if (error) throw error
    
    revalidatePath('/inventarisasi/pengaturan')
    revalidatePath('/inventarisasi')
    return { success: true, message: 'Pengaturan berhasil disimpan' }
  } catch (error: any) {
    console.error("Gagal menyimpan pengaturan inventarisasi:", error.message);
    return { success: false, error: error.message || 'Gagal menyimpan pengaturan' }
  }
}

export async function deleteInventarisasiSetting(namaPengaturan: string) {
  try {
    const supabase = await getAdminClient()
    
    const { error } = await supabase
      .from('settings_inventarisasi')
      .delete()
      .eq('nama_pengaturan', namaPengaturan)

    if (error) throw error
    
    revalidatePath('/inventarisasi/pengaturan')
    revalidatePath('/inventarisasi')
    return { success: true, message: `Pengaturan ${namaPengaturan} berhasil dihapus` }
  } catch (error: any) {
    console.error("Gagal menghapus pengaturan inventarisasi:", error.message);
    return { success: false, error: error.message || 'Gagal menghapus pengaturan' }
  }
}
