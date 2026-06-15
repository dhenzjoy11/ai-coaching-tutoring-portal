import clsx from 'clsx'

interface Props {
  speaking: boolean
  className?: string
}

export default function TeacherAvatar({ speaking, className }: Props) {
  return (
    <div className={clsx('flex flex-col items-center', className)}>
      {/* Avatar frame with glow when speaking */}
      <div className="relative">
        {speaking && (
          <div className="absolute -inset-3 rounded-full bg-indigo-500/20 animate-ping" />
        )}
        <div
          className={clsx(
            'relative rounded-full border-2 transition-all duration-500 overflow-hidden',
            speaking
              ? 'border-indigo-400 shadow-lg shadow-indigo-500/40'
              : 'border-gray-700'
          )}
          style={{ width: 160, height: 160 }}
        >
          <svg
            viewBox="0 0 160 160"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Background */}
            <circle cx="80" cy="80" r="80" fill="#1e293b" />

            {/* Body / blazer */}
            <path
              d="M 20 160 L 20 120 Q 20 105 38 100 L 62 92 L 80 112 L 98 92 L 122 100 Q 140 105 140 120 L 140 160 Z"
              fill="#4f46e5"
            />

            {/* Lapels / shirt */}
            <path d="M 62 92 L 80 112 L 98 92 L 92 86 L 80 95 L 68 86 Z" fill="#e2e8f0" />

            {/* Collar line */}
            <path
              d="M 68 86 L 80 95 L 92 86"
              stroke="#cbd5e1"
              strokeWidth="1"
              fill="none"
            />

            {/* Neck */}
            <rect x="71" y="76" width="18" height="20" rx="5" fill="#d4956a" />

            {/* Head */}
            <ellipse cx="80" cy="60" rx="32" ry="34" fill="#d4956a" />

            {/* Hair top */}
            <path
              d="M 48 52 Q 48 22 80 20 Q 112 22 112 52 L 112 40 Q 105 16 80 14 Q 55 16 48 40 Z"
              fill="#1a1a2e"
            />
            {/* Hair sides */}
            <path d="M 48 40 Q 44 55 47 68 L 50 65 Q 49 52 52 45 Z" fill="#1a1a2e" />
            <path d="M 112 40 Q 116 55 113 68 L 110 65 Q 111 52 108 45 Z" fill="#1a1a2e" />

            {/* Ears */}
            <ellipse cx="48" cy="62" rx="6" ry="8" fill="#d4956a" />
            <ellipse cx="112" cy="62" rx="6" ry="8" fill="#d4956a" />

            {/* Eyes whites */}
            <ellipse cx="68" cy="60" rx="7" ry="7.5" fill="white" />
            <ellipse cx="92" cy="60" rx="7" ry="7.5" fill="white" />

            {/* Irises */}
            <circle cx="69" cy="61" r="4.5" fill="#2d1b00" />
            <circle cx="91" cy="61" r="4.5" fill="#2d1b00" />

            {/* Pupils + highlights */}
            <circle cx="70" cy="60" r="2" fill="#000" />
            <circle cx="92" cy="60" r="2" fill="#000" />
            <circle cx="71" cy="59" r="1.2" fill="white" />
            <circle cx="93" cy="59" r="1.2" fill="white" />

            {/* Eyebrows */}
            <path
              d="M 61 51 Q 68 47 75 51"
              stroke="#1a1a2e"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 85 51 Q 92 47 99 51"
              stroke="#1a1a2e"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Nose */}
            <path
              d="M 78 65 Q 75 72 78 74 Q 80 76 82 74 Q 85 72 82 65"
              stroke="#b07850"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Mouth — slight smile idle, more open speaking */}
            {speaking ? (
              <>
                {/* Open mouth */}
                <path
                  d="M 70 80 Q 80 90 90 80"
                  stroke="#8b4513"
                  strokeWidth="2"
                  fill="#c0725a"
                  strokeLinecap="round"
                />
                {/* Teeth */}
                <path
                  d="M 72 80 Q 80 85 88 80"
                  fill="white"
                />
              </>
            ) : (
              <path
                d="M 70 80 Q 80 87 90 80"
                stroke="#c0725a"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {/* Left arm (relaxed) */}
            <path
              d="M 20 130 L 10 152 Q 9 157 14 158 L 26 140 Z"
              fill="#4f46e5"
            />
            <ellipse
              cx="11"
              cy="158"
              rx="7"
              ry="9"
              fill="#d4956a"
              transform="rotate(-15 11 158)"
            />

            {/* Right arm raised — pointing/explaining */}
            <path
              d="M 140 125 L 154 100 Q 157 95 161 98 L 148 126 Z"
              fill="#4f46e5"
            />
            <ellipse
              cx="162"
              cy="96"
              rx="7"
              ry="9"
              fill="#d4956a"
              transform="rotate(30 162 96)"
            />

            {/* Pointer / marker in hand */}
            <line
              x1="165"
              y1="89"
              x2="148"
              y2="118"
              stroke="#f8fafc"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="165" cy="88" r="3" fill="#f59e0b" />
          </svg>
        </div>
      </div>

      {/* Teacher name */}
      <p className="mt-3 text-sm font-medium text-gray-300">Ms. Nova</p>
      <p className="text-xs text-gray-500">Grade 8 Mathematics</p>

      {/* Sound wave when speaking */}
      <div className="mt-3 flex items-end gap-1 h-5">
        {speaking ? (
          <>
            <div className="w-1 bg-indigo-400 rounded-full sound-bar" style={{ '--delay': '0ms' } as React.CSSProperties} />
            <div className="w-1 bg-indigo-400 rounded-full sound-bar" style={{ '--delay': '150ms' } as React.CSSProperties} />
            <div className="w-1 bg-indigo-500 rounded-full sound-bar" style={{ '--delay': '75ms' } as React.CSSProperties} />
            <div className="w-1 bg-indigo-400 rounded-full sound-bar" style={{ '--delay': '225ms' } as React.CSSProperties} />
            <div className="w-1 bg-indigo-300 rounded-full sound-bar" style={{ '--delay': '100ms' } as React.CSSProperties} />
          </>
        ) : (
          <div className="h-0.5 w-12 bg-gray-700 rounded-full" />
        )}
      </div>
    </div>
  )
}
