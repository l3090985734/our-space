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

// =============================================================
// 🔋 模块级内存缓存：首屏 JSON.parse 是同步 CPU 密集操作（Demo 模式用户数据多的时候单次 5~50ms 很常见），
// 原代码每个 hook.组件/每次操作都 getFromStorage → JSON.parse 一次，
// HomePage 5 个 hook + initDemoData → 首屏 20+ 次重复 parse → 肉眼可见卡顿。
// 现在只读一次，写操作失效对应 key 的缓存。
// =============================================================
type StorageKey = (typeof KEYS)[keyof typeof KEYS]
// 🔋 模块级内存缓存：见上面注释
type CacheMap = Partial<Record<StorageKey, unknown>>
const _cache: CacheMap = {}

function getFromStorage<T>(key: StorageKey, defaultValue: T): T {
  if (_cache[key] !== undefined) return _cache[key] as T
  try {
    const raw = localStorage.getItem(key)
    const data = raw ? (JSON.parse(raw) as T) : defaultValue
    _cache[key] = data
    return data
  } catch {
    _cache[key] = defaultValue
    return defaultValue
  }
}

function saveToStorage<T>(key: StorageKey, data: T) {
  _cache[key] = data
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage 写失败（超出配额 / 隐私模式）忽略；内存缓存仍是最新的，会话内可用。
  }
}

function invalidateCache(key: StorageKey) {
  delete _cache[key]
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
    const next = [newNote, ...notes]
    saveToStorage(KEYS.NOTES, next)
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
    const next = [newPhoto, ...photos]
    saveToStorage(KEYS.PHOTOS, next)
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
    const next = [...all, newComment]
    saveToStorage(KEYS.PHOTO_COMMENTS, next)
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
    const next = [...countdowns, newCountdown].sort(
      (a, b) =>
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    )
    saveToStorage(KEYS.COUNTDOWNS, next)
    return newCountdown
  },

  updateCountdown(id: number, title: string, targetDate: string) {
    const countdowns = this.getCountdowns()
    const updated = countdowns.map((c) =>
      c.id === id ? { ...c, title, target_date: targetDate } : c
    ).sort(
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
    saveToStorage(KEYS.TIMELINE, [...events, newEvent])
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
    saveToStorage(KEYS.WISHES, [...wishes, newWish])
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
    saveToStorage(KEYS.CAPSULES, [...capsules, newCapsule])
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

  /** 诊断工具：清空全部内存缓存（极少用到——如跨 tab 同步需显式 invalidate） */
  _invalidateAll() {
    Object.keys(KEYS).forEach((k) => invalidateCache(KEYS[k as keyof typeof KEYS]))
  },
}

// =============================================================
// 🔁 Demo 初始化：首屏必须最快跑完（之前每个 addXxx 都 getXxx → JSON.parse 一遍，
// 现在全走内存缓存，最多 1 次 parse 读 + 1 次 serialize 写）
// =============================================================
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
    // 用 picsum.photos 固定 seed，永远 200/304 秒回，不卡首屏
    const photoUrls = [
      'https://picsum.photos/seed/sunset-beach-romance/600/600',
      'https://picsum.photos/seed/coffee-shop-date/600/600',
      'https://picsum.photos/seed/cherry-blossom-park/600/600',
      'https://picsum.photos/seed/stargazing-couple/600/600',
      'https://picsum.photos/seed/rainy-day-umbrella/600/600',
      'https://picsum.photos/seed/mountain-sunrise-peak/600/600',
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
        `demo/photo_${i}.jpg`,
        captions[i],
        identities[i],
        url,
        url
      )
    })
  }
}
