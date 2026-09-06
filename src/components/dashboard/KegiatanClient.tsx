'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { useDashboard } from '../providers/DashboardContext'

export type Program = {
  id: string
  tahun: string
  program_kegiatan: string
  kegiatan: string
  sub_kegiatan: string
  rincian_kegiatan: string
  deskripsi_rincian: string
  sasaran: string
  penerima_manfaat: string
  pagu_anggaran: number
  realisasi_nominal: number
  realisasi_persentase: number
  realisasi_fisik: string
  jadwal_pelaksanaan: string
  sumber_anggaran: string
  bentuk_sasaran: string
  bidang: string
}

export function KegiatanClient({ initialPrograms }: { initialPrograms: Program[] }) {
  const { activeBagian, setActiveBagian, availableBagianList, role, userBagian } = useDashboard()
  const [search, setSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

  const bidangList = Array.from(new Set(initialPrograms.map((p) => p.bidang))).filter(Boolean)

  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter((p) => {
      const matchSearch =
        p.sub_kegiatan?.toLowerCase().includes(search.toLowerCase()) ||
        p.program_kegiatan?.toLowerCase().includes(search.toLowerCase())
      
      const matchBidang = activeBagian ? p.bidang === activeBagian : true

      return matchSearch && matchBidang
    })
  }, [initialPrograms, search, activeBagian])

  const totalKegiatan = filteredPrograms.length
  const totalPagu = filteredPrograms.reduce((acc, curr) => acc + Number(curr.pagu_anggaran || 0), 0)
  const totalRealisasi = filteredPrograms.reduce((acc, curr) => acc + Number(curr.realisasi_nominal || 0), 0)

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-slate-500">Total Kegiatan</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalKegiatan}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-slate-500">Total Pagu Anggaran</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {formatRp(totalPagu)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-slate-500">Total Realisasi</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {formatRp(totalRealisasi)}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-slate-800 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
            placeholder="Cari sub kegiatan atau program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              value={activeBagian}
              onChange={(e) => setActiveBagian(e.target.value)}
              disabled={role === 'admin'}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-800 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 appearance-none bg-white disabled:bg-gray-100"
            >
              <option value="">Semua Bagian</option>
              {availableBagianList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Bidang
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Sub Kegiatan
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pagu Anggaran
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Capaian (%)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Jadwal
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrograms.length > 0 ? (
                filteredPrograms.map((program) => (
                  <tr key={program.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {program.bidang}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium max-w-sm truncate" title={program.sub_kegiatan}>
                      {program.sub_kegiatan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 text-right">
                      {formatRp(program.pagu_anggaran)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        program.realisasi_persentase >= 100 ? 'bg-green-100 text-green-800' : 
                        program.realisasi_persentase > 0 ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {program.realisasi_persentase}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {program.jadwal_pelaksanaan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedProgram(program)}
                        className="text-red-600 hover:text-red-900 border border-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                      >
                        Rincian
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Rincian */}
      {selectedProgram && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedProgram(null)}></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    onClick={() => setSelectedProgram(null)}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <h3 className="text-xl font-semibold leading-6 text-slate-800" id="modal-title">
                      Rincian Kegiatan
                    </h3>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-gray-200 pt-6">
                      
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Program Kegiatan</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-semibold">{selectedProgram.program_kegiatan}</dd>
                      </div>

                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Kegiatan</dt>
                        <dd className="mt-1 text-sm text-slate-900 font-semibold">{selectedProgram.kegiatan}</dd>
                      </div>

                      <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                        <dt className="text-sm font-medium text-slate-500">Sub Kegiatan</dt>
                        <dd className="mt-1 text-base text-slate-900 font-bold">{selectedProgram.sub_kegiatan}</dd>
                      </div>
                      
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Bidang</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.bidang}</dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-slate-500">Jadwal Pelaksanaan</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.jadwal_pelaksanaan}</dd>
                      </div>
                      
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Rincian Kegiatan</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.rincian_kegiatan}</dd>
                      </div>
                      
                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Deskripsi Rincian</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.deskripsi_rincian}</dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-slate-500">Sasaran</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.sasaran}</dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-slate-500">Bentuk Sasaran</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.bentuk_sasaran}</dd>
                      </div>

                      <div className="md:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Penerima Manfaat</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.penerima_manfaat}</dd>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <dt className="text-sm font-medium text-slate-500">Sumber Anggaran</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.sumber_anggaran}</dd>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <dt className="text-sm font-medium text-slate-500">Realisasi Fisik</dt>
                        <dd className="mt-1 text-sm text-slate-900">{selectedProgram.realisasi_fisik}</dd>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-red-50 p-4 rounded-lg mt-2">
                        <div>
                          <dt className="text-xs font-medium text-red-800 uppercase tracking-wider">Pagu Anggaran</dt>
                          <dd className="mt-1 text-lg font-bold text-red-700">{formatRp(selectedProgram.pagu_anggaran)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-red-800 uppercase tracking-wider">Realisasi Nominal</dt>
                          <dd className="mt-1 text-lg font-bold text-red-700">{formatRp(selectedProgram.realisasi_nominal)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-red-800 uppercase tracking-wider">Realisasi (%)</dt>
                          <dd className="mt-1 text-lg font-bold text-red-700">{selectedProgram.realisasi_persentase}%</dd>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-1 sm:gap-3">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0"
                    onClick={() => setSelectedProgram(null)}
                  >
                    Tutup
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
