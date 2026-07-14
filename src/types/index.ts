export type Identity = 'he' | 'she'

export interface Note {
  id: number
  author: Identity
  content: string
  parent_id: number | null
  created_at: string
}

export interface Photo {
  id: number
  storage_path: string
  caption: string
  uploaded_by: Identity
  sort_order: number
  created_at: string
  public_url?: string
}

export interface Countdown {
  id: number
  title: string
  target_date: string
  created_at: string
}
