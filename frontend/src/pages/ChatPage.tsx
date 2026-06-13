import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Mic, MicOff, Plus, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { chatApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useVoice } from '../hooks/useVoice'
import clsx from 'clsx'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
}

interface Session {
  id: number
  subject: string
  title: string
  messages: Message[]
}

const SUBJECTS = ['general', 'Mathematics', 'Science', 'Programming', 'History', 'Language Arts', 'Business']

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('general')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice((text) => {
    setInput((prev) => prev + (prev ? ' ' : '') + text)
  })

  useEffect(() => {
    chatApi.getSessions().then((r) => setSessions(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (sessionId) {
      chatApi.getSession(Number(sessionId)).then((r) => {
        setActiveSession(r.data)
        setMessages(r.data.messages)
      }).catch(() => navigate('/chat'))
    }
  }, [sessionId, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createSession = async () => {
    try {
      const res = await chatApi.createSession(selectedSubject)
      setSessions((prev) => [res.data, ...prev])
      setActiveSession(res.data)
      setMessages([])
      navigate(`/chat/${res.data.id}`)
    } catch {
      toast.error('Failed to create session')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeSession || sending) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const res = await fetch(`/api/chat/sessions/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: userMsg.content }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const text = line.slice(6)
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + text,
              }
              return updated
            })
          }
        }
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sessions sidebar */}
      <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <select
            className="input text-sm mb-3"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={createSession} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus size={16} /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSession(s); setMessages(s.messages); navigate(`/chat/${s.id}`) }}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                activeSession?.id === s.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <p className="truncate font-medium">{s.title}</p>
              <p className="text-xs opacity-60">{s.subject}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            <div className="p-4 border-b border-gray-800 bg-gray-900">
              <p className="font-medium text-white">{activeSession.title}</p>
              <p className="text-xs text-gray-400">{activeSession.subject}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={clsx(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  )}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content || '...'}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex items-end gap-2">
                <textarea
                  className="input flex-1 resize-none min-h-[44px] max-h-32"
                  placeholder="Ask your AI tutor anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  rows={1}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={clsx(
                    'p-2.5 rounded-lg transition-colors',
                    isRecording ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  )}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button onClick={sendMessage} disabled={!input.trim() || sending} className="btn-primary p-2.5">
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-4">
              <Send size={28} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Start a Tutoring Session</h2>
            <p className="text-gray-400 mb-6 max-w-sm">Select a subject and create a new session to start learning with your AI tutor.</p>
            <button onClick={createSession} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
