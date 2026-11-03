'use client';

import React from 'react';
import { ShieldAlert, TestTube2 } from 'lucide-react';

interface SandboxBadgeProps {
  className?: string;
  variant?: 'banner' | 'card' | 'pill';
}

export function StripeSandboxBadge({
  className = '',
  variant = 'banner',
}: SandboxBadgeProps) {
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 shadow-2xs ${className}`}
      >
        <TestTube2 className="h-3.5 w-3.5 text-amber-600" />
        <span>Stripe Sandbox / Test Mode</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-amber-100/40 p-3.5 text-xs text-amber-950 shadow-2xs ${className}`}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900">
            <TestTube2 className="h-3.5 w-3.5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-amber-900">
              Sandbox Demonstration Mode Active
            </p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Payment flows run in a simulated Stripe Test Sandbox. <strong>No real money is charged.</strong> Checkout sessions are active for preview and development evaluation only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-b border-amber-300/80 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:px-6 ${className}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <TestTube2 className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
        <span className="font-medium">
          <strong>Developer Sandbox Mode:</strong> Payments and checkouts are simulated test transactions. No live payments or real charges are accepted.
        </span>
      </div>
    </div>
  );
}
