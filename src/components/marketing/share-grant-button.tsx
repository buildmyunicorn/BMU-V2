'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Copy,
  Check,
  Linkedin,
  Twitter,
  Mail,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ShareGrantButtonProps {
  title: string;
  description?: string;
  slug: string;
  countryCode: string;
  pathType?: 'detail' | 'checklist';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  buttonText?: string;
  showLabel?: boolean;
}

export function ShareGrantButton({
  title,
  description,
  slug,
  countryCode,
  pathType = 'detail',
  variant = 'outline',
  size = 'default',
  className = '',
  buttonText = 'Share Grant',
  showLabel = true,
}: ShareGrantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const countrySegment = countryCode.toLowerCase();
  const relativePath = `/grants/${countrySegment}/${slug}${pathType === 'checklist' ? '/checklist' : ''}`;
  const canonicalUrl = `https://startuppreflight.com${relativePath}`;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return canonicalUrl;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy link failed:', err);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: description || `Check out ${title} on Startup Preflight`,
          url,
        });
        setIsOpen(false);
      }
    } catch {
      // User cancelled native share
    }
  };

  const currentUrl = getShareUrl();
  const shareText = `${title} — Non-dilutive startup funding & eligibility guide`;

  const shareLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      iconColor: 'text-[#0A66C2]',
      bgColor: 'hover:bg-blue-50 hover:border-blue-200',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      iconColor: 'text-slate-900',
      bgColor: 'hover:bg-slate-100 hover:border-slate-300',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      iconColor: 'text-[#25D366]',
      bgColor: 'hover:bg-emerald-50 hover:border-emerald-200',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${currentUrl}`)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      iconColor: 'text-indigo-600',
      bgColor: 'hover:bg-indigo-50 hover:border-indigo-200',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
        `Hi,\n\nI wanted to share this startup grant with you:\n\n${title}\n${description ? `${description}\n\n` : ''}${currentUrl}`
      )}`,
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 transition ${className}`}
      >
        <Share2 className="h-3.5 w-3.5 text-slate-500" />
        {showLabel && buttonText && <span>{buttonText}</span>}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 sm:w-80 origin-top-right rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 focus:outline-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <p className="text-xs font-bold text-slate-900">Share Grant Scheme</p>
              <p className="text-[11px] text-slate-500 truncate max-w-[210px]">{title}</p>
            </div>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
              {countryCode}
            </span>
          </div>

          {/* Copy Link Input Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5">
              <input
                type="text"
                readOnly
                value={currentUrl}
                aria-label="Grant page shareable link"
                className="w-full truncate bg-transparent px-2 text-xs text-slate-600 select-all focus:outline-hidden"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className={`h-7 px-2.5 text-xs font-semibold shrink-0 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Share Targets */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {shareLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 rounded-xl border border-slate-100 p-2 text-xs font-medium text-slate-700 transition ${item.bgColor}`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${item.iconColor}`} />
                <span className="truncate">{item.name}</span>
                <ExternalLink className="ml-auto h-2.5 w-2.5 text-slate-400" />
              </a>
            ))}
          </div>

          {/* Native Share Option on Mobile / Supported Desktops */}
          {canNativeShare && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>More options... (AirDrop, Apps)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
