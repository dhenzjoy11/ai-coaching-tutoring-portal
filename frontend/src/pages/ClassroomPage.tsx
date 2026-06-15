import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward,
  Loader2, AlertCircle, Maximize2, CheckCircle2,
  BookOpen,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { curriculumApi } from '../services/api'
import { useClassroom } from '../hooks/useClassroom'
import { useWorkedExamples } from '../hooks/useWorkedExamples'
import TeacherAvatar from '../components/classroom/TeacherAvatar'
import WorkedExamplesBoard from '../components/classroom/WorkedExamplesBoard'

interface Lesson {
  id: number
  title: string
  ca_standard: string
  content: string
  estimated_minutes: number
}

export default function ClassroomPage() {
  const { lessonId, subjectSlug } = useParams<{ lessonId: string; subjectSlug: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [lessonStatus, setLessonStatus] = useState('not_started')
  const [fetchingLesson, setFetchingLesson] = useState(true)

  // ── Main classroom hook (section-level navigation) ─────────────────────────
  const {
    steps, currentStep, speaking: classroomSpeaking, loading: classroomLoading,
    error: classroomError, play, pause, next, prev, goToStep, isFirst, isLast,
  } = useClassroom({ lessonContent: lesson?.content ?? '' })

  const step = steps[currentStep]

  // Detect whether the current step is the "Worked Examples" section
  const isWorkedExamplesStep = step?.title?.toLowerCase().includes('worked example')
  const workedExamplesContent = isWorkedExamplesStep ? step.content : null

  // ── Worked examples hook (sub-step navigation) ─────────────────────────────
  const {
    examples, currentExample, currentExampleIndex, revealedCount,
    speaking: exSpeaking, loading: exLoading, error: exError,
    nextSubStep, prevSubStep, speakCurrent,
    jumpToExample, isLastSubStep, isFirstSubStep,
    totalSubSteps, completedSubSteps,
  } = useWorkedExamples(workedExamplesContent)

  // Auto-speak the problem when we arrive at the Worked Examples step
  useEffect(() => {
    if (isWorkedExamplesStep && examples.length > 0) {
      const intro = examples[0]?.subSteps[0]?.narration
      if (intro) {
        // Brief delay so the whiteboard renders first
        const t = setTimeout(() => speakCurrent(), 600)
        return () => clearTimeout(t)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkedExamplesStep, examples.length > 0])

  // Compose active state based on which mode we're in
  const activeSpeaking = isWorkedExamplesStep ? exSpeaking : classroomSpeaking
  const activeLoading  = isWorkedExamplesStep ? exLoading  : classroomLoading
  const activeError    = isWorkedExamplesStep ? exError    : classroomError

  // Navigation handlers that work across both modes
  const handlePrev = () => {
    if (isWorkedExamplesStep && !isFirstSubStep) prevSubStep()
    else prev()
  }
  const handleNext = () => {
    if (isWorkedExamplesStep && !isLastSubStep) nextSubStep()
    else next()
  }
  const handlePlay = () => {
    if (activeSpeaking) pause()
    else if (isWorkedExamplesStep) speakCurrent()
    else play()
  }

  const prevDisabled = isWorkedExamplesStep ? (isFirstSubStep && isFirst) : isFirst
  const nextDisabled = isWorkedExamplesStep ? (isLastSubStep && isLast) : isLast

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId) return
    Promise.all([
      curriculumApi.getLesson(Number(lessonId)),
      curriculumApi.getMyProgress(),
    ]).then(([lessonRes, progressRes]) => {
      setLesson(lessonRes.data)
      const record = progressRes.data.find(
        (p: { lesson_id: number; status: string }) => p.lesson_id === Number(lessonId)
      )
      if (record) setLessonStatus(record.status)
      else {
        curriculumApi.updateProgress(Number(lessonId), 'in_progress').catch(() => {})
        setLessonStatus('in_progress')
      }
    }).catch(() => toast.error('Failed to load lesson'))
      .finally(() => setFetchingLesson(false))
  }, [lessonId])

  const markComplete = async () => {
    if (!lesson || lessonStatus === 'completed') return
    try {
      await curriculumApi.updateProgress(lesson.id, 'completed')
      setLessonStatus('completed')
      toast.success('Lesson complete!')
    } catch {
      toast.error('Failed to save progress')
    }
  }

  if (fetchingLesson) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading classroom…
      </div>
    )
  }

  if (!lesson || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No content available.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <button
          onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Exit Classroom
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {lesson.ca_standard} · {lesson.estimated_minutes} min
          </span>
          <h1 className="text-sm font-semibold text-white hidden sm:block">{lesson.title}</h1>
        </div>

        <button
          onClick={markComplete}
          disabled={lessonStatus === 'completed'}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            lessonStatus === 'completed'
              ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
              : 'btn-primary'
          )}
        >
          <CheckCircle2 size={14} />
          {lessonStatus === 'completed' ? 'Completed' : 'Mark Complete'}
        </button>
      </div>

      {/* ── Classroom body ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Whiteboard (left) */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">

          {/* Whiteboard header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-gray-500 font-mono">
                {isWorkedExamplesStep ? 'worked examples — interactive' : 'whiteboard'}
              </span>
              {isWorkedExamplesStep && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-400 text-xs font-medium">
                  interactive
                </span>
              )}
            </div>
            <Maximize2 size={14} className="text-gray-600" />
          </div>

          {/* Whiteboard content — switches between interactive and regular */}
          {isWorkedExamplesStep && examples.length > 0 ? (
            <WorkedExamplesBoard
              examples={examples}
              currentExampleIndex={currentExampleIndex}
              revealedCount={revealedCount}
              speaking={exSpeaking}
              loading={exLoading}
              onNextSubStep={nextSubStep}
              onJumpToExample={jumpToExample}
              isLastSubStep={isLastSubStep}
            />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-8 bg-gray-950">
                <div className="border-b-2 border-dashed border-gray-700/60 mb-6 pb-2">
                  <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">
                    {step?.title}
                  </span>
                </div>
                <div className="prose-lesson max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {step?.content ?? ''}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Step dots navigation */}
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-800 bg-gray-900/40 flex-shrink-0">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className={clsx(
                      'rounded-full transition-all duration-200',
                      i === currentStep
                        ? 'w-6 h-2 bg-indigo-500'
                        : 'w-2 h-2 bg-gray-700 hover:bg-gray-500'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Teacher panel (right) ────────────────────────── */}
        <div className="w-72 flex-shrink-0 flex flex-col items-center justify-between py-8 px-6 bg-gray-900">

          {/* Avatar + status */}
          <div className="flex flex-col items-center flex-1 justify-center">
            <TeacherAvatar speaking={activeSpeaking} />

            {/* Status */}
            <div className="mt-6 text-center">
              {activeLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400">
                  <Loader2 size={12} className="animate-spin" />
                  Preparing narration…
                </div>
              )}
              {!activeLoading && activeSpeaking && (
                <p className="text-xs text-indigo-300 animate-pulse">Speaking…</p>
              )}
              {!activeLoading && !activeSpeaking && (
                <p className="text-xs text-gray-500">
                  {isWorkedExamplesStep ? 'Click "Show Next Step" to continue' : 'Press play to listen'}
                </p>
              )}
              {activeError && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertCircle size={12} />
                  {activeError}
                </div>
              )}
            </div>

            {/* Position label */}
            <div className="mt-4 text-center">
              {isWorkedExamplesStep && currentExample ? (
                <>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <BookOpen size={12} className="text-indigo-400" />
                    <p className="text-xs text-indigo-400 font-medium">Interactive Examples</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Example {currentExampleIndex + 1} of {examples.length}
                  </p>
                  <p className="text-xs text-gray-500">
                    Sub-step {completedSubSteps} of {totalSubSteps}
                  </p>
                  <p className="text-sm font-medium text-gray-300 mt-1 truncate max-w-[180px]">
                    {currentExample.title.replace(/^Example \d+\s*[—–]\s*/, '')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    Section {currentStep + 1} of {steps.length}
                  </p>
                  <p className="text-sm font-medium text-gray-300 mt-0.5">{step?.title}</p>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="w-full space-y-3">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePrev}
                disabled={prevDisabled}
                className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={isWorkedExamplesStep ? 'Previous step' : 'Previous section'}
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={handlePlay}
                disabled={activeLoading}
                className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/40"
              >
                {activeLoading
                  ? <Loader2 size={22} className="animate-spin" />
                  : activeSpeaking
                    ? <Pause size={22} />
                    : <Play size={22} />
                }
              </button>

              <button
                onClick={handleNext}
                disabled={nextDisabled}
                className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={isWorkedExamplesStep ? 'Next step' : 'Next section'}
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Section dots when not in interactive mode */}
            {!isWorkedExamplesStep && (
              <div className="flex items-center justify-center gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    className={clsx(
                      'rounded-full transition-all duration-200',
                      i === currentStep
                        ? 'w-4 h-1.5 bg-indigo-500'
                        : 'w-1.5 h-1.5 bg-gray-700 hover:bg-gray-600'
                    )}
                  />
                ))}
              </div>
            )}

            <p className="text-center text-xs text-gray-600">
              {isWorkedExamplesStep
                ? 'Steps reveal one at a time'
                : 'Tip: narration advances automatically'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
