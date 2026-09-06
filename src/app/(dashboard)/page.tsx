export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'

type ProgramAggregate = {
  bidang: string
  pagu_anggaran: number
  realisasi_nominal: number
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch data to aggregate
  // Note: Supabase JS doesn't support direct .sum() in select without RPC/Views. 
  // We fetch required columns and group in memory.
  const { data: programs, error } = await supabase
    .from('programs')
    .select('bidang, pagu_anggaran, realisasi_nominal')

  // Group by bidang
  const aggregatedMap = new Map<string, { pagu: number; realisasi: number }>()
  
  if (programs) {
    for (const p of programs) {
      const b = p.bidang || 'Tidak Diketahui'
      if (!aggregatedMap.has(b)) {
        aggregatedMap.set(b, { pagu: 0, realisasi: 0 })
      }
      const current = aggregatedMap.get(b)!
      current.pagu += Number(p.pagu_anggaran || 0)
      current.realisasi += Number(p.realisasi_nominal || 0)
    }
  }

  const aggregates = Array.from(aggregatedMap.entries()).map(([bidang, totals]) => ({
    bidang,
    pagu_anggaran: totals.pagu,
    realisasi_nominal: totals.realisasi,
    persentase: totals.pagu > 0 ? ((totals.realisasi / totals.pagu) * 100).toFixed(2) : 0
  }))

  // Sort by pagu descending
  aggregates.sort((a, b) => b.pagu_anggaran - a.pagu_anggaran)

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ringkasan Eksekutif</h1>
          <p className="text-sm text-slate-500 mt-1">Rekapitulasi anggaran dan realisasi per bagian.</p>
        </div>
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

      {!error && aggregates.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <p className="text-slate-500">Belum ada data program kegiatan yang tersinkronisasi.</p>
        </div>
      )}

      {aggregates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Bagian / Bidang
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Pagu Anggaran
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Realisasi
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Capaian (%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aggregates.map((row) => (
                  <tr key={row.bidang} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {row.bidang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 text-right">
                      {formatRp(row.pagu_anggaran)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                      {formatRp(row.realisasi_nominal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        Number(row.persentase) >= 100 ? 'bg-green-100 text-green-800' : 
                        Number(row.persentase) > 0 ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.persentase}%
                      </span>
                    </td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                    {formatRp(aggregates.reduce((acc, curr) => acc + curr.pagu_anggaran, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-700 text-right">
                    {formatRp(aggregates.reduce((acc, curr) => acc + curr.realisasi_nominal, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                    {(() => {
                      const totalPagu = aggregates.reduce((acc, curr) => acc + curr.pagu_anggaran, 0)
                      const totalRealisasi = aggregates.reduce((acc, curr) => acc + curr.realisasi_nominal, 0)
                      return totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(2) + '%' : '0%'
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
