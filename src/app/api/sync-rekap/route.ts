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

    // Get the request body which may contain a custom sheetUrl, or fetch from DB
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
    let tahun = body.tahun;

    if (!tahun) {
      return NextResponse.json({ error: 'Parameter tahun diperlukan' }, { status: 400 })
    }

    if (!sheetUrl) {
      const { data: settings } = await supabaseAdmin
        .from('settings_rekapitulasi')
        .select('sheet_url')
        .eq('tahun', tahun)
        .single()
      
      if (!settings?.sheet_url) {
        return NextResponse.json({ error: `URL Google Sheets untuk tahun ${tahun} belum diatur` }, { status: 400 })
      }
      sheetUrl = settings.sheet_url;
    } else {
      // Save/update the settings using upsert with onConflict on 'tahun'
      await supabaseAdmin
        .from('settings_rekapitulasi')
        .upsert(
          { tahun: tahun, sheet_url: sheetUrl, last_sync: new Date().toISOString() }, 
          { onConflict: 'tahun' }
        )
    }

    // Convert standard Google Sheets URL to export CSV URL
    let exportUrl = sheetUrl;
    if (sheetUrl.includes('/edit')) {
      exportUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
    }

    // Fetch the CSV data
    const response = await fetch(exportUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Gagal mengunduh data dari Google Sheets. Pastikan aksesnya diset ke "Anyone with the link"' }, { status: 400 })
    }
    const csvData = await response.text();

    // Parse the CSV
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically converts numbers
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ error: 'Gagal mengurai CSV', details: parsed.errors }, { status: 400 })
    }

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sheet kosong' }, { status: 400 })
    }

    // Map rows to match database schema, in case column names are slightly different
    const parseBigInt = (val: any) => {
      if (!val) return 0;
      let strVal = String(val);
      strVal = strVal.replace(/Rp/gi, '').replace(/\s/g, '');
      strVal = strVal.split(',')[0]; 
      strVal = strVal.replace(/\./g, '');
      const parsed = parseInt(strVal, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseDecimal = (val: any) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      let strVal = String(val);
      strVal = strVal.replace(/%/g, '').replace(/\s/g, '');
      strVal = strVal.replace(/,/g, '.');
      const parsed = parseFloat(strVal);
      return isNaN(parsed) ? 0 : parsed;
    };

    const formattedData = rows.map((row) => ({
      tahun: tahun,
      opd: row.opd || row.OPD || '-',
      anggaran: parseBigInt(row.anggaran || row.Anggaran),
      bobot_opd: parseDecimal(row.bobot_opd || row['Bobot OPD']),
      target_keuangan_rp: parseBigInt(row.target_keuangan_rp || row['Target Keuangan Rp']),
      target_keuangan_persen: parseDecimal(row.target_keuangan_persen || row['Target Keuangan Persen']),
      target_keuangan_tt: parseDecimal(row.target_keuangan_tt || row['Target Keuangan TT']),
      realisasi_keuangan_rp: parseBigInt(row.realisasi_keuangan_rp || row['Realisasi Keuangan Rp']),
      realisasi_keuangan_persen: parseDecimal(row.realisasi_keuangan_persen || row['Realisasi Keuangan Persen']),
      realisasi_keuangan_rt: parseDecimal(row.realisasi_keuangan_rt || row['Realisasi Keuangan RT']),
      sisa_keuangan_rp: parseBigInt(row.sisa_keuangan_rp || row['Sisa Keuangan Rp']),
      kinerja_keluaran_target: parseDecimal(row.kinerja_keluaran_target || row['Kinerja Keluaran Target']),
      kinerja_keluaran_realisasi: parseDecimal(row.kinerja_keluaran_realisasi || row['Kinerja Keluaran Realisasi']),
      tertimbang_t: parseDecimal(row.tertimbang_t || row['Tertimbang T']),
      tertimbang_r: parseDecimal(row.tertimbang_r || row['Tertimbang R']),
    })).filter(item => item.opd && item.opd !== '-'); // ensure OPD exists

    // Delete existing rows for this specific year
    const { error: delError } = await supabaseAdmin
      .from('rekapitulasi_capaian')
      .delete()
      .eq('tahun', tahun)

    if (delError) {
      return NextResponse.json({ error: `Gagal menghapus data lama untuk tahun ${tahun}`, details: delError }, { status: 500 })
    }

    // Insert new data
    const { data, error: supabaseError } = await supabaseAdmin
      .from('rekapitulasi_capaian')
      .insert(formattedData)

    if (supabaseError) {
      console.error("Supabase Insert Error:", supabaseError);
      return NextResponse.json({ error: supabaseError.message, details: supabaseError }, { status: 500 })
    }
    
    // Update last_sync timestamp if we didn't insert a new URL above
    if (!body.sheetUrl) {
      await supabaseAdmin
        .from('settings_rekapitulasi')
        .upsert(
          { tahun: tahun, sheet_url: sheetUrl, last_sync: new Date().toISOString() },
          { onConflict: 'tahun' }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil mensinkronkan ${formattedData.length} baris data.` 
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server" }, { status: 500 })
  }
}
