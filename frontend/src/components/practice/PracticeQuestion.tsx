import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronRight, Hash } from 'lucide-react'
import clsx from 'clsx'

export interface ProblemData {
  id: number
  type: 'multiple_choice' | 'true_false' | 'numeric' | 'short_answer'
  question: string
  options?: string[]
  answer: string
  tolerance?: number
  placeholder?: string
  explanation: string
}

interface Props {
  problem: ProblemData
  questionNumber: number
  totalQuestions: number
  onAnswer: (correct: boolean, userAnswer: string) => void
}

function isCorrect(problem: ProblemData, userAnswer: string): boolean {
  const ua = userAnswer.trim()
  if (problem.type === 'numeric') {
    const uaNum = parseFloat(ua)
    const correctNum = parseFloat(problem.answer)
    if (isNaN(uaNum)) return false
    return Math.abs(uaNum - correctNum) <= (problem.tolerance ?? 0.05)
  }
  return ua.toLowerCase() === problem.answer.toLowerCase()
}

export default function PracticeQuestion({ problem, questionNumber, totalQuestions, onAnswer }: Props) {
  const [selected, setSelected] = useState<string>('')
  const [numericInput, setNumericInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)

  const userAnswer = problem.type === 'numeric' ? numericInput : selected
  const canSubmit = userAnswer.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit || submitted) return
    const result = isCorrect(problem, userAnswer)
    setCorrect(result)
    setSubmitted(true)
    // Delay calling onAnswer so user can read feedback first
  }

  const handleNext = () => {
    onAnswer(correct, userAnswer)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(((questionNumber - 1) / totalQuestions) * 100)}% done</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-300">
            {questionNumber}
          </span>
          <h2 className="text-lg font-medium text-white leading-snug">{problem.question}</h2>
        </div>
      </div>

      {/* Answer input */}
      <div className="flex-1">
        {(problem.type === 'multiple_choice' || problem.type === 'true_false') && problem.options && (
          <div className="space-y-3">
            {problem.options.map((opt) => {
              const isSelected = selected === opt
              const isCorrectOpt = submitted && opt === problem.answer
              const isWrong = submitted && isSelected && !correct

              return (
                <button
                  key={opt}
                  onClick={() => !submitted && setSelected(opt)}
                  disabled={submitted}
                  className={clsx(
                    'w-full flex items-center gap-3 px-5 py-4 rounded-xl border text-left text-sm transition-all duration-200',
                    !submitted && !isSelected && 'border-gray-700 bg-gray-900 text-gray-300 hover:border-indigo-600 hover:bg-indigo-950/30',
                    !submitted && isSelected && 'border-indigo-500 bg-indigo-950/50 text-white',
                    submitted && isCorrectOpt && 'border-emerald-500 bg-emerald-950/40 text-emerald-200',
                    submitted && isWrong && 'border-red-500 bg-red-950/30 text-red-300',
                    submitted && !isCorrectOpt && !isWrong && 'border-gray-800 bg-gray-900/40 text-gray-500 opacity-60',
                  )}
                >
                  <span className={clsx(
                    'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    !submitted && isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-gray-600',
                    submitted && isCorrectOpt && 'border-emerald-500',
                    submitted && isWrong && 'border-red-500',
                  )}>
                    {submitted && isCorrectOpt && <CheckCircle2 size={14} className="text-emerald-400" />}
                    {submitted && isWrong && <XCircle size={14} className="text-red-400" />}
                    {!submitted && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {problem.type === 'numeric' && (
          <div className="space-y-3">
            <div className="relative">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="number"
                step="any"
                value={numericInput}
                onChange={(e) => !submitted && setNumericInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !submitted && handleSubmit()}
                placeholder={problem.placeholder ?? 'Enter a number'}
                disabled={submitted}
                className={clsx(
                  'w-full pl-10 pr-4 py-4 rounded-xl border text-white bg-gray-900 text-lg font-mono focus:outline-none transition-colors',
                  !submitted && 'border-gray-700 focus:border-indigo-500',
                  submitted && correct && 'border-emerald-500 bg-emerald-950/20',
                  submitted && !correct && 'border-red-500 bg-red-950/20',
                )}
              />
            </div>
            {submitted && !correct && (
              <p className="text-sm text-gray-400">
                Correct answer: <span className="text-emerald-400 font-mono font-semibold">{problem.answer}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {submitted && (
        <div className={clsx(
          'mt-6 p-4 rounded-xl border',
          correct ? 'border-emerald-700/50 bg-emerald-950/30' : 'border-red-700/50 bg-red-950/20'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {correct
              ? <><CheckCircle2 size={16} className="text-emerald-400" /><span className="text-sm font-semibold text-emerald-300">Correct!</span></>
              : <><XCircle size={16} className="text-red-400" /><span className="text-sm font-semibold text-red-300">Not quite</span></>
            }
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{problem.explanation}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div />
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-40"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
          >
            {questionNumber < totalQuestions ? 'Next Question' : 'See Results'}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
