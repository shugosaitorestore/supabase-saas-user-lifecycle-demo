import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

type MemberData = {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'invited' | 'active' | 'suspended' | 'left'
  profiles: {
    email: string
    full_name: string
  }
}

export default function OrganizationPage() {
  const { orgId } = useParams()
  const { user } = useAuth()
  
  const [orgName, setOrgName] = useState('')
  const [members, setMembers] = useState<MemberData[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  // データ取得
  const fetchData = async () => {
    if (!orgId) return
    setLoading(true)
    
    // 1. 組織情報の取得 (RLSにより自分の組織しか取れない)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    if (orgError) {
      setMsg('Error loading organization or access denied.')
      setLoading(false)
      return
    }
    setOrgName((org as any).name)

    // 2. メンバー一覧の取得 (profiles情報を結合)
    const { data: memberList, error: memberError } = await supabase
      .from('memberships')
      .select('*, profiles(email, full_name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    if (memberError) {
      console.error(memberError)
    } else {
      setMembers(memberList as unknown as MemberData[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [orgId])

  // 自分の権限を特定 (メンバーリスト取得後)
  const myRole = members.find(m => m.user_id === user?.id)?.role;
  const amIAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  // メンバー招待 (RPC)
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setMsg('Inviting...')

    // RPC呼び出し
    const { data, error } = await supabase.rpc('invite_member', {
      target_org_id: orgId!,
      invite_email: inviteEmail
    } as any)

    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setMsg(`Invite sent! (Dev Mode: Token ID = ${data})`)
      // 開発用: コンソールに招待トークンを表示
      const { data: inviteData } = await supabase
        .from('invites')
        .select('token')
        .eq('id', data)
        .single() as any;
        
      console.log(">>> DEMO INVITE LINK: /invites/" + (inviteData as any).token)
      setInviteEmail('')
    }
  }

  // ステータス変更 (RPC)
  const handleChangeStatus = async (membershipId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return

    const { error } = await supabase.rpc('set_membership_status', {
      target_membership_id: membershipId,
      new_status: newStatus
    } as any)

    if (error) {
      alert(error.message)
    } else {
      fetchData() // リスト更新
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>&larr; Back to Dashboard</Link>
      
      <header style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1>{orgName}</h1>
        <p style={{ color: '#666' }}>Organization ID: {orgId}</p>
        <p>My Role: <strong>{myRole}</strong></p>
      </header>

      {/* 通知エリア */}
      {msg && <div style={{ background: '#eef', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>{msg}</div>}

      {/* 招待フォーム: 権限がある場合のみ表示 */}
      {amIAdminOrOwner && (
        <section style={{ marginBottom: '3rem' }}>
          <h3>Invite Member</h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <button type="submit">Invite</button>
          </form>
          <small style={{ color: '#666' }}>* Since this is a demo, check the console log for the invite link after clicking Invite.</small>
        </section>
      )}

      {/* メンバーリスト */}
      <section>
        <h3>Members</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>User</th>
              <th style={{ padding: '8px' }}>Role</th>
              <th style={{ padding: '8px' }}>Status</th>
              <th style={{ padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              // ボタン表示判定ロジック
              const isMe = m.user_id === user?.id;
              const isTargetOwner = m.role === 'owner';
              
              // 「自分が権限持ち」かつ「対象が自分じゃない」かつ「対象がOwnerじゃない」
              const showActions = amIAdminOrOwner && !isMe && !isTargetOwner;

              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>
                    <div>{m.profiles?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>{m.profiles?.email}</div>
                  </td>
                  <td style={{ padding: '8px' }}>{m.role}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ 
                      padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em',
                      background: m.status === 'active' ? '#e6fffa' : '#fff5f5',
                      color: m.status === 'active' ? '#047481' : '#c53030'
                    }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {showActions && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {m.status !== 'active' && (
                           <button onClick={() => handleChangeStatus(m.id, 'active')} style={{ fontSize: '0.8em' }}>Activate</button>
                        )}
                        {m.status === 'active' && (
                           <button onClick={() => handleChangeStatus(m.id, 'suspended')} style={{ fontSize: '0.8em' }}>Suspend</button>
                        )}
                        <button onClick={() => handleChangeStatus(m.id, 'left')} style={{ fontSize: '0.8em', color: 'red' }}>Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}