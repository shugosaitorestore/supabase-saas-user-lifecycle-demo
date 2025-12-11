export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
      }
      memberships: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          status: 'invited' | 'active' | 'suspended' | 'left'
          created_at: string
        }
      }
    }
    Functions: {
      get_my_org_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      create_organization: {
        Args: { org_name: string }
        Returns: string
      }
      invite_member: {
        Args: { target_org_id: string; invite_email: string }
        Returns: string
      }
      accept_invite: {
        Args: { invite_token: string }
        Returns: string
      }
      set_membership_status: {
        Args: { target_membership_id: string; new_status: string }
        Returns: void
      }
    }
  }
}