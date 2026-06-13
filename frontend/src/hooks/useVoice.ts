import { useState, useRef, useCallback } from 'react'
import { voiceApi } from '../services/api'

export function useVoice(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      setIsProcessing(true)
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const b64 = reader.result as string
          const res = await voiceApi.transcribeBase64(b64, 'audio/webm')
          onTranscript(res.data.transcript)
        } catch {
          // transcription failed silently — user can type instead
        } finally {
          setIsProcessing(false)
        }
      }
      reader.readAsDataURL(blob)
      stream.getTracks().forEach((t) => t.stop())
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }, [onTranscript])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  return { isRecording, isProcessing, startRecording, stopRecording }
}
