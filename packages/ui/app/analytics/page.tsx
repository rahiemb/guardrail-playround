'use client'

import { useMemo } from 'react'
import Header from '@/components/common/Header'
import { useAnalyticsStore } from '@/lib/store/analyticsStore'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'

export default function AnalyticsPage() {
  const { runs, clearAnalytics } = useAnalyticsStore()

  const stats = useMemo(() => {
    const totalRuns = runs.length
    if (totalRuns === 0) return null

    const totalBlocked = runs.filter(r => r.blocked).length
    const totalPassed = totalRuns - totalBlocked
    const avgLatency = runs.reduce((acc, curr) => acc + curr.totalTimeMs, 0) / totalRuns

    // Blocks per guardrail
    const blockReasons: Record<string, number> = {}
    runs.forEach(r => {
      r.guardrailResults.forEach(res => {
        if (res.status === 'fail') {
          blockReasons[res.guardrail_name] = (blockReasons[res.guardrail_name] || 0) + 1
        }
      })
    })

    const blockReasonsChart = Object.entries(blockReasons)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const latencyTrend = runs.map((r, i) => ({
      index: i + 1,
      latency: Math.round(r.totalTimeMs)
    }))

    return {
      totalRuns,
      totalBlocked,
      totalPassed,
      avgLatency,
      blockReasonsChart,
      latencyTrend
    }
  }, [runs])

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[var(--color-bg)]">
      <Header />
      
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Pipeline Analytics</h1>
            <button
              onClick={clearAnalytics}
              className="px-4 py-2 border border-[var(--color-border)] rounded text-[var(--color-text-muted)] hover:text-red-400 hover:border-red-400/50 transition-colors cursor-pointer text-sm font-medium"
            >
              Clear Data
            </button>
          </div>

          {!stats ? (
            <div className="flex flex-col items-center justify-center p-12 border border-[var(--color-border)] border-dashed rounded-xl bg-[var(--color-surface)]">
              <span className="text-4xl mb-4 opacity-50">📊</span>
              <h2 className="text-[15px] font-semibold text-[var(--color-text)] mb-2">No analytics data yet</h2>
              <p className="text-[var(--color-text-muted)] text-[13px]">Run the pipeline a few times to generate performance metrics and block rates.</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Runs', val: stats.totalRuns },
                  { label: 'Passed', val: stats.totalPassed, textClass: 'text-green-400' },
                  { label: 'Blocked', val: stats.totalBlocked, textClass: 'text-red-400' },
                  { label: 'Avg Latency', val: `${Math.round(stats.avgLatency)}ms` },
                ].map((k) => (
                  <div key={k.label} className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-1 shadow-sm">
                    <span className="text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{k.label}</span>
                    <span className={`text-3xl font-bold font-sans ${k.textClass || 'text-[var(--color-text)]'}`}>{k.val}</span>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-6 h-[300px]">
                {/* Result Distribution (Pass vs Block) */}
                <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
                  <h3 className="text-[14px] font-semibold mb-4 text-[var(--color-text)]">Result Distribution</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Passed', value: stats.totalPassed, color: '#4ade80' },
                            { name: 'Blocked', value: stats.totalBlocked, color: '#f87171' }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {
                            [{ color: '#4ade80' }, { color: '#f87171' }].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Common Triggers */}
                <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
                  <h3 className="text-[14px] font-semibold mb-4 text-[var(--color-text)]">Common Fail Triggers</h3>
                  <div className="flex-1 min-h-0">
                    {stats.blockReasonsChart.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[var(--color-text-muted)] italic">
                        No blocks recorded yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.blockReasonsChart} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                          <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }} />
                          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Latency Over Time */}
              <div className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col h-[280px]">
                <h3 className="text-[14px] font-semibold mb-4 text-[var(--color-text)]">End-to-End Latency Trend</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.latencyTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="index" tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={30} />
                      <YAxis tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}ms`} />
                      <Tooltip 
                        cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} 
                        contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                        labelFormatter={() => ''}
                      />
                      <Line type="monotone" dataKey="latency" stroke="#a5b4fc" strokeWidth={2} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#8b5cf6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
