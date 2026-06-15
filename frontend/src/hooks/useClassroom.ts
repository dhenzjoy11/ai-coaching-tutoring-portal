import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'

export interface LessonStep {
  title: string
  content: string       // markdown for whiteboard
  narration: string     // plain text for TTS
}

// ── Markdown → plain text for TTS ─────────────────────────────────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')           // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')        // bold
    .replace(/\*(.+?)\*/g, '$1')            // italic
    .replace(/`{3}[\s\S]*?`{3}/g, '')       // fenced code blocks
    .replace(/`(.+?)`/g, '$1')              // inline code
    .replace(/^\|.+\|$/gm, '')             // table rows
    .replace(/^[-|:]+$/gm, '')             // table separators
    .replace(/^[-*+]\s+/gm, '')            // unordered list markers
    .replace(/^\d+\.\s+/gm, '')            // ordered list markers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')    // links
    .replace(/^>\s*/gm, '')                // blockquotes
    .replace(/^---+$/gm, '')               // horizontal rules
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Parse lesson markdown into steps by ## headings ────────────────────────────
export function parseLessonSteps(markdown: string): LessonStep[] {
  // Remove the H1 title line at the top
  const withoutTitle = markdown.replace(/^#\s+.+\n/, '')

  const rawSections = withoutTitle.split(/^(?=## )/m).filter(Boolean)

  return rawSections.map((section) => {
    const lines = section.split('\n')
    const headingLine = lines[0].replace(/^##\s+/, '').trim()
    const body = lines.slice(1).join('\n').trim()

    const narration = `${headingLine}. ${stripMarkdown(body)}`
      .replace(/\s{2,}/g, ' ')
      .trim()

    return {
      title: headingLine,
      content: section.trim(),
      narration,
    }
  }).filter((s) => s.title && s.narration.length > 5)
}

// ── Hook ───────────────────────────────────────────────────────────────────────
interface UseClassroomOptions {
  lessonContent: string
}

export function useClassroom({ lessonContent }: UseClassroomOptions) {
  const [steps, setSteps] = useState<LessonStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Parse steps when lesson content arrives
  useEffect(() => {
    if (!lessonContent) return
    const parsed = parseLessonSteps(lessonContent)
    setSteps(parsed)
  }, [lessonContent])

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

  const speakStep = useCallback(async (stepIndex: number) => {
    if (!steps[stepIndex]) return
    stopAudio()

    setLoading(true)
    setError(null)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await api.post(
        '/tts/speak',
        { text: steps[stepIndex].narration, voice: 'nova' },
        { responseType: 'blob', signal: controller.signal }
      )

      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => { setSpeaking(true); setLoading(false) }
      audio.onended = () => {
        setSpeaking(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setSpeaking(false)
        setLoading(false)
        setError('Audio playback failed')
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'CanceledError') return
      setLoading(false)
      setSpeaking(false)
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'TTS unavailable')
    }
  }, [steps, stopAudio])

  const play = useCallback(() => speakStep(currentStep), [speakStep, currentStep])

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
      setSpeaking(false)
    }
  }, [])

  const goToStep = useCallback((index: number) => {
    stopAudio()
    setCurrentStep(index)
  }, [stopAudio])

  const next = useCallback(() => {
    const nextIdx = Math.min(currentStep + 1, steps.length - 1)
    goToStep(nextIdx)
  }, [currentStep, steps.length, goToStep])

  const prev = useCallback(() => {
    const prevIdx = Math.max(currentStep - 1, 0)
    goToStep(prevIdx)
  }, [currentStep, goToStep])

  // Cleanup on unmount
  useEffect(() => () => stopAudio(), [stopAudio])

  return {
    steps,
    currentStep,
    speaking,
    loading,
    error,
    play,
    pause,
    next,
    prev,
    goToStep,
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
  }
}
