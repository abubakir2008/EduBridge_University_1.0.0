'use client'
import { motion } from 'framer-motion'

export type BarashekMood = 'idle' | 'talking' | 'happy' | 'thinking' | 'sad'

interface BarashekMascotProps {
  mood?: BarashekMood
  size?: number
  className?: string
}

/**
 * Барашек — фирменный AI-персонаж EduBridge.
 * Анимированный SVG (Framer Motion): покачивается, моргает, шевелит ушами,
 * «говорит» и радуется в зависимости от настроения.
 */
export function BarashekMascot({ mood = 'idle', size = 140, className }: BarashekMascotProps) {
  const talking = mood === 'talking'
  const happy = mood === 'happy'
  const thinking = mood === 'thinking'
  const sad = mood === 'sad'

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={
        happy
          ? { y: [0, -10, 0], rotate: [0, -3, 3, 0] }
          : { y: [0, -5, 0] }
      }
      transition={{
        duration: happy ? 0.6 : 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} fill="none">
        {/* Тень */}
        <ellipse cx="100" cy="185" rx="48" ry="8" fill="#000" opacity="0.08" />

        {/* Ноги */}
        <rect x="78" y="150" width="10" height="26" rx="5" fill="#5b4636" />
        <rect x="112" y="150" width="10" height="26" rx="5" fill="#5b4636" />

        {/* Шерсть-тело (облачко) */}
        <g>
          <circle cx="100" cy="120" r="46" fill="#ffffff" />
          <circle cx="62" cy="118" r="26" fill="#ffffff" />
          <circle cx="138" cy="118" r="26" fill="#ffffff" />
          <circle cx="74" cy="146" r="24" fill="#ffffff" />
          <circle cx="126" cy="146" r="24" fill="#ffffff" />
          <circle cx="100" cy="150" r="26" fill="#ffffff" />
          {/* мягкие тени шерсти */}
          <circle cx="62" cy="118" r="26" fill="#eef1f6" opacity="0.5" />
          <circle cx="138" cy="118" r="26" fill="#eef1f6" opacity="0.5" />
        </g>

        {/* Уши */}
        <motion.ellipse
          cx="58" cy="92" rx="14" ry="9" fill="#cbb59a"
          style={{ originX: '70px', originY: '92px' }}
          animate={{ rotate: talking || happy ? [0, -18, 0] : [0, -6, 0] }}
          transition={{ duration: talking ? 0.5 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.ellipse
          cx="142" cy="92" rx="14" ry="9" fill="#cbb59a"
          style={{ originX: '130px', originY: '92px' }}
          animate={{ rotate: talking || happy ? [0, 18, 0] : [0, 6, 0] }}
          transition={{ duration: talking ? 0.5 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Голова */}
        <g>
          {/* чёлка-шерсть */}
          <circle cx="100" cy="78" r="20" fill="#ffffff" />
          <circle cx="84" cy="84" r="13" fill="#ffffff" />
          <circle cx="116" cy="84" r="13" fill="#ffffff" />
          {/* лицо */}
          <ellipse cx="100" cy="100" rx="30" ry="28" fill="#e8d8c3" />

          {/* глаза */}
          <motion.g
            animate={{ scaleY: [1, 1, 0.1, 1] }}
            style={{ originY: '98px' }}
            transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
          >
            <ellipse cx="89" cy="98" rx="4.5" ry="5.5" fill="#3a2e22" />
            <ellipse cx="111" cy="98" rx="4.5" ry="5.5" fill="#3a2e22" />
            <circle cx="90.5" cy="96" r="1.5" fill="#fff" />
            <circle cx="112.5" cy="96" r="1.5" fill="#fff" />
          </motion.g>

          {/* румянец */}
          <ellipse cx="80" cy="108" rx="6" ry="4" fill="#f7b7c4" opacity="0.7" />
          <ellipse cx="120" cy="108" rx="6" ry="4" fill="#f7b7c4" opacity="0.7" />

          {/* носик */}
          <ellipse cx="100" cy="108" rx="3.5" ry="2.5" fill="#8a6f57" />

          {/* рот */}
          {talking ? (
            <motion.ellipse
              cx="100" cy="116" rx="5" fill="#8a6f57"
              animate={{ ry: [1.5, 4.5, 1.5] }}
              transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : happy ? (
            <path d="M92 114 Q100 124 108 114" stroke="#8a6f57" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : sad ? (
            <path d="M92 120 Q100 112 108 120" stroke="#8a6f57" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M94 115 Q100 120 106 115" stroke="#8a6f57" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          {/* слезинка при грусти */}
          {sad && (
            <motion.path
              d="M89 102 q-2 5 0 7 q2 -2 0 -7"
              fill="#7cc4f0"
              animate={{ opacity: [0, 1, 1, 0], y: [0, 6, 12, 18] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </g>

        {/* Искорки при радости */}
        {happy && (
          <>
            <motion.text x="38" y="60" fontSize="18"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}>✨</motion.text>
            <motion.text x="150" y="70" fontSize="16"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}>💚</motion.text>
          </>
        )}

        {/* «Думаю» — троеточие */}
        {thinking && (
          <g>
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={i}
                cx={150 + i * 12}
                cy={70}
                r="4"
                fill="#94a3b8"
                animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </g>
        )}
      </svg>
    </motion.div>
  )
}
