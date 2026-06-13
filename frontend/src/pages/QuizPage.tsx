import { useState } from 'react'
import { Brain, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { quizApi } from '../services/api'
import clsx from 'clsx'

const SUBJECTS = ['Mathematics', 'Science', 'Programming', 'History', 'Language Arts', 'Business']
const DIFFICULTIES = ['easy', 'medium', 'hard']

interface Question {
  id: number
  question_text: string
  question_type: string
  options: string[] | null
  order_index: number
}

interface Quiz {
  id: number
  subject: string
  topic: string
  difficulty: string
  questions: Question[]
}

interface Feedback {
  question_id: number
  question_text: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  explanation: string
}

interface AttemptResult {
  score: number
  total_questions: number
  correct_answers: number
  feedback: Feedback[]
}

type Stage = 'setup' | 'quiz' | 'results'

export default function QuizPage() {
  const [stage, setStage] = useState<Stage>('setup')
  const [subject, setSubject] = useState('Mathematics')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(5)
  const [loading, setLoading] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)

  const generateQuiz = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return }
    setLoading(true)
    try {
      const res = await quizApi.generate(subject, topic, difficulty, numQuestions)
      setQuiz(res.data)
      setAnswers({})
      setStage('quiz')
    } catch {
      toast.error('Failed to generate quiz')
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async () => {
    if (!quiz) return
    const unanswered = quiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${unanswered.length} remaining questions`)
      return
    }
    setSubmitting(true)
    try {
      const stringAnswers: Record<string, string> = {}
      Object.entries(answers).forEach(([k, v]) => { stringAnswers[k] = v })
      const res = await quizApi.submit(quiz.id, stringAnswers)
      setResult(res.data)
      setStage('results')
    } catch {
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === 'setup') {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Quiz Generator</h1>
          <p className="text-gray-400 mt-1">Generate AI-powered quizzes on any topic</p>
        </div>
        <div className="card space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Subject</label>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Topic</label>
            <input className="input" placeholder="e.g. Quadratic equations" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors',
                    difficulty === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Number of Questions: {numQuestions}</label>
            <input type="range" min={3} max={10} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>
          <button onClick={generateQuiz} disabled={loading || !topic.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            {loading ? 'Generating quiz...' : 'Generate Quiz'}
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'quiz' && quiz) {
    const answeredCount = Object.keys(answers).length
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">{quiz.topic}</h1>
            <p className="text-sm text-gray-400">{quiz.subject} · {quiz.difficulty} · {quiz.questions.length} questions</p>
          </div>
          <span className="text-sm text-gray-400">{answeredCount}/{quiz.questions.length} answered</span>
        </div>

        <div className="space-y-5">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="card">
              <p className="font-medium text-white mb-4"><span className="text-indigo-400 mr-2">Q{i + 1}.</span>{q.question_text}</p>
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      className={clsx(
                        'w-full text-left px-4 py-3 rounded-lg text-sm transition-colors',
                        answers[q.id] === opt ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className="input"
                  placeholder="Your answer..."
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => setStage('setup')} className="btn-ghost">Back</button>
          <button onClick={submitQuiz} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'results' && result) {
    const pct = Math.round(result.score)
    const color = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="card text-center mb-6">
          <p className={clsx('text-5xl font-bold mb-2', color)}>{pct}%</p>
          <p className="text-gray-400">{result.correct_answers} / {result.total_questions} correct</p>
          <p className="text-sm text-gray-500 mt-1">{pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practicing!'}</p>
        </div>

        <div className="space-y-4 mb-6">
          {result.feedback.map((f, i) => (
            <div key={f.question_id} className="card">
              <div className="flex items-start gap-3">
                {f.is_correct
                  ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <p className="text-sm font-medium text-white mb-1"><span className="text-gray-500 mr-1">Q{i + 1}.</span>{f.question_text}</p>
                  {!f.is_correct && (
                    <p className="text-xs text-gray-400 mb-1">Your answer: <span className="text-red-400">{f.user_answer || '(no answer)'}</span></p>
                  )}
                  <p className="text-xs text-gray-400 mb-1">Correct: <span className="text-emerald-400">{f.correct_answer}</span></p>
                  {f.explanation && <p className="text-xs text-gray-500 mt-1 italic">{f.explanation}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => { setStage('setup'); setResult(null); setQuiz(null) }} className="btn-primary w-full flex items-center justify-center gap-2">
          <RotateCcw size={16} /> Try Another Quiz
        </button>
      </div>
    )
  }

  return null
}
