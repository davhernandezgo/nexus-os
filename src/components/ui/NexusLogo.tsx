import React from 'react';

interface NexusLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const NexusLogo: React.FC<NexusLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = SIZE_MAP[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClass} ${className}`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        <defs>
          <linearGradient id="nexus-grad-1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="nexus-glow" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Ambient Squircle Container */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="13"
          className="fill-nexus-surface-2 stroke-nexus-border"
          strokeWidth="1.5"
        />

        {/* Subtle background glow */}
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="12"
          fill="url(#nexus-glow)"
          opacity="0.18"
        />

        {/* Stylized Interconnected Nexus 'N' Paths */}
        {/* Left vertical pillar */}
        <path
          d="M15 33V15"
          stroke="url(#nexus-grad-1)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Diagonal link bridging personal + partner/context */}
        <path
          d="M15 17L33 31"
          stroke="url(#nexus-grad-1)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Right vertical pillar */}
        <path
          d="M33 33V15"
          stroke="url(#nexus-grad-1)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Active Node Points (Life + Synergy) */}
        <circle cx="15" cy="15" r="2.5" fill="#ffffff" className="drop-shadow-sm" />
        <circle cx="33" cy="33" r="2.5" fill="#ffffff" className="drop-shadow-sm" />
        <circle cx="24" cy="24" r="1.8" fill="#ec4899" />
      </svg>
    </div>
  );
};

export default NexusLogo;
