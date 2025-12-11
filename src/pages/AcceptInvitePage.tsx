import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // ステータス管理
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAccept = async () => {
    if (!token || !user) return
    
    setLoading(true)
    setError(null)
    
    // RPC呼び出し
    const { error } = await supabase.rpc('accept_invite', {
      invite_token: token
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      // 成功したら少し待ってから遷移（ユーザーに成功を伝えるため）
      setTimeout(() => navigate('/'), 1500)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center', padding: '2rem', border: '1px solid #eee', borderRadius: '8px' }}>
      <h2>Join Organization</h2>
      
      {/* ログインしていない場合 */}
      {!user && (
        <div style={{ marginTop: '1rem', color: '#666' }}>
          <p>Please sign in to accept the invitation.</p>
          <Link to="/auth" style={{ color: 'blue', textDecoration: 'underline' }}>
            Go to Sign In / Sign Up page
          </Link>
        </div>
      )}

      {/* ログイン済みの場合 */}
      {user && !success && (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            You are invited to join an organization.<br/>
            Click the button below to accept.
          </p>
          
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem', background: '#ffe6e6', padding: '0.5rem', borderRadius: '4px' }}>
              Error: {error}
            </div>
          )}

          <button 
            onClick={handleAccept} 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              fontSize: '1.1rem', 
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {loading ? 'Processing...' : 'Accept Invitation'}
          </button>
        </div>
      )}

      {/* 成功時 */}
      {success && (
        <div style={{ marginTop: '2rem', color: 'green' }}>
          <h3>Welcome aboard!</h3>
          <p>Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  )
}