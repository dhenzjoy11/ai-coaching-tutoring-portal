import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Brain, BookOpen, Clock, TrendingUp, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { progressApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface DashboardStats {
  total_sessions: number
  total_study_minutes: number
  quizzes_completed: number
  average_quiz_score: number
  subjects_active: number
  streak_days: number
  recent_activities: Array<{ id: number; activity_type: string; subject: string; duration_minutes: number; score: number | null; created_at: string }>
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    progressApi.dashboard().then((r) => setStats(r.data)).catch(() => {})
  }, [])

  const statCards = [
    { label: 'Chat Sessions', value: stats?.total_sessions ?? 0, icon: MessageSquare, color: 'text-indigo-400' },
    { label: 'Study Minutes', value: Math.round(stats?.total_study_minutes ?? 0), icon: Clock, color: 'text-emerald-400' },
    { label: 'Quizzes Done', value: stats?.quizzes_completed ?? 0, icon: Brain, color: 'text-amber-400' },
    { label: 'Avg Quiz Score', value: `${Math.round(stats?.average_quiz_score ?? 0)}%`, icon: TrendingUp, color: 'text-rose-400' },
    { label: 'Subjects Active', value: stats?.subjects_active ?? 0, icon: BookOpen, color: 'text-cyan-400' },
    { label: 'Day Streak', value: stats?.streak_days ?? 0, icon: Zap, color: 'text-yellow-400' },
  ]

  const chartData = (stats?.recent_activities ?? []).slice(0, 7).map((a) => ({
    name: a.subject,
    minutes: Math.round(a.duration_minutes),
  }))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.full_name || user?.username}
        </h1>
        <p className="text-gray-400 mt-1">Here's your learning overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-3 mb-2">
              <Icon size={18} className={color} />
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Recent Activity</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No activity yet. Start learning!</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/chat" className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <MessageSquare size={18} className="text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-white">Start AI Tutoring Session</p>
                <p className="text-xs text-gray-400">Chat with your AI tutor</p>
              </div>
            </Link>
            <Link to="/quiz" className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <Brain size={18} className="text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">Take a Quiz</p>
                <p className="text-xs text-gray-400">Test your knowledge</p>
              </div>
            </Link>
            <Link to="/subjects" className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <BookOpen size={18} className="text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">Explore Subjects</p>
                <p className="text-xs text-gray-400">Browse learning paths</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
