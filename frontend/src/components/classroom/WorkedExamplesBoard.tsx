import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'
import type { ParsedExample } from '../../hooks/useWorkedExamples'

interface Props {
  examples: ParsedExample[]
  currentExampleIndex: number
  revealedCount: number
  speaking: boolean
  loading: boolean
  onNextSubStep: () => void
  onJumpToExample: (idx: number) => void
  isLastSubStep: boolean
}

export default function WorkedExamplesBoard({
  examples,
  currentExampleIndex,
  revealedCount,
  speaking,
  loading,
  onNextSubStep,
  onJumpToExample,
  isLastSubStep,
}: Props) {
  const newestStepRef = useRef<HTMLDivElement>(null)
  const example = examples[currentExampleIndex]

  // Scroll newest step into view when revealed
  useEffect(() => {
    newestStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [revealedCount, currentExampleIndex])

  if (!example) return null

  const visibleSteps = example.subSteps.slice(0, revealedCount)
  const problemStep = example.subSteps[0]
  const solutionSteps = visibleSteps.slice(1)
  const allSolutionSteps = example.subSteps.slice(1)
  const totalSolutionSteps = allSolutionSteps.length
  const revealedSolutionCount = solutionSteps.length

  return (
    <div className="flex flex-col h-full">
      {/* Example tab selector */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-800 bg-gray-900/40 flex-shrink-0">
        <span className="text-xs text-gray-500 font-mono mr-1">example</span>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onJumpToExample(i)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
              i === currentExampleIndex
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            )}
          >
            {i < currentExampleIndex ? (
              <CheckCircle2 size={10} className="text-emerald-400" />
            ) : (
              <Circle size={10} />
            )}
            {ex.index}
          </button>
        ))}

        <span className="ml-auto text-xs text-gray-600">
          {revealedSolutionCount} / {totalSolutionSteps} solution steps revealed
        </span>
      </div>

      {/* Whiteboard content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* Example title */}
        <div className="mb-6">
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">
            Example {example.index}
          </p>
          <h2 className="text-lg font-bold text-white">{example.title}</h2>
        </div>

        {/* Problem — always fully shown once entered this example */}
        {problemStep && (
          <div className="mb-6 p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/30">
            <p className="text-xs font-mono text-indigo-400 mb-3 uppercase tracking-wider">Problem</p>
            <div className="prose-lesson">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problemStep.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Solution steps */}
        {(solutionSteps.length > 0 || revealedCount > 1) && (
          <div className="space-y-3">
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-4">
              Solution
            </p>

            {solutionSteps.map((subStep, i) => {
              const isNewest = i === solutionSteps.length - 1
              const isSingleBlock = subStep.type === 'step' && subStep.label === 'Solution'

              return (
                <div
                  key={i}
                  ref={isNewest ? newestStepRef : undefined}
                  className={clsx(
                    'flex gap-3 p-4 rounded-xl border transition-all duration-300',
                    isNewest
                      ? 'border-emerald-700/60 bg-emerald-950/30 animate-step-reveal'
                      : 'border-gray-800 bg-gray-900/40 opacity-70',
                    isSingleBlock && 'flex-col'
                  )}
                >
                  {/* Step marker */}
                  {!isSingleBlock && (
                    <div className="flex-shrink-0 mt-0.5">
                      {isNewest ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center">
                          <ChevronRight size={12} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                          <CheckCircle2 size={11} className="text-emerald-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step content */}
                  <div className={clsx('flex-1 prose-lesson', isNewest && 'text-white')}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {subStep.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Placeholder hint when only problem is shown */}
        {solutionSteps.length === 0 && revealedCount === 1 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-700 text-gray-600">
            <ChevronRight size={16} />
            <span className="text-sm italic">Click "Next Step" to start the solution walkthrough…</span>
          </div>
        )}

        {/* All steps done for this example */}
        {!isLastSubStep && revealedSolutionCount === totalSolutionSteps && totalSolutionSteps > 0 && (
          <div className="mt-6 p-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 text-center">
            <p className="text-sm text-emerald-400 font-medium">
              Example {example.index} complete! Click "Next Step" for Example {example.index + 1}.
            </p>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/40 flex-shrink-0">
        <div className="text-xs text-gray-500">
          {revealedCount === 1
            ? 'Problem shown — ready to begin the solution'
            : `${revealedSolutionCount} of ${totalSolutionSteps} steps revealed`}
        </div>

        <button
          onClick={onNextSubStep}
          disabled={loading || speaking || isLastSubStep}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
            isLastSubStep
              ? 'bg-gray-800 text-gray-600 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {revealedSolutionCount < totalSolutionSteps
            ? 'Show Next Step'
            : currentExampleIndex < examples.length - 1
              ? `Next Example →`
              : 'All Done!'}
          {!isLastSubStep && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  )
}
