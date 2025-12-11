import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'

type OrgData = {
  org_id: string
  role: string
  organization: {
    id: string
    name: string
  }
}

export default function DashboardPage() {
  const { signOut, user } = useAuth()
  const [orgs, setOrgs] = useState<OrgData[]>([])
  const [newOrgName, setNewOrgName] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOrgs = async () => {
    if (!user) return; // ガードを追加

    setLoading(true)
    const { data, error } = await supabase
      .from('memberships')
      .select('org_id, role, organization:organizations(id, name)')
      .eq('status', 'active')
      .eq('user_id', user.id) // 【重要】自分のレコードだけに絞り込む
    
    if (error) {
      console.error('Error fetching orgs:', error)
    } else {
      setOrgs(data as unknown as OrgData[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrgs()
  }, [])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    // RPC呼び出し: トランザクションで組織作成 + Owner権限付与
    const { error } = await supabase.rpc('create_organization', {
      org_name: newOrgName
    }as any)

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setNewOrgName('')
      fetchOrgs() // リスト更新
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>{user?.email}</span>
          <button onClick={() => signOut()} style={{ padding: '4px 8px' }}>Sign Out</button>
        </div>
      </header>

      {/* 組織作成フォーム */}
      <section style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Create New Organization</h3>
        <form onSubmit={handleCreateOrg} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Organization Name (e.g. Acme Corp)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <button type="submit" disabled={!newOrgName}>Create (RPC)</button>
        </form>
      </section>

      {/* 組織一覧 */}
      <section>
        <h3>Your Organizations</h3>
        {loading ? (
          <p>Loading...</p>
        ) : orgs.length === 0 ? (
          <p>You don't belong to any organization yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {orgs.map((item) => (
              <li key={item.org_id} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{item.organization.name}</strong>
                  <span style={{ marginLeft: '10px', fontSize: '0.8em', color: '#666', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.role}
                  </span>
                </div>
                <Link to={`/orgs/${item.org_id}`} style={{ textDecoration: 'none', color: 'blue', fontWeight: 'bold' }}>
                  Manage &rarr;
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}