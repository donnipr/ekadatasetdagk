export const dynamic = 'force-dynamic'

import { createClient } from '@/utils/supabase/server'
import { BarChartBagian } from '@/components/dashboard/BarChartBagian'
import { DoughnutChartTotal } from '@/components/dashboard/DoughnutChartTotal'

type ProgramAggregate = {
  bidang: string
  pagu_anggaran: number
  realisasi_nominal: number
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch data to aggregate
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

  // Calculate totals for metric cards
  const totalKeseluruhanPagu = aggregates.reduce((acc, curr) => acc + curr.pagu_anggaran, 0)
  const totalKeseluruhanRealisasi = aggregates.reduce((acc, curr) => acc + curr.realisasi_nominal, 0)
  const sisaAnggaran = totalKeseluruhanPagu - totalKeseluruhanRealisasi
  const persentaseTotal = totalKeseluruhanPagu > 0 ? ((totalKeseluruhanRealisasi / totalKeseluruhanPagu) * 100).toFixed(2) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dasbor Eksekutif</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan anggaran dan realisasi Setda Gunungkidul.</p>
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
        <>
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-slate-500">Total Pagu Keseluruhan</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{formatRp(totalKeseluruhanPagu)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-slate-500">Total Realisasi Keseluruhan</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatRp(totalKeseluruhanRealisasi)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-slate-500">Sisa Anggaran Keseluruhan</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{formatRp(sisaAnggaran > 0 ? sisaAnggaran : 0)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-slate-500">Persentase Serapan</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{persentaseTotal}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                      Bagian / Bidang
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                      Total Pagu Anggaran
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
                      Total Realisasi
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[150px]">
                            <div 
                              className={`h-2.5 rounded-full ${Number(row.persentase) >= 100 ? 'bg-green-500' : 'bg-red-600'}`} 
                              style={{ width: `${Math.min(Number(row.persentase), 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-700 w-12">{row.persentase}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Total Row */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 text-right">
                      {formatRp(totalKeseluruhanPagu)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-700 text-right">
                      {formatRp(totalKeseluruhanRealisasi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-gray-300 rounded-full h-2.5 max-w-[150px]">
                          <div 
                            className={`h-2.5 rounded-full ${Number(persentaseTotal) >= 100 ? 'bg-green-600' : 'bg-red-700'}`} 
                            style={{ width: `${Math.min(Number(persentaseTotal), 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-900 w-12">{persentaseTotal}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <BarChartBagian data={aggregates} />
            <DoughnutChartTotal realisasi={totalKeseluruhanRealisasi} sisa={sisaAnggaran} />
          </div>
        </>
      )}
    </div>
  )
}
