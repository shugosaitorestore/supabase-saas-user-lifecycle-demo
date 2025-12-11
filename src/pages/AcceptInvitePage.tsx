import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState('Verifying invite...')

  useEffect(() => {
    // ログインしていなければ、まずはログインさせる（リダイレクト処理等は簡易化）
    if (!user) {
      setStatus('Please sign in to accept the invite.')
      return
    }
    
    const accept = async () => {
      if (!token) return
      
      setStatus('Processing invite...')
      const { error } = await supabase.rpc('accept_invite', {
        invite_token: token
      } as any)

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus('Success! Redirecting to dashboard...')
        setTimeout(() => navigate('/'), 2000)
      }
    }

    accept()
  }, [token, user, navigate])

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
      <h2>Join Organization</h2>
      <p>{status}</p>
      
      {!user && (
        <div style={{ marginTop: '1rem' }}>
          <Link to="/auth" style={{ color: 'blue', textDecoration: 'underline' }}>
            Go to Sign In / Sign Up page
          </Link>
        </div>
      )}
    </div>
  )
}