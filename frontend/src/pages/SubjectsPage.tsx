import { useEffect, useState } from 'react'
import { ChevronRight, Plus, Loader2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { subjectsApi } from '../services/api'
import clsx from 'clsx'

interface LearningPath {
  id: number
  title: string
  description: string
  difficulty: string
  estimated_hours: number
  steps: Array<{ id: number; title: string; step_type: string; order_index: number }>
}

interface Subject {
  id: number
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
  learning_paths: LearningPath[]
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selected, setSelected] = useState<Subject | null>(null)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('beginner')

  useEffect(() => {
    subjectsApi.list().then((r) => setSubjects(r.data)).catch(() => {})
  }, [])

  const generatePath = async () => {
    if (!selected || !topic.trim()) return
    setGenerating(true)
    try {
      const res = await subjectsApi.createLearningPath(selected.id, topic, difficulty)
      setSelected((prev) => prev ? { ...prev, learning_paths: [...prev.learning_paths, res.data] } : prev)
      setSubjects((prev) => prev.map((s) =>
        s.id === selected.id ? { ...s, learning_paths: [...s.learning_paths, res.data] } : s
      ))
      setTopic('')
      toast.success('Learning path created!')
    } catch {
      toast.error('Failed to generate learning path')
    } finally {
      setGenerating(false)
    }
  }

  const difficultyColor = (d: string) =>
    d === 'beginner' ? 'text-emerald-400 bg-emerald-400/10' :
    d === 'intermediate' ? 'text-amber-400 bg-amber-400/10' :
    'text-red-400 bg-red-400/10'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Subjects & Learning Paths</h1>
        <p className="text-gray-400 mt-1">Explore subjects and generate AI-powered learning paths</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => s.is_active && setSelected(s)}
              disabled={!s.is_active}
              className={clsx(
                'w-full card text-left transition-colors flex items-center gap-4',
                s.is_active
                  ? 'hover:border-indigo-600 cursor-pointer'
                  : 'opacity-40 cursor-not-allowed',
                selected?.id === s.id && 'border-indigo-600'
              )}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + '20' }}>
                <BookOpen size={18} style={{ color: s.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{s.name}</p>
                <p className="text-xs text-gray-400 truncate">{s.description}</p>
              </div>
              {s.is_active
                ? <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                : <span className="text-xs text-gray-500 flex-shrink-0">Coming soon</span>
              }
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div className="card">
                <h2 className="font-semibold text-white mb-4">Generate Learning Path for {selected.name}</h2>
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder={`e.g. Introduction to ${selected.name}`}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <div className="flex gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                          difficulty === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <button onClick={generatePath} disabled={!topic.trim() || generating} className="btn-primary flex items-center gap-2">
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {generating ? 'Generating...' : 'Generate Path'}
                  </button>
                </div>
              </div>

              {selected.learning_paths.length > 0 ? (
                selected.learning_paths.map((path) => (
                  <div key={path.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{path.title}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{path.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <span className={clsx('text-xs px-2 py-1 rounded-full font-medium capitalize', difficultyColor(path.difficulty))}>
                          {path.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">{path.estimated_hours}h</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {path.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-gray-700 text-xs flex items-center justify-center text-gray-400 flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-300">{step.title}</p>
                          <span className="ml-auto text-xs text-gray-500 capitalize">{step.step_type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-12">
                  <p className="text-gray-400">No learning paths yet. Generate one above!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center py-20 text-center">
              <div>
                <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Select a subject to view and generate learning paths</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
