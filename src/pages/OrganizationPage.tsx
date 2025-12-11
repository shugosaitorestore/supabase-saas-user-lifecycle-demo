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

  const fetchData = async () => {
    if (!orgId) return
    setLoading(true)
    
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
    setOrgName(org.name)

    const { data: memberList, error: memberError } = await supabase
      .from('memberships')
      .select('*, profiles(email, full_name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    if (memberError) {
      setMsg('Error loading members.')
    } else {
      setMembers(memberList as unknown as MemberData[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [orgId])

  const myRole = members.find(m => m.user_id === user?.id)?.role;
  const amIAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setMsg('Inviting...')

    const { data, error } = await supabase.rpc('invite_member', {
      target_org_id: orgId!,
      invite_email: inviteEmail
    })

    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      const { data: inviteData } = await supabase
        .from('invites')
        .select('token')
        .eq('id', data)
        .single();
        
      setMsg(`Invite sent! Link: /invites/${inviteData?.token}`)
      setInviteEmail('')
    }
  }

  const handleChangeStatus = async (membershipId: string, newStatus: string) => {
    if (!confirm(`Change status to ${newStatus}?`)) return

    const { error } = await supabase.rpc('set_membership_status', {
      target_membership_id: membershipId,
      new_status: newStatus
    })

    if (error) {
      alert(error.message)
    } else {
      fetchData()
    }
  }

  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <Link to="/" className="link-btn inline-block mb-4">&larr; Back to Dashboard</Link>
      
      <header className="header-row">
        <div>
          <h1>{orgName}</h1>
          <p className="text-xs">ID: {orgId}</p>
        </div>
        <div className={`badge badge-${myRole}`}>My Role: {myRole}</div>
      </header>

      {msg && <div className="info-message">{msg}</div>}

      {amIAdminOrOwner && (
        <section className="card">
          <h3>Invite Member</h3>
          <form onSubmit={handleInvite} className="flex">
            <input type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <button type="submit" className="btn btn-primary">Invite</button>
          </form>
          <p className="text-xs mt-4">* Check console for invite link</p>
        </section>
      )}

      <section>
        <h3>Members</h3>
        <div className="card p-0" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isMe = m.user_id === user?.id;
                  const isTargetOwner = m.role === 'owner';
                  const showActions = amIAdminOrOwner && !isMe && !isTargetOwner;

                  return (
                    <tr key={m.id}>
                      <td>
                        <div>{m.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-xs">{m.profiles?.email}</div>
                      </td>
                      <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                      <td><span className={`badge status-${m.status}`}>{m.status}</span></td>
                      <td>
                        {showActions && (
                          <div className="actions">
                            {m.status !== 'active' ? (
                               <button onClick={() => handleChangeStatus(m.id, 'active')} className="btn btn-secondary">Activate</button>
                            ) : (
                               <button onClick={() => handleChangeStatus(m.id, 'suspended')} className="btn btn-secondary">Suspend</button>
                            )}
                            <button onClick={() => handleChangeStatus(m.id, 'left')} className="btn btn-danger">Remove</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}