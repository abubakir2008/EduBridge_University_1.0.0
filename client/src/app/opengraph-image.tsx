import { ImageResponse } from 'next/og'

// Динамически генерируемое OG-изображение (превью при шаринге ссылки).
// Текст латиницей — шрифт по умолчанию в next/og не содержит кириллицы.
export const runtime = 'edge'
export const alt = 'EduBridge University — Study abroad from CIS'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg,#1D4ED8 0%,#2563EB 55%,#3B82F6 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>EduBridge University</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>
            Study abroad — without intermediaries
          </div>
          <div style={{ fontSize: 32, opacity: 0.92 }}>Germany · Italy · China · Turkey · USA</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 28 }}>
          <span style={{ opacity: 0.9 }}>university.edubridge.bond</span>
          <span
            style={{
              background: '#ffffff',
              color: '#1D4ED8',
              padding: '10px 24px',
              borderRadius: 999,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            3000+ students
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
