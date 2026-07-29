import type { Note, Photo, Countdown, Identity, TimelineEvent, Wish, AppSettings, TimeCapsule, PhotoComment } from '../types'
import { ANNIVERSARY_DATE } from './config'

const KEYS = {
  NOTES: 'our-space-notes',
  PHOTOS: 'our-space-photos',
  PHOTO_COMMENTS: 'our-space-photo-comments',
  COUNTDOWNS: 'our-space-countdowns',
  TIMELINE: 'our-space-timeline',
  WISHES: 'our-space-wishes',
  SETTINGS: 'our-space-settings',
  CAPSULES: 'our-space-capsules',
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

let idCounter = 0

function generateId(): number {
  idCounter += 1
  return Date.now() * 1000 + idCounter + Math.floor(Math.random() * 100)
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
    publicUrl: string,
    thumbnail?: string
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
      thumbnail,
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

  getPhotoComments(photoId: number): PhotoComment[] {
    const all = getFromStorage<PhotoComment[]>(KEYS.PHOTO_COMMENTS, [])
    return all
      .filter((c) => c.photo_id === photoId)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
  },

  addPhotoComment(photoId: number, author: Identity, content: string): PhotoComment {
    const all = getFromStorage<PhotoComment[]>(KEYS.PHOTO_COMMENTS, [])
    const newComment: PhotoComment = {
      id: generateId(),
      photo_id: photoId,
      author,
      content,
      created_at: new Date().toISOString(),
    }
    all.push(newComment)
    saveToStorage(KEYS.PHOTO_COMMENTS, all)
    return newComment
  },

  deletePhotoComment(commentId: number) {
    const all = getFromStorage<PhotoComment[]>(KEYS.PHOTO_COMMENTS, [])
    saveToStorage(
      KEYS.PHOTO_COMMENTS,
      all.filter((c) => c.id !== commentId)
    )
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

  addTimelineEvent(title: string, eventDate: string, description: string, createdBy?: Identity): TimelineEvent {
    const events = getFromStorage<TimelineEvent[]>(KEYS.TIMELINE, [])
    const newEvent: TimelineEvent = {
      id: generateId(),
      title,
      event_date: eventDate,
      description,
      created_at: new Date().toISOString(),
      created_by: createdBy,
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

  getTimeCapsules(): TimeCapsule[] {
    const data = getFromStorage<TimeCapsule[]>(KEYS.CAPSULES, [])
    return [...data].sort(
      (a, b) =>
        new Date(a.unlock_at).getTime() - new Date(b.unlock_at).getTime()
    )
  },

  addTimeCapsule(
    title: string,
    content: string,
    createdBy: Identity,
    unlockAt: string,
    imageUrl?: string
  ): TimeCapsule {
    const capsules = getFromStorage<TimeCapsule[]>(KEYS.CAPSULES, [])
    const newCapsule: TimeCapsule = {
      id: generateId(),
      title,
      content,
      image_url: imageUrl,
      created_by: createdBy,
      unlock_at: unlockAt,
      created_at: new Date().toISOString(),
    }
    capsules.push(newCapsule)
    saveToStorage(KEYS.CAPSULES, capsules)
    return newCapsule
  },

  deleteTimeCapsule(id: number) {
    const capsules = getFromStorage<TimeCapsule[]>(KEYS.CAPSULES, [])
    saveToStorage(
      KEYS.CAPSULES,
      capsules.filter((c) => c.id !== id)
    )
  },

  getSettings(): AppSettings {
    return getFromStorage<AppSettings>(KEYS.SETTINGS, {
      anniversary_date: ANNIVERSARY_DATE,
    })
  },

  updateSettings(settings: Partial<AppSettings>) {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    saveToStorage(KEYS.SETTINGS, updated)
    return updated
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
    const anniversary = new Date(ANNIVERSARY_DATE)
    const firstMeet = new Date('2023-10-15')
    const firstTrip = new Date('2024-05-01')
    demoStorage.addTimelineEvent(
      '确定关系',
      anniversary.toISOString().split('T')[0],
      '那天晚上在操场上，你牵起了我的手，心跳漏了一拍。',
      'she'
    )
    demoStorage.addTimelineEvent(
      '第一次见面',
      firstMeet.toISOString().split('T')[0],
      '图书馆门口，你穿了件白色卫衣，笑起来好温暖。',
      'he'
    )
    demoStorage.addTimelineEvent(
      '第一次一起旅行',
      firstTrip.toISOString().split('T')[0],
      '去了海边，看了日出，拍了好多好多照片。',
      'she'
    )
  }
  if (demoStorage.getWishes().length === 0) {
    demoStorage.addWish('一起看一次日出', '在山顶或者海边，等太阳慢慢升起来 🌅', '🌅')
    demoStorage.addWish('一起养一只猫', '给它取个可爱的名字，一起铲屎 🐱', '🐱')
    demoStorage.addWish('去一次迪士尼', '当一天小朋友，拍好多好多照片 🎠', '🎠')
    demoStorage.addWish('一起做一顿饭', '从买菜到洗碗，两个人一起完成 🍳', '🍳')
  }
  if (demoStorage.getTimeCapsules().length === 0) {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 7)
    demoStorage.addTimeCapsule(
      '给一周后的我们',
      '不知道一周后的我们在做什么呢？有没有一起吃好吃的？有没有一起看电影？不管怎样，希望我们都开开心心的 💗',
      'she',
      pastDate.toISOString()
    )

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    futureDate.setHours(20, 0, 0, 0)
    demoStorage.addTimeCapsule(
      '给一个月后的你',
      '一个月后的你，看到这个的时候是什么心情呢？希望你已经完成了最近在忙的事情，好好休息一下。想你 💙',
      'he',
      futureDate.toISOString()
    )
  }
  if (demoStorage.getPhotos().length === 0) {
    const photoUrls = [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=romantic%20sunset%20beach%20couple%20silhouette%20pink%20orange%20sky&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20coffee%20shop%20date%20two%20cups%20warm%20light&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cherry%20blossom%20park%20spring%20pink%20flowers%20romantic&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stargazing%20night%20sky%20couple%20blanket%20milky%20way&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rainy%20day%20umbrella%20shared%20cozy%20street%20lights&image_size=square',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20hiking%20adventure%20couple%20sunrise%20peak&image_size=square',
    ]
    const captions = [
      '海边的日落，和你一起看的最美 🌅',
      '周末的下午茶时光 ☕️',
      '春天的樱花，你比花还好看 🌸',
      '一起看过的星空，最亮的星是你的眼睛 ✨',
      '下雨天和你共撑一把伞，是最幸福的事 ☔️',
      '一起爬上山顶看日出，累但值得 🏔️',
    ]
    const identities: Identity[] = ['she', 'he', 'she', 'he', 'she', 'he']

    photoUrls.forEach((url, i) => {
      demoStorage.addPhoto(
        `demo/photo_${i}.webp`,
        captions[i],
        identities[i],
        url,
        url
      )
    })
  }
}
