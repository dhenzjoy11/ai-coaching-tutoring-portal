import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import SubjectsPage from './pages/SubjectsPage'
import QuizPage from './pages/QuizPage'
import ProgressPage from './pages/ProgressPage'
import SubjectHubPage from './pages/SubjectHubPage'
import CurriculumPage from './pages/CurriculumPage'
import LessonPage from './pages/LessonPage'
import ClassroomPage from './pages/ClassroomPage'
import PracticePage from './pages/PracticePage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:sessionId" element={<ChatPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="learn" element={<SubjectHubPage />} />
          <Route path="learn/:subjectSlug" element={<CurriculumPage />} />
          <Route path="learn/:subjectSlug/lessons/:lessonId" element={<LessonPage />} />
          <Route path="learn/:subjectSlug/lessons/:lessonId/classroom" element={<ClassroomPage />} />
          <Route path="learn/:subjectSlug/lessons/:lessonId/practice" element={<PracticePage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="progress" element={<ProgressPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
