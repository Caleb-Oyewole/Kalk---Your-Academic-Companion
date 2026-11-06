/* Small hand-drawn style SVG decorations used on the landing + auth pages. */

export function Cloud({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 260" aria-hidden preserveAspectRatio="xMidYMax meet">
      <defs>
        <radialGradient id="cloudFill" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f4f8ff" />
          <stop offset="100%" stopColor="#cfe0ff" />
        </radialGradient>
        <filter id="cloudBlur" x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g filter="url(#cloudBlur)" fill="url(#cloudFill)">
        <circle cx="130" cy="170" r="78" />
        <circle cx="240" cy="120" r="96" />
        <circle cx="360" cy="105" r="104" />
        <circle cx="480" cy="145" r="88" />
        <circle cx="545" cy="188" r="62" />
        <ellipse cx="330" cy="205" rx="270" ry="58" />
      </g>
    </svg>
  );
}

export function CloudOutline({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 36" aria-hidden>
      <path
        d="M14 31c-6 0-10-3-10-8s4-8 9-8c1-6 6-10 12-10 6 0 10 3 12 8 7-1 12 3 12 9 0 5-4 9-10 9z"
        fill="#fff"
        stroke="#0B0B10"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Bird({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 50 44" aria-hidden>
      <path d="M6 16c4 0 7 3 8 6" fill="none" stroke="#0B0B10" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M14 24c0-8 6-14 14-14 6 0 10 3 12 8l7 3-7 3c-1 9-7 16-15 16-6 0-11-6-11-16z"
        fill="#fff"
        stroke="#0B0B10"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="35" cy="19" r="2" fill="#0B0B10" />
      <path d="M22 28c4 0 8 2 10 6" fill="none" stroke="#0B0B10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Wings({ className = "" }: { className?: string }) {
  const feather = (rot: number, len: number) => (
    <ellipse
      cx="0"
      cy={-len / 2}
      rx="9"
      ry={len / 2}
      transform={`rotate(${rot})`}
      fill="#fff"
      stroke="#0B0B10"
      strokeWidth="2.2"
    />
  );
  return (
    <svg className={className} viewBox="-80 -80 160 100" aria-hidden>
      <g transform="translate(0 0)">
        {feather(-70, 54)}
        {feather(-45, 62)}
        {feather(-20, 66)}
        {feather(5, 60)}
      </g>
    </svg>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
