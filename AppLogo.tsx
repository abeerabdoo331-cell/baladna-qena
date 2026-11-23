import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'lg';
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'lg' }) => {
  const dimension = size === 'lg' ? 'w-20 h-20' : 'w-10 h-10';

  return (
    <div className={`${dimension} shrink-0`} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1E5248" />
            <stop offset="100%" stopColor="#143A33" />
          </linearGradient>
          <linearGradient id="logoGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E6BC6E" />
            <stop offset="100%" stopColor="#C48A32" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#logoBg)" />
        {/* Warm desert sun */}
        <circle cx="60" cy="48" r="22" fill="url(#logoGold)" opacity="0.22" />
        <circle cx="60" cy="48" r="13" fill="url(#logoGold)" />
        {/* Palm fronds */}
        <path
          d="M60 36 C54 27 43 26 37 31 C45 30 53 33 60 36 Z"
          fill="#9FD3B8"
        />
        <path
          d="M60 36 C66 27 77 26 83 31 C75 30 67 33 60 36 Z"
          fill="#9FD3B8"
        />
        {/* Village homes & central arch */}
        <path d="M26 80 L40 62 L54 80 V93 H26 Z" fill="#FAF6F0" />
        <path
          d="M49 93 V56 C49 50 54 45 60 45 C66 45 71 50 71 56 V93 Z"
          fill="#FAF6F0"
        />
        <path d="M66 80 L80 62 L94 80 V93 H66 Z" fill="#EDE5D8" />
        {/* Arch doorway */}
        <path
          d="M55.5 93 V77 C55.5 74 57.5 72 60 72 C62.5 72 64.5 74 64.5 77 V93 Z"
          fill="#1E5248"
        />
        {/* Horizon base */}
        <rect x="22" y="92" width="76" height="4.5" rx="2.25" fill="url(#logoGold)" />
      </svg>
    </div>
  );
};
