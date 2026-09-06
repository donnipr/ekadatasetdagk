'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { useDashboard } from '../providers/DashboardContext'

type MasterBagian = {
  id: string
  nama_bagian: string
}

export function PengaturanClient() {
  const [activeTab, setActiveTab] = useState<'kelola' | 'sinkronisasi'>('kelola')
  const { role } = useDashboard()

  const [bagianList, setBagianList] = useState<MasterBagian[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  
  // Tab 1 state
  const [newBagian, setNewBagian] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  // Tab 2 state
  const [syncBagianId, setSyncBagianId] = useState('')
  const [url, setUrl] = useState('')
  const [tahun, setTahun] = useState(new Date().getFullYear().toString())
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchBagian()
  }, [])

  const fetchBagian = async () => {
    setLoading(true)
    const { data } = await supabase.from('master_bagian').select('*').order('created_at', { ascending: true })
    if (data) setBagianList(data)
    setLoading(false)
  }

  // --- TAB 1 LOGIC (Kelola Bagian) ---
  const handleAddBagian = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBagian.trim()) return
    
    setMessage('')
    const { error } = await supabase.from('master_bagian').insert({ nama_bagian: newBagian.trim() })
    if (error) {
      setMessage(`Gagal menambahkan: ${error.message}`)
    } else {
      setNewBagian('')
      fetchBagian()
      setMessage('Berhasil ditambahkan.')
    }
  }

  const handleDeleteBagian = async (id: string) => {
    if (!confirm('Yakin ingin menghapus bagian ini? Semua data terkait di tabel settings juga akan terhapus.')) return
    
    setMessage('')
    const { error } = await supabase.from('master_bagian').delete().eq('id', id)
    if (error) setMessage(`Gagal menghapus: ${error.message}`)
    else {
      fetchBagian()
      setMessage('Berhasil dihapus.')
      if (syncBagianId === id) setSyncBagianId('')
    }
  }

  const startEdit = (b: MasterBagian) => {
    setEditingId(b.id)
    setEditVal(b.nama_bagian)
  }

  const saveEdit = async () => {
    if (!editVal.trim() || !editingId) return
    
    setMessage('')
    const { error } = await supabase.from('master_bagian').update({ nama_bagian: editVal.trim() }).eq('id', editingId)
    if (error) setMessage(`Gagal mengubah: ${error.message}`)
    else {
      setEditingId(null)
      fetchBagian()
      setMessage('Berhasil diubah.')
    }
  }

  // --- TAB 2 LOGIC (Sinkronisasi) ---
  useEffect(() => {
    if (activeTab === 'sinkronisasi' && syncBagianId) {
      loadSettings(syncBagianId)
    } else if (activeTab === 'sinkronisasi') {
      setUrl('')
      setTahun(new Date().getFullYear().toString())
      setLastSync(null)
    }
  }, [syncBagianId, activeTab])

  const loadSettings = async (bagian_id: string) => {
    setSyncLoading(true)
    setSyncMessage('')
    const { data } = await supabase.from('settings').select('*').eq('bagian_id', bagian_id).single()
    if (data) {
      setUrl(data.sheet_url || '')
      setTahun(data.tahun || new Date().getFullYear().toString())
      setLastSync(data.last_sync || null)
    } else {
      setUrl('')
      setTahun(new Date().getFullYear().toString())
      setLastSync(null)
    }
    setSyncLoading(false)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!syncBagianId) return

    setSyncLoading(true)
    setSyncMessage('')
    
    const { error } = await supabase
      .from('settings')
      .upsert({ bagian_id: syncBagianId, sheet_url: url, tahun }, { onConflict: 'bagian_id' })

    if (error) setSyncMessage(`Error menyimpan: ${error.message}`)
    else setSyncMessage('Pengaturan berhasil disimpan.')
    setSyncLoading(false)
  }

  const handleSync = async () => {
    if (!syncBagianId) return

    setSyncLoading(true)
    setSyncMessage('')
    try {
      const res = await fetch('/api/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bagian_id: syncBagianId })
      })
      const data = await res.json()
      
      if (res.ok) {
        setSyncMessage(`Sinkronisasi berhasil! ${data.count} data diperbarui.`)
        setLastSync(new Date().toISOString())
      } else {
        setSyncMessage(`Error sinkronisasi: ${data.error}`)
      }
    } catch (err: any) {
      setSyncMessage(`Terjadi kesalahan: ${err.message}`)
    }
    setSyncLoading(false)
  }

  // Prevent Non-Admin
  if (role === 'viewer') {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md text-sm">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('kelola')}
            className={`${
              activeTab === 'kelola'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Kelola Bagian
          </button>
          <button
            onClick={() => setActiveTab('sinkronisasi')}
            className={`${
              activeTab === 'sinkronisasi'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
          >
            Sinkronisasi Data
          </button>
        </nav>
      </div>

      {activeTab === 'kelola' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium leading-6 text-slate-800">Master Data Bagian</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kelola daftar bidang atau bagian yang ada di Setda Gunungkidul. Data ini akan muncul pada dropdown filter.
            </p>
          </div>

          <form onSubmit={handleAddBagian} className="flex gap-4">
            <input
              type="text"
              required
              value={newBagian}
              onChange={(e) => setNewBagian(e.target.value)}
              placeholder="Masukkan nama bagian baru..."
              className="block w-full max-w-sm rounded-md border-0 py-2 text-slate-800 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              Tambah
            </button>
          </form>

          {message && (
            <p className={`text-sm ${message.includes('Gagal') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
          )}

          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">
                        Nama Bagian
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr><td className="py-4 text-sm text-gray-500" colSpan={2}>Memuat data...</td></tr>
                    ) : bagianList.map((b) => (
                      <tr key={b.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">
                          {editingId === b.id ? (
                            <input
                              type="text"
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              className="block w-full max-w-sm rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                            />
                          ) : (
                            b.nama_bagian
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          {editingId === b.id ? (
                            <div className="flex justify-end gap-2">
                              <button onClick={saveEdit} className="text-green-600 hover:text-green-900"><Save className="h-4 w-4" /></button>
                              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-500"><X className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-3">
                              <button onClick={() => startEdit(b)} className="text-blue-600 hover:text-blue-900"><Edit2 className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteBagian(b.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sinkronisasi' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
          <div>
            <h2 className="text-lg font-medium leading-6 text-slate-800">Sinkronisasi Google Sheets</h2>
            <p className="mt-1 text-sm text-slate-500">Pilih bagian untuk mengatur URL sumber data dan melakukan sinkronisasi.</p>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-slate-900">Pilih Bagian</label>
            <select
              value={syncBagianId}
              onChange={(e) => setSyncBagianId(e.target.value)}
              className="mt-2 block w-full max-w-md rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
            >
              <option value="">-- Silakan pilih bagian --</option>
              {bagianList.map((b) => (
                <option key={b.id} value={b.id}>{b.nama_bagian}</option>
              ))}
            </select>
          </div>

          {syncBagianId && (
            <>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium leading-6 text-slate-900">URL Google Sheets</label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="url"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tahun" className="block text-sm font-medium leading-6 text-slate-900">Tahun Anggaran</label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="tahun"
                      id="tahun"
                      value={tahun}
                      onChange={(e) => setTahun(e.target.value)}
                      className="block w-full max-w-xs rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                      required
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={syncLoading}
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </form>

              <hr className="border-gray-200" />

              <div>
                <h3 className="text-md font-semibold text-slate-900">Tarik Data</h3>
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={handleSync}
                    disabled={syncLoading || !url}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors disabled:opacity-50"
                  >
                    {syncLoading ? 'Memproses...' : 'Sinkronisasi Sekarang'}
                  </button>
                  {lastSync && (
                    <span className="text-sm text-slate-500">
                      Terakhir disinkronkan: {new Date(lastSync).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {syncMessage && (
            <div className={`p-4 rounded-md text-sm ${syncMessage.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {syncMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
