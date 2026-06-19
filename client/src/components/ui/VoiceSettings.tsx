'use client'
import { useState } from 'react'
import { Volume2, VolumeX, Settings2 } from 'lucide-react'
import { useBarashekStore } from '@/lib/store/barashekStore'
import { speak } from '@/lib/barashekVoice'

/** Кнопка-шестерёнка с поповером настроек голоса Барашка (пол + тон + вкл/выкл). */
export function VoiceSettings({ light = false }: { light?: boolean }) {
  const { muted, toggleMute, voice, tone, setVoice, setTone } = useBarashekStore()
  const [open, setOpen] = useState(false)

  const iconCls = light ? 'text-white/80 hover:text-white' : 'text-text-muted hover:text-text-primary'

  // проговорить пример выбранным голосом (стор уже обновлён синхронно)
  const preview = () => setTimeout(() => speak('Привет! Я Барашек, твой помощник.', false), 60)

  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button onClick={toggleMute} className={`transition-colors ${iconCls}`} title={muted ? 'Включить голос' : 'Выключить голос'}>
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button onClick={() => setOpen((o) => !o)} className={`transition-colors ${iconCls}`} title="Настройки голоса">
          <Settings2 className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-[91] w-60 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Голос Барашка</p>

            <p className="mb-1.5 text-xs text-text-secondary">Пол</p>
            <div className="mb-3 flex gap-2">
              <Pill active={voice === 'female'} onClick={() => { setVoice('female'); preview() }}>Женский</Pill>
              <Pill active={voice === 'male'} onClick={() => { setVoice('male'); preview() }}>Мужской</Pill>
            </div>

            <p className="mb-1.5 text-xs text-text-secondary">Тон</p>
            <div className="flex gap-2">
              <Pill active={tone === 'rough'} onClick={() => { setTone('rough'); preview() }}>Грубее</Pill>
              <Pill active={tone === 'normal'} onClick={() => { setTone('normal'); preview() }}>Обычный</Pill>
              <Pill active={tone === 'soft'} onClick={() => { setTone('soft'); preview() }}>Мягче</Pill>
            </div>

            <button
              onClick={() => speak('Привет! Я Барашек, и я буду помогать тебе на каждом шаге.', muted)}
              className="mt-3 w-full rounded-lg bg-primary-50 py-1.5 text-xs font-semibold text-primary hover:bg-primary-50/70"
            >
              ▶ Прослушать
            </button>
          </div>
        </>
      )}
    </div>
  )
}
