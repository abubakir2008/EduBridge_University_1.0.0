import { ImageResponse } from 'next/og'

// Иконка для домашнего экрана iOS.
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563EB',
          color: '#ffffff',
          fontSize: 110,
          fontWeight: 800,
        }}
      >
        E
      </div>
    ),
    { ...size }
  )
}
