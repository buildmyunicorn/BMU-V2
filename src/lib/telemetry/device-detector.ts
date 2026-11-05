/**
 * Zero-dependency client-side device & environment telemetry detector.
 * Extracts hardware form-factor, OS, browser, viewport, pixel ratio, and touch capability.
 */

export interface DeviceTelemetry {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  os: string;
  browser: string;
  screenResolution: string;
  viewport: string;
  pixelRatio: number;
  isTouch: boolean;
  orientation: 'Portrait' | 'Landscape';
  summary: string;
  rawUserAgent: string;
}

export function detectDeviceTelemetry(): DeviceTelemetry {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'Desktop',
      os: 'Unknown (Server)',
      browser: 'Unknown',
      screenResolution: 'N/A',
      viewport: 'N/A',
      pixelRatio: 1,
      isTouch: false,
      orientation: 'Landscape',
      summary: 'Server Environment',
      rawUserAgent: '',
    };
  }

  const ua = navigator.userAgent || '';
  const width = window.innerWidth || 0;
  const height = window.innerHeight || 0;
  const screenWidth = window.screen?.width || width;
  const screenHeight = window.screen?.height || height;
  const pixelRatio = window.devicePixelRatio || 1;
  const isTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    ((navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints || 0) > 0;

  const orientation: 'Portrait' | 'Landscape' = height > width ? 'Portrait' : 'Landscape';

  // 1. Detect Operating System
  let os = 'Unknown OS';
  if (/iPhone/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\.]\d+)/);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  } else if (/iPad/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\.]\d+)/);
    os = match ? `iPadOS ${match[1].replace('_', '.')}` : 'iPadOS';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    // Note: iPads on iPadOS 13+ report as Mac by default with touch points > 1
    if (isTouch && navigator.maxTouchPoints > 1) {
      os = 'iPadOS (Mac WebKit)';
    } else {
      os = 'macOS';
    }
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  }

  // 2. Detect Browser
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  } else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/SamsungBrowser/i.test(ua)) {
    const match = ua.match(/SamsungBrowser\/(\d+)/);
    browser = match ? `Samsung Internet ${match[1]}` : 'Samsung Internet';
  } else if (/Chrome\//i.test(ua) && !/Edg/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (/CriOS\//i.test(ua)) {
    const match = ua.match(/CriOS\/(\d+)/);
    browser = match ? `Chrome iOS ${match[1]}` : 'Chrome iOS';
  } else if (/FxiOS\//i.test(ua)) {
    const match = ua.match(/FxiOS\/(\d+)/);
    browser = match ? `Firefox iOS ${match[1]}` : 'Firefox iOS';
  } else if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (/Version\/(\d+).*Safari/i.test(ua) || (/Safari/i.test(ua) && /Apple/i.test(navigator.vendor))) {
    const match = ua.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  }

  // 3. Detect Device Type (Desktop vs Mobile vs Tablet)
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const isTabletUa = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (os.includes('iPadOS'));
  const isMobileUa = /iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini|webOS/i.test(ua);

  if (isTabletUa || (isTouch && Math.min(width, height) >= 600 && Math.max(width, height) <= 1366)) {
    deviceType = 'Tablet';
  } else if (isMobileUa || (isTouch && Math.min(width, height) < 600)) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  const viewport = `${width}×${height}px`;
  const screenResolution = `${screenWidth}×${screenHeight}px`;

  // Build high-density human readable summary
  const touchTag = isTouch ? 'Touch' : 'Pointer';
  const retinaTag = pixelRatio > 1 ? `@${pixelRatio.toFixed(1)}x` : '';
  const summary = `${deviceType} (${os} · ${browser} · ${viewport} ${retinaTag} · ${touchTag})`
    .replace(/\s+/g, ' ')
    .trim();

  return {
    deviceType,
    os,
    browser,
    screenResolution,
    viewport,
    pixelRatio,
    isTouch,
    orientation,
    summary,
    rawUserAgent: ua,
  };
}
