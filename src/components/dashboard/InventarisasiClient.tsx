'use client'

import React, { useState, useEffect } from 'react'
import { Search, ArrowUpDown, Database, RefreshCw, ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react'
import Link from 'next/link'

export interface InventarisasiData {
  id: string
  bagian: string | null
  nama_data: string | null
  deskripsi: string | null
  satuan: string | null
  kategori: string | null
  periode: string | null
  aplikasi: string | null
  keterangan: string | null
  capaian: string | null
  created_at: string
}

export interface SettingsInventarisasiData {
  id: string
  nama_pengaturan: string
  sheet_url: string
  last_sync: string | null
}

type SortConfig = { key: keyof InventarisasiData | null, direction: 'asc' | 'desc' }

export function InventarisasiClient({ 
  initialData, 
  isAdmin,
}: { 
  initialData: InventarisasiData[],
  isAdmin: boolean,
}) {
  const [data, setData] = useState<InventarisasiData[]>(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSort = (key: keyof InventarisasiData) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const SortableHeader = ({ label, sortKey, align = 'left', widthClass = '' }: { label: string, sortKey: keyof InventarisasiData, align?: 'left'|'center'|'right', widthClass?: string }) => (
    <th 
      scope="col" 
      className={`px-4 py-3 align-top whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${widthClass}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center inline-flex gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        {sortConfig.key === sortKey && (
          <span className="text-blue-500 font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
        )}
        {sortConfig.key !== sortKey && (
          <ArrowUpDown className="h-3 w-3 text-gray-400 opacity-0 hover:opacity-100" />
        )}
      </div>
    </th>
  )

  // Filtering
  const filteredData = data.filter(item => 
    (item.nama_data?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (item.bagian?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
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

  // Grouping
  const groupedData = processedData.reduce((acc, item) => {
    const key = item.bagian || 'Tanpa Bagian';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, InventarisasiData[]>);

  const getCapaianColor = (value: string | null) => {
    if (!value || value === '-') return 'bg-gray-100 text-gray-500 border-gray-200';
    
    const lowerVal = value.toLowerCase();
    
    // Jika berisi teks status proses/belum
    if (lowerVal.includes('proses') || lowerVal.includes('belum')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }

    // Coba ubah ke angka (mengganti koma desimal Indonesia menjadi titik)
    const numericString = value.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
    const num = parseFloat(numericString);

    if (!isNaN(num) && numericString !== '') {
      // Cek apakah string aslinya mengandung teks (misal "Masjid", "lembaga") selain Rp
      const hasAlphabet = /[a-zA-Z]/.test(value.replace(/Rp|IDR/gi, ''));
      if (!hasAlphabet) {
        if (num < 0) return 'bg-rose-100 text-rose-700 border-rose-200'; // Merah untuk minus
        if (num === 0) return 'bg-slate-100 text-slate-700 border-slate-200'; // Abu-abu untuk 0
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Hijau untuk nilai positif
      }
    }

    // Default untuk teks lainnya (misal: "18 Masjid", "2 lembaga")
    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  };

  if (!isMounted) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari Nama Data atau Bagian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {isAdmin && (
              <Link 
                href="/inventarisasi/pengaturan"
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Pengaturan Sinkronisasi
              </Link>
            )}
          </div>

          <div className="space-y-4">
            {Object.keys(groupedData).length > 0 ? (
              Object.keys(groupedData).map((bagian) => {
                const groupItems = groupedData[bagian];
                const isExpanded = expandedGroups[bagian] ?? true;

                return (
                  <div key={bagian} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleGroup(bagian)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center space-x-3">
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                        <h3 className="font-bold text-slate-800 text-lg text-left">{bagian}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {groupItems.length} Item
                        </span>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="w-full overflow-x-auto pb-4 border-t border-gray-200">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="w-12 px-4 py-3 align-top"></th>
                              <SortableHeader label="Nama Data" sortKey="nama_data" />
                              <SortableHeader label="Deskripsi" sortKey="deskripsi" />
                              <SortableHeader label="Capaian" sortKey="capaian" align="center" />
                            </tr>
                          </thead>
                          <tbody>
                            {groupItems.map((item) => (
                              <React.Fragment key={item.id}>
                                <tr className="border-b border-gray-100 hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 align-top w-12 text-center">
                                    <button 
                                      onClick={() => setExpandedRowId(prev => prev === item.id ? null : item.id)}
                                      className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none transition-colors"
                                      title={expandedRowId === item.id ? 'Tutup Detail' : 'Buka Detail'}
                                    >
                                      {expandedRowId === item.id ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 min-w-[250px] font-medium text-slate-900 align-top">{item.nama_data || '-'}</td>
                                  <td className="px-4 py-3 align-top">
                                    <div className="line-clamp-2 text-sm text-gray-500 whitespace-normal" title={item.deskripsi || ''}>
                                      {item.deskripsi || '-'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap align-top text-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-bold border ${getCapaianColor(item.capaian)}`}>
                                      {item.capaian || '-'}
                                    </span>
                                  </td>
                                </tr>
                                
                                {expandedRowId === item.id && (
                                  <tr className="bg-slate-50/80 border-b border-gray-200">
                                    <td colSpan={4} className="p-4 px-12">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                        <div className="flex flex-col">
                                          <span className="text-gray-500 text-xs mb-1">Satuan</span>
                                          <span className="font-medium text-slate-700">{item.satuan || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-gray-500 text-xs mb-1">Periode</span>
                                          <span className="font-medium text-slate-700">{item.periode || '-'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-gray-500 text-xs mb-1">Kategori</span>
                                          <span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.kategori?.toLowerCase() === 'publik' ? 'bg-emerald-100 text-emerald-700' : item.kategori?.toLowerCase() === 'privat' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'}`}>
                                              {item.kategori || '-'}
                                            </span>
                                          </span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-gray-500 text-xs mb-1">Aplikasi</span>
                                          <span className="text-slate-700">{item.aplikasi || '-'}</span>
                                        </div>
                                        <div className="flex flex-col md:col-span-2 lg:col-span-4">
                                          <span className="text-gray-500 text-xs mb-1">Keterangan</span>
                                          <span className="text-slate-700">{item.keterangan || '-'}</span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-slate-500 shadow-sm">
                <Database className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p>Data tidak ditemukan atau belum ada data yang tersinkronisasi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
