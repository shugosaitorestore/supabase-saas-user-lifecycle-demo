import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'

// Temporary Placeholders
const AuthPage = () => <div className="p-8"><h1>Auth Page (To be implemented)</h1></div>
const DashboardPage = () => <div className="p-8"><h1>Dashboard (To be implemented)</h1></div>
const OrganizationPage = () => <div className="p-8"><h1>Organization Details (To be implemented)</h1></div>
const AcceptInvitePage = () => <div className="p-8"><h1>Accept Invite (To be implemented)</h1></div>

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