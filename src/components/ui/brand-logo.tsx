'use client';

import React from 'react';
import Link from 'next/link';

export interface BrandLogoProps {
  /** Visual presentation mode */
  variant?: 'full' | 'mark' | 'text';
  /** Color theme for text & backgrounds */
  theme?: 'light' | 'dark' | 'auto';
  /** Size scale */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Optional badge next to the title (e.g. '2.0', 'BETA') */
  badge?: string;
  /** Whether to render the brand tagline beneath the wordmark */
  showTagline?: boolean;
  /** Optional link destination (defaults to undefined for pure display) */
  href?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Extra CSS classes applied to root wrapper */
  className?: string;
  /** Priority attribute for image / SVG optimization */
  priority?: boolean;
}

const sizeMap = {
  xs: {
    mark: 20,
    container: 'h-5 w-5',
    title: 'text-xs',
    tagline: 'text-[9px]',
    gap: 'gap-1.5',
    badge: 'text-[9px] px-1 py-0.2',
  },
  sm: {
    mark: 28,
    container: 'h-7 w-7',
    title: 'text-sm',
    tagline: 'text-[10px]',
    gap: 'gap-2',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  md: {
    mark: 36,
    container: 'h-9 w-9',
    title: 'text-base',
    tagline: 'text-[11px]',
    gap: 'gap-2.5',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  lg: {
    mark: 44,
    container: 'h-11 w-11',
    title: 'text-lg',
    tagline: 'text-xs',
    gap: 'gap-3',
    badge: 'text-xs px-2 py-0.5',
  },
  xl: {
    mark: 56,
    container: 'h-14 w-14',
    title: 'text-2xl',
    tagline: 'text-xs',
    gap: 'gap-3.5',
    badge: 'text-xs px-2.5 py-0.5',
  },
};

/**
 * PreflightMark: High-precision SVG icon of the Supersonic Preflight Delta
 * combining aerodynamic forward thrust, guidance orbit, and launch beacon.
 */
export function PreflightMark({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Upper Wing Gradient: Indigo to Electric Violet */}
        <linearGradient
          id={`spf-top-${uniqueId}`}
          x1="11"
          y1="20"
          x2="39"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Lower Wing Gradient: Deep Aerospace Indigo */}
        <linearGradient
          id={`spf-bot-${uniqueId}`}
          x1="23"
          y1="27"
          x2="39"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#312E81" />
          <stop offset="50%" stopColor="#3730A3" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Fuselage / Keel Spine Highlight */}
        <linearGradient
          id={`spf-keel-${uniqueId}`}
          x1="23"
          y1="27"
          x2="39"
          y2="9"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>

        {/* Preflight Guidance Trajectory Arc */}
        <linearGradient
          id={`spf-orbit-${uniqueId}`}
          x1="6"
          y1="41"
          x2="27"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.95" />
        </linearGradient>

        {/* Subtle Apex Glow */}
        <filter
          id={`spf-glow-${uniqueId}`}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="0.8" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* Primary Runway / Guidance Arc */}
      <path
        d="M 6 40 C 10 42, 17 41, 23 35 C 26 32, 28 28, 27 25"
        stroke={`url(#spf-orbit-${uniqueId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Secondary Speed Slipstream */}
      <path
        d="M 7 34 C 11 35, 16 33, 20 28"
        stroke={`url(#spf-orbit-${uniqueId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Upper Port Wing (Climb & Lift) */}
      <path
        d="M 39 9 L 11 20 L 23 27 Z"
        fill={`url(#spf-top-${uniqueId})`}
      />

      {/* Lower Starboard Wing (Structural Base) */}
      <path
        d="M 39 9 L 23 27 L 29 37 Z"
        fill={`url(#spf-bot-${uniqueId})`}
      />

      {/* Center Dorsal Spine / Cockpit Vector */}
      <path
        d="M 39 9 L 23 27 L 24.5 25 L 34 14 Z"
        fill={`url(#spf-keel-${uniqueId})`}
        opacity="0.95"
      />

      {/* Trailing Thruster Core */}
      <path
        d="M 23 27 L 20 30 L 22 26 Z"
        fill="#06B6D4"
        opacity="0.85"
      />

      {/* Launch Beacon (Polaris / Flight Clearance Star) */}
      <g filter={`url(#spf-glow-${uniqueId})`}>
        <circle cx="39" cy="9" r="1.5" fill="#FFFFFF" />
        <circle
          cx="39"
          cy="9"
          r="2.8"
          stroke="#38BDF8"
          strokeWidth="0.8"
          opacity="0.75"
          fill="none"
        />
      </g>
    </svg>
  );
}

/**
 * BrandLogo: Primary branding component for Startup Preflight.
 * Supports Mark-only, Full lockup, light/dark themes, and responsive sizes.
 */
export function BrandLogo({
  variant = 'full',
  theme = 'light',
  size = 'md',
  badge,
  showTagline = false,
  href,
  onClick,
  className = '',
}: BrandLogoProps) {
  const conf = sizeMap[size];

  const content = (
    <div
      className={`group inline-flex items-center ${conf.gap} select-none ${className}`}
      onClick={onClick}
    >
      {/* Aerodynamic Mark Container */}
      <div
        className={`flex ${conf.container} shrink-0 items-center justify-center rounded-xl transition-shadow group-hover:shadow-md`}
      >
        <PreflightMark size={conf.mark} />
      </div>

      {/* Wordmark */}
      {variant !== 'mark' && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${conf.title} ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Startup
              <span
                className={
                  theme === 'dark'
                    ? 'ml-1 text-indigo-400'
                    : 'ml-1 text-indigo-600'
                }
              >
                Preflight
              </span>
            </span>

            {badge && (
              <span
                className={`rounded-full font-bold uppercase tracking-wider ${conf.badge} ${
                  theme === 'dark'
                    ? 'border border-indigo-400/30 bg-indigo-500/20 text-indigo-300'
                    : 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                }`}
              >
                {badge}
              </span>
            )}
          </div>

          {showTagline && (
            <span
              className={`mt-1 font-bold uppercase tracking-widest ${conf.tagline} ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Supportive Co-Founder &amp; Blind-Spot Engine
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
