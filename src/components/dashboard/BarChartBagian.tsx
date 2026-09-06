'use client'

import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

export type AggregateData = {
  bidang: string
  pagu_anggaran: number
  realisasi_nominal: number
  persentase?: string | number
}

// Formatter to shorten large numbers (e.g. 15000000000 -> 15 M)
const formatCompactNumber = (number: number) => {
  return Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number)
}

// Formatter for Tooltip (Full Rupiah)
const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export function BarChartBagian({ data }: { data: AggregateData[] }) {
  // If no data, don't render an empty chart frame
  if (!data || data.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full min-h-[400px] flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Perbandingan Anggaran dan Realisasi per Bagian</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="bidang" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCompactNumber} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: any, name: any) => [
                formatRupiah(value), 
                name === 'pagu_anggaran' ? 'Pagu Anggaran' : 'Realisasi Nominal'
              ]}
              labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              iconType="circle"
              formatter={(value) => (
                <span className="text-slate-600 font-medium">
                  {value === 'pagu_anggaran' ? 'Pagu Anggaran' : 'Realisasi Nominal'}
                </span>
              )}
            />
            <Bar 
              dataKey="pagu_anggaran" 
              name="pagu_anggaran" 
              fill="#e2e8f0" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={60}
            />
            <Bar 
              dataKey="realisasi_nominal" 
              name="realisasi_nominal" 
              fill="#dc2626" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
