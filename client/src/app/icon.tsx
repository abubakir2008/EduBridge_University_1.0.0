import { ImageResponse } from 'next/og'

// Динамически генерируемый favicon.
export const runtime = 'edge'
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
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
          fontSize: 42,
          fontWeight: 800,
          borderRadius: 14,
        }}
      >
        E
      </div>
    ),
    { ...size }
  )
}
