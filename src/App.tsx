import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'

// Real Pages
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'

// Yet to be implemented
const OrganizationPage = () => <div className="p-8"><h1>Organization Details (Coming Next)</h1></div>
const AcceptInvitePage = () => <div className="p-8"><h1>Accept Invite (Coming Next)</h1></div>

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/invites/:token" element={<AcceptInvitePage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orgs/:orgId" element={<OrganizationPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App