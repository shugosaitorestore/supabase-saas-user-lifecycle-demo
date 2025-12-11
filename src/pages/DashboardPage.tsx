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
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('memberships')
      .select('org_id, role, organization:organizations(id, name)')
      .eq('status', 'active')
      .eq('user_id', user.id)
    
    if (error) {
      // Error handling - could be improved with user-facing error messages
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

    const { error } = await supabase.rpc('create_organization', {
      org_name: newOrgName
    })

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setNewOrgName('')
      fetchOrgs()
    }
  }

  return (
    <div className="container">
      <header className="header-row">
        <div>
          <h1>Dashboard</h1>
          <p className="text-sm">{user?.email}</p>
        </div>
        <button onClick={() => signOut()} className="btn btn-secondary">Sign Out</button>
      </header>

      <section className="card">
        <h3>Create New Organization</h3>
        <form onSubmit={handleCreateOrg} className="flex">
          <input
            type="text"
            placeholder="Organization Name (e.g. Acme Corp)"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <button type="submit" disabled={!newOrgName} className="btn btn-primary">Create</button>
        </form>
      </section>
      <section>
        <h3>Your Organizations</h3>
        {loading ? (
          <p>Loading...</p>
        ) : orgs.length === 0 ? (
          <p>You don't belong to any organization yet.</p>
        ) : (
          <div className="flex-col">
            {orgs.map((item) => (
              <div key={item.org_id} className="card flex items-center justify-between mb-0">
                <div>
                  <strong>{item.organization.name}</strong>
                  <div className="text-xs">ID: {item.org_id}</div>
                </div>
                <div className="flex items-center">
                  <span className={`badge badge-${item.role}`}>{item.role}</span>
                  <Link to={`/orgs/${item.org_id}`} className="btn btn-secondary ml-4">
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}