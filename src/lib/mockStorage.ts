import type { Note, Photo, Countdown, Identity, TimelineEvent, Wish } from '../types'

const KEYS = {
  NOTES: 'our-space-notes',
  PHOTOS: 'our-space-photos',
  COUNTDOWNS: 'our-space-countdowns',
  TIMELINE: 'our-space-timeline',
  WISHES: 'our-space-wishes',
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

  getTimeline(): TimelineEvent[] {
    const data = getFromStorage<TimelineEvent[]>(KEYS.TIMELINE, [])
    return [...data].sort(
      (a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    )
  },

  addTimelineEvent(title: string, eventDate: string, description: string): TimelineEvent {
    const events = getFromStorage<TimelineEvent[]>(KEYS.TIMELINE, [])
    const newEvent: TimelineEvent = {
      id: generateId(),
      title,
      event_date: eventDate,
      description,
      created_at: new Date().toISOString(),
    }
    events.push(newEvent)
    saveToStorage(KEYS.TIMELINE, events)
    return newEvent
  },

  updateTimelineEvent(id: number, title: string, eventDate: string, description: string) {
    const events = getFromStorage<TimelineEvent[]>(KEYS.TIMELINE, [])
    const updated = events.map((e) =>
      e.id === id ? { ...e, title, event_date: eventDate, description } : e
    )
    saveToStorage(KEYS.TIMELINE, updated)
    return updated.find((e) => e.id === id)
  },

  deleteTimelineEvent(id: number) {
    const events = getFromStorage<TimelineEvent[]>(KEYS.TIMELINE, [])
    saveToStorage(
      KEYS.TIMELINE,
      events.filter((e) => e.id !== id)
    )
  },

  getWishes(): Wish[] {
    const data = getFromStorage<Wish[]>(KEYS.WISHES, [])
    return [...data].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  },

  addWish(title: string, description: string, icon: string): Wish {
    const wishes = getFromStorage<Wish[]>(KEYS.WISHES, [])
    const newWish: Wish = {
      id: generateId(),
      title,
      description,
      icon,
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
    }
    wishes.push(newWish)
    saveToStorage(KEYS.WISHES, wishes)
    return newWish
  },

  updateWish(id: number, title: string, description: string, icon: string) {
    const wishes = getFromStorage<Wish[]>(KEYS.WISHES, [])
    const updated = wishes.map((w) =>
      w.id === id ? { ...w, title, description, icon } : w
    )
    saveToStorage(KEYS.WISHES, updated)
    return updated.find((w) => w.id === id)
  },

  toggleWish(id: number) {
    const wishes = getFromStorage<Wish[]>(KEYS.WISHES, [])
    const updated = wishes.map((w) => {
      if (w.id === id) {
        const now = !w.completed
        return {
          ...w,
          completed: now,
          completed_at: now ? new Date().toISOString() : null,
        }
      }
      return w
    })
    saveToStorage(KEYS.WISHES, updated)
    return updated.find((w) => w.id === id)
  },

  deleteWish(id: number) {
    const wishes = getFromStorage<Wish[]>(KEYS.WISHES, [])
    saveToStorage(KEYS.WISHES, wishes.filter((w) => w.id !== id))
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
  if (demoStorage.getTimeline().length === 0) {
    const anniversary = new Date('2024-01-01')
    const firstMeet = new Date('2023-10-15')
    const firstTrip = new Date('2024-05-01')
    demoStorage.addTimelineEvent(
      '确定关系',
      anniversary.toISOString().split('T')[0],
      '那天晚上在操场上，你牵起了我的手，心跳漏了一拍。'
    )
    demoStorage.addTimelineEvent(
      '第一次见面',
      firstMeet.toISOString().split('T')[0],
      '图书馆门口，你穿了件白色卫衣，笑起来好温暖。'
    )
    demoStorage.addTimelineEvent(
      '第一次一起旅行',
      firstTrip.toISOString().split('T')[0],
      '去了海边，看了日出，拍了好多好多照片。'
    )
  }
  if (demoStorage.getWishes().length === 0) {
    demoStorage.addWish('一起看一次日出', '在山顶或者海边，等太阳慢慢升起来 🌅', '🌅')
    demoStorage.addWish('一起养一只猫', '给它取个可爱的名字，一起铲屎 🐱', '🐱')
    demoStorage.addWish('去一次迪士尼', '当一天小朋友，拍好多好多照片 🎠', '🎠')
    demoStorage.addWish('一起做一顿饭', '从买菜到洗碗，两个人一起完成 🍳', '🍳')
  }
}
