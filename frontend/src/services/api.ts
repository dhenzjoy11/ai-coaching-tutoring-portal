import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; username: string; password: string; full_name?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// Chat
export const chatApi = {
  createSession: (subject?: string) =>
    api.post('/chat/sessions', { subject: subject || 'general', title: 'New Session' }),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (id: number) => api.get(`/chat/sessions/${id}`),
}

// Subjects
export const subjectsApi = {
  list: () => api.get('/subjects'),
  get: (id: number) => api.get(`/subjects/${id}`),
  createLearningPath: (subjectId: number, topic: string, difficulty: string) =>
    api.post(`/subjects/${subjectId}/learning-paths?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`),
}

// Progress
export const progressApi = {
  dashboard: () => api.get('/progress/dashboard'),
  activities: () => api.get('/progress/activities'),
  paths: () => api.get('/progress/paths'),
}

// Quiz
export const quizApi = {
  generate: (subject: string, topic: string, difficulty: string, num_questions: number) =>
    api.post('/quiz/generate', { subject, topic, difficulty, num_questions }),
  list: () => api.get('/quiz'),
  get: (id: number) => api.get(`/quiz/${id}`),
  submit: (quiz_id: number, answers: Record<string, string>) =>
    api.post('/quiz/attempt', { quiz_id, answers }),
}

// Voice
export const voiceApi = {
  transcribeBase64: (audio_data: string, mime_type: string) =>
    api.post('/voice/transcribe/base64', { audio_data, mime_type }),
}

// Practice
export const practiceApi = {
  getProblems: (lessonId: number) => api.get(`/practice/lessons/${lessonId}`),
  newSet: (lessonId: number, seenIds: number[]) =>
    api.post(`/practice/lessons/${lessonId}/new-set`, { seen_ids: seenIds }),
}

// Curriculum
export const curriculumApi = {
  listUnits: (subjectId?: number) =>
    api.get('/curriculum/units', { params: subjectId ? { subject_id: subjectId } : {} }),
  getUnit: (id: number) => api.get(`/curriculum/units/${id}`),
  getLesson: (id: number) => api.get(`/curriculum/lessons/${id}`),
  updateProgress: (lessonId: number, status: string, score?: number) =>
    api.post(`/curriculum/lessons/${lessonId}/progress`, { status, score }),
  getMyProgress: () => api.get('/curriculum/progress'),
}
