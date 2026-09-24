import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Papa from 'papaparse'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    // Check if user is logged in
    const { data: { user } } = await supabaseAnon.auth.getUser()
    const role = user?.user_metadata?.role
    const isAdmin = role === 'admin' || role === 'superadmin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    
    // Create admin client for bypassing RLS during bulk operation
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {}
        }
      }
    )

    let sheetUrl = body.sheetUrl;
    let namaPengaturan = body.namaPengaturan || 'Utama';

    if (!sheetUrl) {
      const { data: settings } = await supabaseAdmin
        .from('settings_inventarisasi')
        .select('sheet_url')
        .eq('nama_pengaturan', namaPengaturan)
        .single()
      
      if (!settings?.sheet_url) {
        return NextResponse.json({ error: `URL Google Sheets untuk pengaturan ${namaPengaturan} belum diatur` }, { status: 400 })
      }
      sheetUrl = settings.sheet_url;
    } else {
      // Save/update the settings using upsert with onConflict on 'nama_pengaturan'
      await supabaseAdmin
        .from('settings_inventarisasi')
        .upsert(
          { nama_pengaturan: namaPengaturan, sheet_url: sheetUrl, last_sync: new Date().toISOString() }, 
          { onConflict: 'nama_pengaturan' }
        )
    }

    // Convert standard Google Sheets URL to export CSV URL
    const csvUrl = sheetUrl.replace('/edit?usp=sharing', '/export?format=csv').replace('/edit', '/export?format=csv');

    // Fetch the CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Gagal mengunduh data dari Google Sheets. Pastikan aksesnya diset ke "Anyone with the link"' }, { status: 400 })
    }
    const csvData = await response.text();

    // Parse the CSV
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Jangan auto-convert ke number, karena kita simpan di DB sebagai text
      transformHeader: (header) => {
        // Mengubah "NAMA DATA" menjadi "nama_data"
        return header.trim().toLowerCase().replace(/\s+/g, '_');
      },
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: 'Gagal mengurai CSV', details: parsed.errors }, { status: 400 })
    }

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sheet kosong' }, { status: 400 })
    }

    // Map rows to match database schema
    const formattedData = rows.map((row) => ({
      bagian: row.bagian || null,
      nama_data: row.nama_data || null,
      deskripsi: row.deskripsi || null,
      satuan: row.satuan || null,
      kategori: row.kategori || null,
      periode: row.periode || null,
      aplikasi: row.aplikasi || null,
      keterangan: row.keterangan || null,
      capaian: row.capaian !== undefined && row.capaian !== null ? String(row.capaian) : null,
    })).filter(item => item.nama_data); // Hapus baris yang kosong atau tidak memiliki nama_data

    // Hapus semua data lama sebelum insert baru
    const { error: delError } = await supabaseAdmin
      .from('inventarisasi_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (delError) {
      return NextResponse.json({ error: `Gagal menghapus data lama`, details: delError }, { status: 500 })
    }

    // Insert new data
    const { data, error: supabaseError } = await supabaseAdmin
      .from('inventarisasi_data')
      .insert(formattedData)

    if (supabaseError) {
      console.error("Supabase Insert Error:", supabaseError);
      return NextResponse.json({ error: supabaseError.message, details: supabaseError }, { status: 500 })
    }
    
    // Update last_sync timestamp if we didn't insert a new URL above
    if (!body.sheetUrl) {
      await supabaseAdmin
        .from('settings_inventarisasi')
        .upsert(
          { nama_pengaturan: namaPengaturan, sheet_url: sheetUrl, last_sync: new Date().toISOString() },
          { onConflict: 'nama_pengaturan' }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil mensinkronkan ${formattedData.length} baris data inventarisasi.` 
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server" }, { status: 500 })
  }
}
