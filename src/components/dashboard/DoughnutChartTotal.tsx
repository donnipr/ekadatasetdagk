'use client'

import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'

export type TotalData = {
  name: string
  value: number
  color: string
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export function DoughnutChartTotal({ realisasi, sisa }: { realisasi: number, sisa: number }) {
  const data: TotalData[] = [
    { name: 'Total Realisasi', value: realisasi, color: '#dc2626' }, // red-600
    { name: 'Sisa Anggaran', value: sisa > 0 ? sisa : 0, color: '#e2e8f0' } // slate-200
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full min-h-[400px] flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Komposisi Serapan Keseluruhan</h2>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => formatRupiah(value)}
              labelStyle={{ display: 'none' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
