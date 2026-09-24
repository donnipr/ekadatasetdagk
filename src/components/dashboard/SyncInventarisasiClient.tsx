'use client'

import { useState } from 'react'
import { Plus, Trash2, Link2, Download, ArrowLeft, Database, Pencil } from 'lucide-react'
import { saveInventarisasiSetting, deleteInventarisasiSetting } from '@/app/actions/inventarisasiSettings'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export type SettingsInventarisasiData = {
  id: string;
  nama_pengaturan: string;
  sheet_url: string;
  last_sync: string | null;
}

export function SyncInventarisasiClient({ settings }: { settings: SettingsInventarisasiData[] }) {
  const router = useRouter()
  
  // Form state
  const [formNama, setFormNama] = useState('Utama')
  const [formUrl, setFormUrl] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null)
  
  // Sync state per row
  const [syncingRow, setSyncingRow] = useState<string | null>(null)

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    
    const res = await saveInventarisasiSetting(formNama, formUrl, editingId || undefined)
    if (res.success) {
      setMessage({ type: 'success', text: res.message || '' })
      setFormNama('Utama')
      setFormUrl('')
      setEditingId(null)
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || '' })
    }
    
    setIsSubmitting(false)
  }

  const handleDeleteSetting = async (namaPengaturan: string) => {
    if (!confirm(`Hapus pengaturan ${namaPengaturan}?`)) return
    
    setMessage(null)
    const res = await deleteInventarisasiSetting(namaPengaturan)
    if (res.success) {
      setMessage({ type: 'success', text: res.message || '' })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: res.error || '' })
    }
  }

  const handleSyncData = async (namaPengaturan: string, url: string) => {
    setSyncingRow(namaPengaturan)
    setMessage(null)
    
    try {
      const res = await fetch('/api/sync-inventarisasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: url, namaPengaturan }),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Terjadi kesalahan')

      setMessage({ type: 'success', text: result.message })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSyncingRow(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/inventarisasi" className="text-gray-500 hover:text-gray-900 transition-colors mr-4">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Sinkronisasi Data Inventarisasi</h1>
        </div>
        
        {message && (
          <div className={`mb-6 p-4 rounded-md text-sm border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Kiri: Form Tambah Sumber Data */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-slate-800 mb-5">
                {editingId ? 'Edit Sumber Data' : 'Tambah Sumber Data'}
              </h2>
              
              <form onSubmit={handleSaveSetting} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">NAMA PENGATURAN</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Misal: Utama"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">URL GOOGLE SHEETS CSV</label>
                  <input 
                    type="url" 
                    required 
                    placeholder="https://docs.google.com/..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
                  >
                    {isSubmitting ? 'Menyimpan...' : <><Plus className="h-5 w-5 mr-1" /> {editingId ? 'Update Data' : 'Simpan Data'}</>}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setFormNama('Utama')
                        setFormUrl('')
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Panel Kanan: Daftar Sumber Data */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 min-h-full">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">Daftar Sumber Data</h2>
              </div>
              
              {!settings || settings.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <Database className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Belum ada sumber data yang tersimpan.</p>
                  <p className="text-xs text-gray-400 mt-1">Silakan tambah sumber data melalui form di sebelah kiri.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {settings.map((item) => (
                    <li key={item.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm rounded-xl transition-all">
                      <div className="flex-1 min-w-0 mb-4 sm:mb-0 sm:pr-4">
                        <div className="flex items-center mb-1">
                          <Database className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {item.nama_pengaturan}
                          </p>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded px-2.5 py-1.5 ml-6">
                          <Link2 className="h-3.5 w-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                          <p className="text-xs text-gray-500 truncate w-full">
                            <a href={item.sheet_url} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                              {item.sheet_url}
                            </a>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:ml-4 ml-6">
                        <button
                          onClick={() => handleSyncData(item.nama_pengaturan, item.sheet_url)}
                          disabled={syncingRow === item.nama_pengaturan}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-colors shadow-sm"
                        >
                          {syncingRow === item.nama_pengaturan ? (
                            'Memproses...'
                          ) : (
                            <><Download className="h-3.5 w-3.5 mr-1.5" /> Tarik Data Sekarang</>
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setFormNama(item.nama_pengaturan)
                            setFormUrl(item.sheet_url)
                            setEditingId(item.id)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          disabled={syncingRow !== null}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSetting(item.nama_pengaturan)}
                          disabled={syncingRow !== null}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
