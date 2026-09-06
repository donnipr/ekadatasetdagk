import { PengaturanClient } from '@/components/dashboard/PengaturanClient'

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola data master dan sinkronisasi aplikasi.</p>
      </div>

      <PengaturanClient />
    </div>
  )
}
