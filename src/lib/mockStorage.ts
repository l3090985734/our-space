import type { Note, Photo, Countdown, Identity } from '../types'

const KEYS = {
  NOTES: 'our-space-notes',
  PHOTOS: 'our-space-photos',
  COUNTDOWNS: 'our-space-countdowns',
} as const

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data))
}

function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000)
}

export const isDemoMode = () => {
  return !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
}

export const demoStorage = {
  getNotes(): Note[] {
    return getFromStorage<Note[]>(KEYS.NOTES, [])
  },

  addNote(author: Identity, content: string, parentId: number | null = null): Note {
    const notes = this.getNotes()
    const newNote: Note = {
      id: generateId(),
      author,
      content,
      parent_id: parentId,
      created_at: new Date().toISOString(),
    }
    notes.unshift(newNote)
    saveToStorage(KEYS.NOTES, notes)
    return newNote
  },

  getNoteReplies(parentId: number): Note[] {
    const notes = this.getNotes()
    return notes
      .filter((n) => n.parent_id === parentId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
  },

  getPhotos(): Photo[] {
    return getFromStorage<Photo[]>(KEYS.PHOTOS, [])
  },

  addPhoto(
    storagePath: string,
    caption: string,
    uploadedBy: Identity,
    publicUrl: string
  ): Photo {
    const photos = this.getPhotos()
    const newPhoto: Photo = {
      id: generateId(),
      storage_path: storagePath,
      caption,
      uploaded_by: uploadedBy,
      sort_order: 0,
      created_at: new Date().toISOString(),
      public_url: publicUrl,
    }
    photos.unshift(newPhoto)
    saveToStorage(KEYS.PHOTOS, photos)
    return newPhoto
  },

  deletePhoto(photoId: number) {
    const photos = this.getPhotos()
    saveToStorage(
      KEYS.PHOTOS,
      photos.filter((p) => p.id !== photoId)
    )
  },

  updatePhotoCaption(photoId: number, caption: string) {
    const photos = this.getPhotos()
    const updated = photos.map((p) =>
      p.id === photoId ? { ...p, caption } : p
    )
    saveToStorage(KEYS.PHOTOS, updated)
  },

  getCountdowns(): Countdown[] {
    return getFromStorage<Countdown[]>(KEYS.COUNTDOWNS, [])
  },

  addCountdown(title: string, targetDate: string): Countdown {
    const countdowns = this.getCountdowns()
    const newCountdown: Countdown = {
      id: generateId(),
      title,
      target_date: targetDate,
      created_at: new Date().toISOString(),
    }
    countdowns.push(newCountdown)
    countdowns.sort(
      (a, b) =>
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    )
    saveToStorage(KEYS.COUNTDOWNS, countdowns)
    return newCountdown
  },

  updateCountdown(id: number, title: string, targetDate: string) {
    const countdowns = this.getCountdowns()
    const updated = countdowns.map((c) =>
      c.id === id ? { ...c, title, target_date: targetDate } : c
    )
    updated.sort(
      (a, b) =>
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    )
    saveToStorage(KEYS.COUNTDOWNS, updated)
    return updated.find((c) => c.id === id)
  },

  deleteCountdown(id: number) {
    const countdowns = this.getCountdowns()
    saveToStorage(
      KEYS.COUNTDOWNS,
      countdowns.filter((c) => c.id !== id)
    )
  },
}

export function initDemoData() {
  if (demoStorage.getNotes().length === 0) {
    demoStorage.addNote('she', '今天想你了 💗', null)
    demoStorage.addNote('he', '我也想你！今天项目终于跑通了', null)
    demoStorage.addNote('she', '嘻嘻，厉害厉害~ 晚上吃什么呀', null)
  }
  if (demoStorage.getCountdowns().length === 0) {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const dateStr = nextMonth.toISOString().split('T')[0]
    demoStorage.addCountdown('下次见面', dateStr)
  }
}
