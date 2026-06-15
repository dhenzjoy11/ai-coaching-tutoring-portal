import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, Code, FlaskConical, BookText, Briefcase, BookOpen, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { subjectsApi, curriculumApi } from '../services/api'

interface Subject {
  id: number
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

interface Unit {
  id: number
  subject_id: number
  lessons: { id: number; is_published: boolean }[]
}

interface LessonProgress {
  lesson_id: number
  status: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  calculator: Calculator,
  code: Code,
  flask: FlaskConical,
  book: BookText,
  briefcase: Briefcase,
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export default function SubjectHubPage() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [progress, setProgress] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      subjectsApi.list(),
      curriculumApi.listUnits(),
      curriculumApi.getMyProgress(),
    ])
      .then(([subRes, unitsRes, progressRes]) => {
        setSubjects(subRes.data)
        setUnits(unitsRes.data)
        const map: Record<number, string> = {}
        ;(progressRes.data as LessonProgress[]).forEach((p) => {
          map[p.lesson_id] = p.status
        })
        setProgress(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function getSubjectStats(subjectId: number) {
    const subjectUnits = units.filter((u) => u.subject_id === subjectId)
    const allLessons = subjectUnits.flatMap((u) => u.lessons)
    const published = allLessons.filter((l) => l.is_published)
    const completed = published.filter((l) => progress[l.id] === 'completed')
    return { total: allLessons.length, published: published.length, completed: completed.length }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading subjects...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Learning</h1>
        <p className="text-gray-400 mt-1">Choose a subject to continue studying</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subjects.map((subject) => {
          const Icon = ICON_MAP[subject.icon] ?? BookOpen
          const { total, published, completed } = getSubjectStats(subject.id)
          const pct = published > 0 ? Math.round((completed / published) * 100) : 0
          const slug = toSlug(subject.name)

          return (
            <button
              key={subject.id}
              disabled={!subject.is_active}
              onClick={() => subject.is_active && navigate(`/learn/${slug}`)}
              className={clsx(
                'card text-left transition-all duration-200 group',
                subject.is_active
                  ? 'hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-950/40 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: subject.color + '20' }}
                >
                  <Icon size={22} style={{ color: subject.color }} />
                </div>
                {subject.is_active ? (
                  <ChevronRight
                    size={18}
                    className="text-gray-600 group-hover:text-indigo-400 transition-colors mt-1"
                  />
                ) : (
                  <span className="text-xs bg-gray-800 text-gray-500 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>

              {/* Title + description */}
              <h2 className="font-semibold text-white text-base mb-1">{subject.name}</h2>
              <p className="text-xs text-gray-400 mb-5">{subject.description}</p>

              {/* Progress */}
              {subject.is_active && total > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{completed} of {published} lessons complete</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    {total - published} lessons coming soon
                  </p>
                </div>
              )}

              {subject.is_active && total === 0 && (
                <p className="text-xs text-gray-500">No lessons yet</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
