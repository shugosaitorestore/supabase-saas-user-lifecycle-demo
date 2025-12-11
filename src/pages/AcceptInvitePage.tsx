import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAccept = async () => {
    if (!token || !user) return
    
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.rpc('accept_invite', {
      invite_token: token
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 1500)
    }
  }

  return (
    <div className="container container-narrow mt-16">
      <div className="card text-center">
        <h2>Join Organization</h2>
        
        {!user && (
          <div className="mt-4">
            <p>Please sign in to accept the invitation.</p>
            <Link to="/auth" className="link-btn">
              Go to Sign In / Sign Up page
            </Link>
          </div>
        )}

        {user && !success && (
          <div className="mt-4">
            <p className="mb-6">
              You are invited to join an organization.<br/>
              Click the button below to accept.
            </p>
            
            {error && (
              <div className="error-message">
                Error: {error}
              </div>
            )}

            <button 
              onClick={handleAccept} 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Processing...' : 'Accept Invitation'}
            </button>
          </div>
        )}

        {success && (
          <div className="success-message">
            <h3>Welcome aboard!</h3>
            <p>Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}