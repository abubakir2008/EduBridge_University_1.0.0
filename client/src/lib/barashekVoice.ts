'use client'
import { apiBarashekTTS } from '@/lib/api/ai'
import { useBarashekStore } from '@/lib/store/barashekStore'

/**
 * Озвучка реплик Барашка. Сначала пробуем ElevenLabs (живой голос),
 * при ошибке/лимите — откат на встроенный голос браузера.
 */

function clean(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/[*_`#>]/g, '')
    .replace(/[$₽¥€]/g, '')
    .replace(/(\d)[\s ](?=\d)/g, '$1')
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ElevenLabs ВКЛЮЧЁН и зафиксирован (голос Jessica). Никакого отката на браузерный голос:
// если ElevenLabs недоступен — просто тишина, но голос НИКОГДА не «прыгает» на другой.
const USE_ELEVENLABS = true

let currentAudio: HTMLAudioElement | null = null
const cache = new Map<string, string>() // ключ "text" → objectURL (экономим символы ElevenLabs)

// Дедуп: один и тот же текст в коротком окне не озвучиваем дважды
// (React StrictMode в dev вызывает эффекты по 2 раза).
let lastText = ''
let lastTime = 0

function stopAll() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel() } catch { /* no-op */ }
  }
}

export function cancelSpeech() {
  stopAll()
}

// Оценка времени «прочтения» — когда голос недоступен/выключен (мс).
function _estimateMs(t: string): number {
  return Math.min(25000, Math.max(3500, t.length * 70))
}

/**
 * Озвучить текст. onEnd вызывается, КОГДА голос закончил (или по таймеру,
 * если голос недоступен/выключен) — чтобы можно было держать сообщение до конца речи.
 */
export async function speak(text: string, muted: boolean, onEnd?: () => void) {
  const fire = () => { try { onEnd?.() } catch { /* no-op */ } }
  if (typeof window === 'undefined') { fire(); return }
  const t = clean(text)
  if (!t) { fire(); return }
  // дедуп одинаковых подряд (StrictMode / случайные повторы) — onEnd вызовет первый вызов
  const now = Date.now()
  if (t === lastText && now - lastTime < 2500) return
  lastText = t
  lastTime = now

  // Голос выключен — держим сообщение по времени чтения, потом onEnd
  if (muted) { setTimeout(fire, _estimateMs(t)); return }

  const { voice: gender, tone } = useBarashekStore.getState()
  stopAll()

  // Основной голос — ElevenLabs (Jessica). Если не вышло (лимит/сеть/блокировка автоплея) —
  // запасной браузерный голос, чтобы Барашек НИКОГДА не оставался без голоса.
  if (USE_ELEVENLABS) {
    try {
      let url = cache.get(t)
      if (!url) {
        const blob = await apiBarashekTTS(t, 'female')  // всегда Jessica
        url = URL.createObjectURL(blob)
        cache.set(t, url)
      }
      const audio = new Audio(url)
      currentAudio = audio
      audio.onended = fire
      audio.onerror = () => webSpeech(t, gender, tone, fire)
      await audio.play()      // может отклониться (автоплей до клика) → catch → браузерный голос
      return
    } catch {
      // не сыграло — переходим на браузерный голос
    }
  }

  webSpeech(t, gender, tone, fire)
}

// ── Браузерный голос (fallback) ───────────────────────────────────────────────

const FEMALE = ['milena', 'svetlana', 'светлана', 'алёна', 'alyona', 'tatyana', 'татьяна', 'irina', 'ирина', 'google', 'female', 'женск']
const MALE = ['pavel', 'павел', 'dmitry', 'дмитрий', 'yuri', 'юрий', 'artemiy', 'maxim', 'максим', 'male', 'мужск']

function pickVoice(gender: 'female' | 'male'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  const ru = voices.filter((v) => v.lang?.toLowerCase().startsWith('ru') || /russ|русск/i.test(v.name))
  if (!ru.length) return null
  const prefs = gender === 'male' ? MALE : FEMALE
  for (const p of prefs) {
    const f = ru.find((v) => v.name.toLowerCase().includes(p))
    if (f) return f
  }
  return ru[0]
}

// «грубее / обычный / мягче» → высота тона (натуральные значения, без искажения)
const TONE_PITCH: Record<string, number> = { rough: 0.85, normal: 1.0, soft: 1.2 }

function webSpeech(t: string, gender: 'female' | 'male', tone: string, onEnd?: () => void) {
  const fire = () => { try { onEnd?.() } catch { /* no-op */ } }
  if (!window.speechSynthesis) { setTimeout(fire, _estimateMs(t)); return }
  try {
    const u = new SpeechSynthesisUtterance(t)
    const v = pickVoice(gender)
    if (v) u.voice = v
    u.lang = 'ru-RU'
    u.rate = 1.05
    u.pitch = TONE_PITCH[tone] ?? 1.0
    u.onend = fire
    u.onerror = () => setTimeout(fire, _estimateMs(t))
    window.speechSynthesis.speak(u)
  } catch { setTimeout(fire, _estimateMs(t)) }
}
