import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/utils/supabase/server'
import Papa from 'papaparse'

export async function POST(req: Request) {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bagian_id } = await req.json()
    if (!bagian_id) {
      return NextResponse.json({ error: 'Parameter bagian_id diperlukan.' }, { status: 400 })
    }

    // Use service role for DB operations
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the Bagian Name from master_bagian
    const { data: masterBagian, error: masterError } = await supabase
      .from('master_bagian')
      .select('nama_bagian')
      .eq('id', bagian_id)
      .single()

    if (masterError || !masterBagian) {
      return NextResponse.json({ error: 'Data Bagian tidak ditemukan.' }, { status: 404 })
    }

    const nama_bagian = masterBagian.nama_bagian

    // Role check: If admin, they can only sync their own bagian
    const role = user.user_metadata?.role || 'viewer'
    const userBagian = user.user_metadata?.bagian || ''

    if (role === 'viewer') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
    }

    if (role === 'admin' && userBagian !== nama_bagian) {
      return NextResponse.json({ error: 'Akses ditolak. Anda hanya dapat menyinkronkan data bagian Anda.' }, { status: 403 })
    }

    // 1. Get Settings for this specific bagian
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('bagian_id', bagian_id)
      .single()

    if (settingsError || !settings?.sheet_url) {
      return NextResponse.json(
        { error: `URL Google Sheets untuk ${nama_bagian} belum diatur.` },
        { status: 400 }
      )
    }

    const sheetUrl = settings.sheet_url as string
    
    // Transform standard Google Sheets URL to export CSV URL
    let csvUrl = sheetUrl
    const match = sheetUrl.match(/\/d\/(.*?)(\/|$)/)
    if (match && match[1]) {
      const docId = match[1]
      csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`
    }

    // 2. Fetch CSV
    const response = await fetch(csvUrl)
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gagal mengunduh data dari Google Sheets. Pastikan akses publik "Siapa saja yang memiliki link" telah aktif.' },
        { status: 500 }
      )
    }

    const csvText = await response.text()

    // 3. Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    })

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'Gagal membaca format CSV dari Google Sheets.' },
        { status: 500 }
      )
    }

    // 4. Transform data based on common headers
    const rows = parsed.data as any[]
    
    const formattedData = rows.map((row) => {
      const getVal = (keys: string[]) => {
        const foundKey = Object.keys(row).find(k => keys.some(key => k.toLowerCase().trim().includes(key)))
        return foundKey ? row[foundKey] : ''
      }

      const rawPagu = getVal(['pagu', 'anggaran', 'nilai'])
      const paguNum = parseInt(String(rawPagu).replace(/[^0-9]/g, ''), 10) || 0

      const rawRealisasiNominal = getVal(['realisasi nominal', 'capaian nominal'])
      const realisasiNominalNum = parseInt(String(rawRealisasiNominal).replace(/[^0-9]/g, ''), 10) || 0

      const rawRealisasiPersen = getVal(['realisasi persen', 'capaian persen', 'persentase'])
      const realisasiPersenNum = parseFloat(String(rawRealisasiPersen).replace(/,/g, '.').replace(/[^0-9.]/g, '')) || 0

      return {
        tahun: settings.tahun,
        program_kegiatan: getVal(['program kegiatan', 'program']),
        kegiatan: getVal(['kegiatan']),
        sub_kegiatan: getVal(['sub kegiatan', 'sub_kegiatan']),
        rincian_kegiatan: getVal(['rincian kegiatan', 'rincian']),
        deskripsi_rincian: getVal(['deskripsi', 'uraian']),
        sasaran: getVal(['sasaran']),
        penerima_manfaat: getVal(['penerima manfaat', 'penerima']),
        pagu_anggaran: paguNum,
        realisasi_nominal: realisasiNominalNum,
        realisasi_persentase: realisasiPersenNum,
        realisasi_fisik: getVal(['realisasi fisik', 'fisik']),
        jadwal_pelaksanaan: getVal(['jadwal', 'waktu']),
        sumber_anggaran: getVal(['sumber', 'sumber dana', 'sumber anggaran']),
        bentuk_sasaran: getVal(['bentuk sasaran', 'bentuk']),
        bidang: nama_bagian, // Force assigned bagian regardless of sheet value
      }
    }).filter(d => d.program_kegiatan || d.sub_kegiatan) // only insert valid rows

    // 5. Delete existing for the year AND the specific bagian
    await supabase
      .from('programs')
      .delete()
      .eq('tahun', settings.tahun)
      .eq('bidang', nama_bagian)
    
    const { error: insertError } = await supabase
      .from('programs')
      .insert(formattedData)

    if (insertError) {
      return NextResponse.json(
        { error: 'Gagal menyimpan data ke database: ' + insertError.message },
        { status: 500 }
      )
    }

    // 6. Update last sync time
    await supabase
      .from('settings')
      .update({ last_sync: new Date().toISOString() })
      .eq('bagian_id', bagian_id)

    revalidatePath('/')
    revalidatePath('/kegiatan')

    return NextResponse.json({ success: true, count: formattedData.length })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    )
  }
}
