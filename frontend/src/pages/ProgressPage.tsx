import { useEffect, useState } from 'react'
import { Clock, Brain, MessageSquare, BookOpen } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { progressApi } from '../services/api'
import { format } from 'date-fns'

interface Activity {
  id: number
  activity_type: string
  subject: string
  duration_minutes: number
  score: number | null
  created_at: string
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const typeIcon = (type: string) => {
  if (type === 'chat') return <MessageSquare size={14} className="text-indigo-400" />
  if (type === 'quiz') return <Brain size={14} className="text-amber-400" />
  return <BookOpen size={14} className="text-emerald-400" />
}

export default function ProgressPage() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    progressApi.activities().then((r) => setActivities(r.data)).catch(() => {})
  }, [])

  const subjectMap: Record<string, number> = {}
  activities.forEach((a) => {
    subjectMap[a.subject] = (subjectMap[a.subject] || 0) + a.duration_minutes
  })
  const pieData = Object.entries(subjectMap).map(([name, value]) => ({ name, value: Math.round(value) }))

  const lineData = activities.slice(0, 14).reverse().map((a) => ({
    date: format(new Date(a.created_at), 'MMM d'),
    minutes: Math.round(a.duration_minutes),
    score: a.score ?? undefined,
  }))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Progress Tracker</h1>
        <p className="text-gray-400 mt-1">Track your learning journey over time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Study Time (last 14 activities)</h2>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={false} name="Minutes" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No activity data yet</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">Time by Subject</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-300">{d.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{d.value}m</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No activity data yet</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-white mb-4">Recent Activities</h2>
        {activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  {typeIcon(a.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white capitalize">{a.activity_type} — {a.subject}</p>
                  <p className="text-xs text-gray-400">{format(new Date(a.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {Math.round(a.duration_minutes)}m
                  </div>
                  {a.score !== null && (
                    <p className="text-xs text-indigo-400 mt-0.5">{Math.round(a.score)}%</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No activities recorded yet. Start learning!</p>
        )}
      </div>
    </div>
  )
}
