import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Clock, CheckCircle2, BookOpen, GraduationCap, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { curriculumApi } from '../services/api'

interface Lesson {
  id: number
  unit_id: number
  title: string
  ca_standard: string
  content: string
  estimated_minutes: number
  order_index: number
  is_published: boolean
}

export default function LessonPage() {
  const { lessonId, subjectSlug } = useParams<{ lessonId: string; subjectSlug: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [status, setStatus] = useState<string>('not_started')
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (!lessonId) return
    const id = Number(lessonId)

    Promise.all([curriculumApi.getLesson(id), curriculumApi.getMyProgress()])
      .then(([lessonRes, progressRes]) => {
        setLesson(lessonRes.data)
        const record = progressRes.data.find((p: { lesson_id: number; status: string }) => p.lesson_id === id)
        if (record) setStatus(record.status)
        else {
          // auto-mark in_progress on open
          curriculumApi.updateProgress(id, 'in_progress').catch(() => {})
          setStatus('in_progress')
        }
      })
      .catch(() => toast.error('Failed to load lesson'))
      .finally(() => setLoading(false))
  }, [lessonId])

  const markComplete = async () => {
    if (!lesson || status === 'completed') return
    setMarking(true)
    try {
      await curriculumApi.updateProgress(lesson.id, 'completed')
      setStatus('completed')
      toast.success('Lesson marked as complete!')
    } catch {
      toast.error('Failed to update progress')
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading lesson...
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Lesson not found.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/learn/${subjectSlug}`)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Curriculum
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}/classroom`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-950 border border-indigo-700 text-indigo-300 hover:bg-indigo-900 transition-colors"
            >
              <GraduationCap size={16} />
              Enter Classroom
            </button>

            <button
              onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}/practice`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-950 border border-amber-700 text-amber-300 hover:bg-amber-900 transition-colors"
            >
              <ClipboardList size={16} />
              Practice Test
            </button>

            <button
              onClick={markComplete}
              disabled={status === 'completed' || marking}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                status === 'completed'
                  ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                  : 'btn-primary'
              )}
            >
              <CheckCircle2 size={16} />
              {status === 'completed' ? 'Completed' : marking ? 'Saving...' : 'Mark Complete'}
            </button>
          </div>
        </div>

        {/* Lesson header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono text-indigo-400 bg-indigo-900/40 px-2 py-1 rounded">
              {lesson.ca_standard}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} />
              {lesson.estimated_minutes} min
            </span>
            {status === 'in_progress' && (
              <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">
                In Progress
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
        </div>

        {/* Markdown content */}
        <div className="prose-lesson">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {lesson.content}
          </ReactMarkdown>
        </div>

        {/* Bottom action bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/learn/${subjectSlug}`)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <BookOpen size={16} />
              Back to all lessons
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}/classroom`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-950 border border-indigo-700 text-indigo-300 hover:bg-indigo-900 transition-colors"
              >
                <GraduationCap size={15} />
                Classroom Mode
              </button>
              <button
                onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}/practice`)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
              >
                <ClipboardList size={15} />
                Take Practice Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
