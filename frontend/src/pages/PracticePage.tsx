import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Trophy, RotateCcw, Shuffle, CheckCircle2,
  XCircle, Loader2, AlertCircle, BookOpen, ClipboardList,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { practiceApi, curriculumApi } from '../services/api'
import PracticeQuestion, { type ProblemData } from '../components/practice/PracticeQuestion'

interface PracticeSet {
  lesson_id: number
  lesson_title: string
  ca_standard: string
  problems: ProblemData[]
  passing_score: number
}

interface AnswerRecord {
  questionId: number
  correct: boolean
  userAnswer: string
}

type Phase = 'loading' | 'error' | 'taking' | 'results'

export default function PracticePage() {
  const { lessonId, subjectSlug } = useParams<{ lessonId: string; subjectSlug: string }>()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('loading')
  const [practiceSet, setPracticeSet] = useState<PracticeSet | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [fetchingNew, setFetchingNew] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Next-lesson navigation
  const [nextLesson, setNextLesson] = useState<{ id: number; title: string } | null>(null)

  const load = useCallback(async (fn: () => Promise<{ data: PracticeSet }>) => {
    setPhase('loading')
    setAnswers([])
    setCurrentIndex(0)
    try {
      const res = await fn()
      setPracticeSet(res.data)
      setPhase('taking')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErrorMsg(detail ?? 'Failed to load practice problems')
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    if (!lessonId) return
    load(() => practiceApi.getProblems(Number(lessonId)))
  }, [lessonId, load])

  // Fetch next lesson once we have the practice set
  useEffect(() => {
    if (!practiceSet) return
    curriculumApi.getLesson(practiceSet.lesson_id)
      .then((res) => {
        const unitId: number = res.data.unit_id
        const orderIndex: number = res.data.order_index
        return curriculumApi.listUnits()
          .then((unitsRes) => {
            const units = unitsRes.data
            for (const unit of units) {
              for (const lesson of unit.lessons ?? []) {
                if (lesson.order_index === orderIndex + 1 && unit.id === unitId) {
                  setNextLesson({ id: lesson.id, title: lesson.title })
                  return
                }
              }
            }
            // Check next unit first lesson
            const currentUnit = units.find((u: { id: number }) => u.id === unitId)
            const nextUnit = units.find((u: { order_index: number }) => u.order_index === (currentUnit?.order_index ?? 0) + 1)
            const firstNext = nextUnit?.lessons?.[0]
            if (firstNext) setNextLesson({ id: firstNext.id, title: firstNext.title })
          })
      })
      .catch(() => {})
  }, [practiceSet])

  const handleAnswer = (correct: boolean, userAnswer: string) => {
    if (!practiceSet) return
    const problem = practiceSet.problems[currentIndex]
    const newAnswers = [...answers, { questionId: problem.id, correct, userAnswer }]
    setAnswers(newAnswers)

    if (currentIndex < practiceSet.problems.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Test complete — calculate score and record
      const correctCount = newAnswers.filter((a) => a.correct).length
      const score = correctCount / practiceSet.problems.length
      const passed = score >= practiceSet.passing_score

      if (passed) {
        curriculumApi.updateProgress(Number(lessonId), 'completed', score)
          .then(() => toast.success('Lesson marked as complete!'))
          .catch(() => {})
      }
      setPhase('results')
    }
  }

  const handleNewSet = async () => {
    setFetchingNew(true)
    const seenIds = practiceSet?.problems.map((p) => p.id) ?? []
    try {
      await load(() => practiceApi.newSet(Number(lessonId), seenIds))
    } finally {
      setFetchingNew(false)
    }
  }

  // ── Derived state ────────────────────────────────────────────────
  const correctCount = answers.filter((a) => a.correct).length
  const totalQuestions = practiceSet?.problems.length ?? 0
  const scorePercent = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0
  const passed = practiceSet ? (correctCount / totalQuestions) >= practiceSet.passing_score : false
  const passingPct = practiceSet ? Math.round(practiceSet.passing_score * 100) : 95

  // ── Loading ──────────────────────────────────────────────────────
  if (phase === 'loading' || fetchingNew) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
        <p className="text-sm">{fetchingNew ? 'Picking a new set of questions…' : 'Loading practice test…'}</p>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-gray-400 text-sm">{errorMsg}</p>
        <button
          onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}`)}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={14} /> Back to Lesson
        </button>
      </div>
    )
  }

  // ── Results screen ───────────────────────────────────────────────
  if (phase === 'results' && practiceSet) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="text-center mb-10">
            {passed ? (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-900/40 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={36} className="text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Excellent Work!</h1>
                <p className="text-gray-400">You passed with {Math.round(scorePercent)}% — lesson complete!</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-900/30 border-2 border-amber-600 flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={36} className="text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Not Quite Yet</h1>
                <p className="text-gray-400">
                  You scored {Math.round(scorePercent)}% — you need {passingPct}% to pass.
                </p>
              </>
            )}
          </div>

          {/* Score card */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-200">Your Results</h2>
              <span className="text-xs text-gray-500 font-mono">{practiceSet.ca_standard}</span>
            </div>

            {/* Score ring */}
            <div className="flex items-center gap-6 mb-6">
              <div className={clsx(
                'w-24 h-24 rounded-full flex flex-col items-center justify-center border-4',
                passed ? 'border-emerald-500 bg-emerald-950/30' : 'border-amber-500 bg-amber-950/20'
              )}>
                <span className={clsx('text-2xl font-bold', passed ? 'text-emerald-300' : 'text-amber-300')}>
                  {Math.round(scorePercent)}%
                </span>
                <span className="text-xs text-gray-500 mt-0.5">score</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Correct answers</span>
                  <span className="text-emerald-400 font-semibold">{correctCount} / {totalQuestions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Passing threshold</span>
                  <span className="text-gray-300">{passingPct}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Question bank</span>
                  <span className="text-gray-300">50 questions · 12 per set</span>
                </div>
              </div>
            </div>

            {/* Per-question breakdown */}
            <div className="space-y-2">
              {answers.map((ans, i) => (
                <div
                  key={ans.questionId}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                    ans.correct ? 'bg-emerald-950/20' : 'bg-red-950/20'
                  )}
                >
                  {ans.correct
                    ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    : <XCircle size={14} className="text-red-400 flex-shrink-0" />
                  }
                  <span className="text-gray-400">Question {i + 1}</span>
                  <span className={clsx('ml-auto text-xs font-mono', ans.correct ? 'text-emerald-400' : 'text-red-400')}>
                    {ans.correct ? 'Correct' : `Your answer: ${ans.userAnswer.slice(0, 30)}${ans.userAnswer.length > 30 ? '…' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {passed ? (
            <div className="space-y-3">
              {nextLesson && (
                <button
                  onClick={() => navigate(`/learn/${subjectSlug}/lessons/${nextLesson.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  <BookOpen size={18} />
                  Next Lesson: {nextLesson.title}
                </button>
              )}
              <button
                onClick={() => navigate(`/learn/${subjectSlug}`)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition-colors"
              >
                <ClipboardList size={16} />
                Back to Curriculum
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-400">You didn't reach the passing score. What would you like to do?</p>
              </div>
              <button
                onClick={handleNewSet}
                disabled={fetchingNew}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                <Shuffle size={18} />
                Try a Different Set of Questions
              </button>
              <button
                onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}/classroom`)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-sm transition-colors"
              >
                <RotateCcw size={16} />
                Repeat the Lesson in Classroom Mode
              </button>
              <button
                onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}`)}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Lesson
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Taking the test ──────────────────────────────────────────────
  if (!practiceSet) return null
  const problem = practiceSet.problems[currentIndex]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col min-h-full">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/learn/${subjectSlug}/lessons/${lessonId}`)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Exit Test
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold text-white">{practiceSet.lesson_title}</p>
            <p className="text-xs text-gray-500">{practiceSet.ca_standard}</p>
          </div>

          <span className="text-xs text-gray-500">
            Pass: {passingPct}%
          </span>
        </div>

        {/* Question card */}
        <div className="flex-1 card">
          <PracticeQuestion
            key={`${currentIndex}-${problem.id}`}
            problem={problem}
            questionNumber={currentIndex + 1}
            totalQuestions={practiceSet.problems.length}
            onAnswer={handleAnswer}
          />
        </div>
      </div>
    </div>
  )
}
