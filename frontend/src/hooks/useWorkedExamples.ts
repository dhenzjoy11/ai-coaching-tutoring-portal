import { useState, useCallback, useRef, useEffect } from 'react'
import api from '../services/api'

export interface ExampleSubStep {
  type: 'problem' | 'step'
  label: string       // "Problem", "Step 1", "Step 2" …
  content: string     // markdown for whiteboard
  narration: string   // plain text for TTS
}

export interface ParsedExample {
  index: number       // 1-based
  title: string       // "Example 1 — Classify each number"
  subSteps: ExampleSubStep[]
}

function strip(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export function parseWorkedExamples(sectionContent: string): ParsedExample[] {
  // Drop the ## heading line
  const body = sectionContent.replace(/^##\s+[^\n]+\n/, '').trim()

  // Split into individual example blocks by ### heading
  const blocks = body.split(/^(?=### )/m).filter((b) => /^### /.test(b))

  return blocks.map((block, i) => {
    const lines = block.split('\n')
    const titleLine = lines[0].replace(/^###\s+/, '').trim()
    const rest = lines.slice(1).join('\n')

    // Split at **Solution:** or **Solution** marker
    const solMatch = rest.match(/\*\*Solution[:\s*]*\*\*/)
    let problemText = rest
    let solutionText = ''

    if (solMatch && solMatch.index !== undefined) {
      problemText = rest.slice(0, solMatch.index).trim()
      solutionText = rest.slice(solMatch.index + solMatch[0].length).trim()
    }

    const subSteps: ExampleSubStep[] = []

    // ── Problem sub-step ────────────────────────────────────────────────────
    subSteps.push({
      type: 'problem',
      label: 'Problem',
      content: problemText.replace(/^---\s*$\n?/m, '').trim(),
      narration: `Example ${i + 1}. ${strip(titleLine)}. Here's the problem: ${strip(problemText)}`,
    })

    // ── Solution sub-steps ──────────────────────────────────────────────────
    if (solutionText) {
      // Try to find bullet-point steps
      const bullets = solutionText.match(/^[-*]\s+.+(?:\n(?![-*\n]).+)*/gm)
      if (bullets && bullets.length > 1) {
        // Multiple bullets → one sub-step each
        bullets.forEach((bullet, j) => {
          const text = bullet.replace(/^[-*]\s+/, '').trim()
          const opener = j === 0 ? "Let's work through each one. " : ''
          subSteps.push({
            type: 'step',
            label: `Step ${j + 1}`,
            content: bullet,
            narration: `${opener}${strip(text)}`,
          })
        })
      } else {
        // Paragraph solution (no distinct bullets, or a single bullet) — treat as one block
        const cleaned = solutionText.replace(/^---\s*$\n?/gm, '').trim()
        subSteps.push({
          type: 'step',
          label: 'Solution',
          content: cleaned,
          narration: `Here's the solution. ${strip(cleaned)}`,
        })
      }
    }

    return { index: i + 1, title: titleLine, subSteps }
  })
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWorkedExamples(sectionContent: string | null) {
  const [examples, setExamples] = useState<ParsedExample[]>([])
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [revealedCount, setRevealedCount] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!sectionContent) {
      setExamples([])
      return
    }
    const parsed = parseWorkedExamples(sectionContent)
    setExamples(parsed)
    setCurrentExampleIndex(0)
    setRevealedCount(1)
  }, [sectionContent])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setSpeaking(false)
    setLoading(false)
  }, [])

  const speak = useCallback(async (narration: string) => {
    stopAudio()
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await api.post(
        '/tts/speak',
        { text: narration, voice: 'nova' },
        { responseType: 'blob', signal: controller.signal }
      )
      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => { setSpeaking(true); setLoading(false) }
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url) }
      audio.onerror = () => {
        setSpeaking(false); setLoading(false); URL.revokeObjectURL(url)
      }
      await audio.play()
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'CanceledError') return
      setLoading(false)
      setSpeaking(false)
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'TTS unavailable')
    }
  }, [stopAudio])

  // Expose the current example object safely
  const currentExample = examples[currentExampleIndex] ?? null

  const nextSubStep = useCallback(() => {
    if (!currentExample) return

    if (revealedCount < currentExample.subSteps.length) {
      const nextCount = revealedCount + 1
      setRevealedCount(nextCount)
      const subStep = currentExample.subSteps[nextCount - 1]
      if (subStep) speak(subStep.narration)
    } else if (currentExampleIndex < examples.length - 1) {
      // Move to the next example, start from its problem
      stopAudio()
      const nextIdx = currentExampleIndex + 1
      setCurrentExampleIndex(nextIdx)
      setRevealedCount(1)
      const firstStep = examples[nextIdx]?.subSteps[0]
      if (firstStep) speak(firstStep.narration)
    }
  }, [currentExample, revealedCount, currentExampleIndex, examples, speak, stopAudio])

  const prevSubStep = useCallback(() => {
    stopAudio()
    if (revealedCount > 1) {
      setRevealedCount((r) => r - 1)
    } else if (currentExampleIndex > 0) {
      const prevIdx = currentExampleIndex - 1
      setCurrentExampleIndex(prevIdx)
      setRevealedCount(examples[prevIdx]?.subSteps.length ?? 1)
    }
  }, [revealedCount, currentExampleIndex, examples, stopAudio])

  const speakCurrent = useCallback(() => {
    const step = currentExample?.subSteps[revealedCount - 1]
    if (step) speak(step.narration)
  }, [currentExample, revealedCount, speak])

  const jumpToExample = useCallback((idx: number) => {
    stopAudio()
    setCurrentExampleIndex(idx)
    setRevealedCount(1)
    const firstStep = examples[idx]?.subSteps[0]
    if (firstStep) speak(firstStep.narration)
  }, [examples, speak, stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  const isLastSubStep =
    currentExample !== null &&
    revealedCount >= currentExample.subSteps.length &&
    currentExampleIndex >= examples.length - 1

  const isFirstSubStep = revealedCount === 1 && currentExampleIndex === 0

  // Total sub-step position across all examples (for the teacher panel)
  const totalSubSteps = examples.reduce((s, e) => s + e.subSteps.length, 0)
  const completedSubSteps =
    examples
      .slice(0, currentExampleIndex)
      .reduce((s, e) => s + e.subSteps.length, 0) + revealedCount

  return {
    examples,
    currentExample,
    currentExampleIndex,
    revealedCount,
    speaking,
    loading,
    error,
    nextSubStep,
    prevSubStep,
    speakCurrent,
    jumpToExample,
    isLastSubStep,
    isFirstSubStep,
    totalSubSteps,
    completedSubSteps,
    stopAudio,
  }
}
