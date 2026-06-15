import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, BookOpen, Clock, CheckCircle2, Lock, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'
import { subjectsApi, curriculumApi } from '../services/api'

interface Lesson {
  id: number
  title: string
  ca_standard: string
  estimated_minutes: number
  order_index: number
  is_published: boolean
}

interface Unit {
  id: number
  subject_id: number
  title: string
  ca_domain: string
  description: string
  order_index: number
  is_published: boolean
  lessons: Lesson[]
}

interface Subject {
  id: number
  name: string
  description: string
  color: string
  is_active: boolean
}

interface LessonProgress {
  lesson_id: number
  status: string
}

function fromSlug(slug: string) {
  return slug.replace(/-/g, ' ')
}

export default function CurriculumPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const navigate = useNavigate()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [progress, setProgress] = useState<Record<number, string>>({})
  const [openUnit, setOpenUnit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const slugName = fromSlug(subjectSlug ?? '')

    Promise.all([subjectsApi.list(), curriculumApi.getMyProgress()])
      .then(async ([subjectsRes, progressRes]) => {
        const matched: Subject = subjectsRes.data.find(
          (s: Subject) => s.name.toLowerCase() === slugName
        )
        if (!matched) { navigate('/learn'); return }

        setSubject(matched)

        const unitsRes = await curriculumApi.listUnits(matched.id)
        setUnits(unitsRes.data)
        if (unitsRes.data.length > 0) setOpenUnit(unitsRes.data[0].id)

        const map: Record<number, string> = {}
        ;(progressRes.data as LessonProgress[]).forEach((p) => {
          map[p.lesson_id] = p.status
        })
        setProgress(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [subjectSlug, navigate])

  const totalLessons = units.reduce((n, u) => n + u.lessons.length, 0)
  const publishedLessons = units.reduce((n, u) => n + u.lessons.filter((l) => l.is_published).length, 0)
  const completedCount = units
    .flatMap((u) => u.lessons)
    .filter((l) => progress[l.id] === 'completed').length

  const statusIcon = (lesson: Lesson) => {
    const s = progress[lesson.id]
    if (s === 'completed') return <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
    if (!lesson.is_published) return <Lock size={16} className="text-gray-600 flex-shrink-0" />
    return <div className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/learn')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        All Subjects
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{subject?.name}</h1>
        <p className="text-gray-400 mt-1">California Common Core Standards</p>
      </div>

      {/* Progress bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-300">Overall Progress</p>
          <p className="text-sm text-gray-400">
            {completedCount} / {publishedLessons} lessons complete
          </p>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: publishedLessons > 0 ? `${(completedCount / publishedLessons) * 100}%` : '0%',
              backgroundColor: subject?.color ?? '#6366f1',
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {publishedLessons} of {totalLessons} lessons available · {totalLessons - publishedLessons} coming soon
        </p>
      </div>

      {/* Units */}
      <div className="space-y-3">
        {units.map((unit) => {
          const isOpen = openUnit === unit.id
          const unitCompleted = unit.lessons.filter((l) => progress[l.id] === 'completed').length
          const unitPublished = unit.lessons.filter((l) => l.is_published).length

          return (
            <div key={unit.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setOpenUnit(isOpen ? null : unit.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: (subject?.color ?? '#6366f1') + '20' }}>
                  <BookOpen size={18} style={{ color: subject?.color ?? '#6366f1' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded">
                      {unit.ca_domain}
                    </span>
                    {unitPublished > 0 && (
                      <span className="text-xs text-gray-500">{unitCompleted}/{unitPublished} done</span>
                    )}
                  </div>
                  <p className="font-semibold text-white">
                    Unit {unit.order_index} — {unit.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{unit.description}</p>
                </div>
                {isOpen
                  ? <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />
                  : <ChevronRight size={18} className="text-gray-500 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-800">
                  {unit.lessons.map((lesson, i) => {
                    const clickable = lesson.is_published
                    return (
                      <button
                        key={lesson.id}
                        disabled={!clickable}
                        onClick={() => clickable && navigate(`/learn/${subjectSlug}/lessons/${lesson.id}`)}
                        className={clsx(
                          'w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors',
                          i < unit.lessons.length - 1 && 'border-b border-gray-800/60',
                          clickable ? 'hover:bg-gray-800/40 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {statusIcon(lesson)}
                        <div className="flex-1 min-w-0">
                          <p className={clsx('text-sm font-medium', clickable ? 'text-white' : 'text-gray-400')}>
                            {unit.order_index}.{lesson.order_index} {lesson.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{lesson.ca_standard}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                          <Clock size={12} />
                          <span>{lesson.estimated_minutes}m</span>
                        </div>
                        {clickable && <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
