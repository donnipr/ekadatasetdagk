'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Search, Wallet, TrendingUp, Banknote, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

export interface RekapitulasiData {
  id: string
  tahun: string
  opd: string
  anggaran: number | null
  bobot_opd: number | null
  target_keuangan_rp: number | null
  target_keuangan_persen: number | null
  target_keuangan_tt: number | null
  realisasi_keuangan_rp: number | null
  realisasi_keuangan_persen: number | null
  realisasi_keuangan_rt: number | null
  sisa_keuangan_rp: number | null
  kinerja_keluaran_target: number | null
  kinerja_keluaran_realisasi: number | null
  tertimbang_t: number | null
  tertimbang_r: number | null
  created_at: string
}

export interface SettingsData {
  id: string
  tahun: string
  sheet_url: string
  last_sync: string | null
}

type SortConfig = { key: keyof RekapitulasiData | null, direction: 'asc' | 'desc' }

export function RekapitulasiClient({ 
  initialData, 
  isAdmin,
  availableYears,
  currentYear,
  settings
}: { 
  initialData: RekapitulasiData[],
  isAdmin: boolean,
  availableYears: string[],
  currentYear: string,
  settings?: SettingsData[]
}) {
  const [data, setData] = useState<RekapitulasiData[]>(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState(currentYear)
  const [isMounted, setIsMounted] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const formatRupiah = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
  }

  const getColorByPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-gray-600 bg-gray-100'
    if (value < 50) return 'text-red-600 bg-red-100'
    if (value < 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-emerald-600 bg-emerald-100'
  }

  const renderProgressBar = (nilai: number | null | undefined) => {
    if (nilai === null || nilai === undefined) return <span className="text-gray-400">-</span>
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${getColorByPercentage(nilai)}`}>
          {nilai.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%
        </span>
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden hidden md:block">
          <div 
            className={`h-full rounded-full ${nilai < 50 ? 'bg-red-500' : nilai < 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.min(nilai, 100)}%` }}
          />
        </div>
      </div>
    )
  }

  const handleSort = (key: keyof RekapitulasiData) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string, sortKey: keyof RekapitulasiData, align?: 'left'|'center'|'right' }) => (
    <th 
      scope="col" 
      className={`px-4 py-3 whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center inline-flex gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        {sortConfig.key === sortKey && (
          <span className="text-red-500 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
        )}
        {sortConfig.key !== sortKey && (
          <ArrowUpDown className="h-3 w-3 text-gray-400 opacity-0 hover:opacity-100" />
        )}
      </div>
    </th>
  )

  // Filtering
  const filteredData = data.filter(item => 
    item.tahun === activeTab &&
    item.opd.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sorting
  const processedData = [...filteredData]
  if (sortConfig.key) {
    processedData.sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  // Calculating summaries
  const totalAnggaran = filteredData.reduce((sum, item) => sum + (item.anggaran || 0), 0)
  const totalRealisasi = filteredData.reduce((sum, item) => sum + (item.realisasi_keuangan_rp || 0), 0)
  const persentaseSerapan = totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0

  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Anggaran</p>
            <p className="text-xl font-bold text-gray-900">{formatRupiah(totalAnggaran)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Realisasi</p>
            <p className="text-xl font-bold text-gray-900">{formatRupiah(totalRealisasi)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Persentase Serapan</p>
            <p className="text-xl font-bold text-gray-900">{persentaseSerapan.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4 sm:px-6 space-x-6 overflow-x-auto" aria-label="Tabs">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setActiveTab(year)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === year
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Tahun {year}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari OPD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            
            {isAdmin && (
              <Link 
                href="/rekapitulasi/pengaturan"
                className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Pengaturan Sinkronisasi
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-y border-gray-200">
                <tr>
                  <SortableHeader label="OPD" sortKey="opd" />
                  <SortableHeader label="Anggaran" sortKey="anggaran" align="right" />
                  <SortableHeader label="Bobot OPD" sortKey="bobot_opd" align="center" />
                  <SortableHeader label="Target Keu (Rp)" sortKey="target_keuangan_rp" align="right" />
                  <SortableHeader label="Target Keu (%)" sortKey="target_keuangan_persen" align="center" />
                  <SortableHeader label="Target Keu (TT)" sortKey="target_keuangan_tt" align="center" />
                  <SortableHeader label="Real Keu (Rp)" sortKey="realisasi_keuangan_rp" align="right" />
                  <SortableHeader label="Real Keu (%)" sortKey="realisasi_keuangan_persen" align="center" />
                  <SortableHeader label="Real Keu (RT)" sortKey="realisasi_keuangan_rt" align="center" />
                  <SortableHeader label="Sisa Keu (Rp)" sortKey="sisa_keuangan_rp" align="right" />
                  <SortableHeader label="Kinerja Kel (Target)" sortKey="kinerja_keluaran_target" align="center" />
                  <SortableHeader label="Kinerja Kel (Real)" sortKey="kinerja_keluaran_realisasi" align="center" />
                  <SortableHeader label="Tertimbang (T)" sortKey="tertimbang_t" align="center" />
                  <SortableHeader label="Tertimbang (R)" sortKey="tertimbang_r" align="center" />
                </tr>
              </thead>
              <tbody>
                {processedData.length > 0 ? (
                  processedData.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{item.opd}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">{formatRupiah(item.anggaran)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">{formatNumber(item.bobot_opd)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">{formatRupiah(item.target_keuangan_rp)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">
                        {renderProgressBar(item.target_keuangan_persen)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">{formatNumber(item.target_keuangan_tt)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">{formatRupiah(item.realisasi_keuangan_rp)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">
                        {renderProgressBar(item.realisasi_keuangan_persen)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">{formatNumber(item.realisasi_keuangan_rt)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-600">{formatRupiah(item.sisa_keuangan_rp)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">{formatNumber(item.kinerja_keluaran_target)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">
                        {renderProgressBar(item.kinerja_keluaran_realisasi)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">{formatNumber(item.tertimbang_t)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-slate-600">{formatNumber(item.tertimbang_r)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-slate-500">
                      {data.filter(item => item.tahun === activeTab).length === 0 
                        ? `Belum ada data rekapitulasi untuk tahun ${activeTab}.` 
                        : "Data tidak ditemukan."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
