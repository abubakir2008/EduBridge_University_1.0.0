import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BarashekMood } from '@/components/ui/BarashekMascot'

export type MomentVariant = 'celebrate' | 'remind' | 'info'

export interface BarashekMoment {
  id: string
  title: string
  text: string
  mood?: BarashekMood
  variant?: MomentVariant
  actionLabel?: string   // кнопка действия в всплывашке
  actionHref?: string    // куда вести по клику
}

export type VoiceGender = 'female' | 'male'
export type VoiceTone = 'rough' | 'normal' | 'soft'  // грубее / обычный / мягче

interface BarashekState {
  moment: BarashekMoment | null
  queue: BarashekMoment[]
  muted: boolean
  voice: VoiceGender
  tone: VoiceTone
  say: (m: Omit<BarashekMoment, 'id'> & { id?: string }) => void
  dismiss: () => void
  toggleMute: () => void
  setVoice: (v: VoiceGender) => void
  setTone: (t: VoiceTone) => void
}

export const useBarashekStore = create<BarashekState>()(
  persist(
    (set, get) => ({
      moment: null,
      queue: [],
      muted: false,
      voice: 'female',
      tone: 'normal',

      say(m) {
        const moment: BarashekMoment = { id: m.id ?? crypto.randomUUID(), ...m }
        const cur = get().moment
        if (cur) {
          // не дублируем по id
          if (cur.id === moment.id || get().queue.some((q) => q.id === moment.id)) return
          set((s) => ({ queue: [...s.queue, moment] }))
        } else {
          set({ moment })
        }
      },

      dismiss() {
        set((s) => {
          const [next, ...rest] = s.queue
          return { moment: next ?? null, queue: rest }
        })
      },

      toggleMute() {
        set((s) => ({ muted: !s.muted }))
      },

      setVoice(v) { set({ voice: v }) },
      setTone(t) { set({ tone: t }) },
    }),
    {
      // v3: сброс выбора голоса → стандартный женский, натуральный тон
      name: 'barashek-prefs-v3',
      partialize: (s) => ({ muted: s.muted, voice: s.voice, tone: s.tone }),
    }
  )
)
