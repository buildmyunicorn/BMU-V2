import { Metadata } from 'next';
import MediaKitClientPage from './media-kit-client-page';

export const metadata: Metadata = {
  title: 'Media Kit & Brand Assets | Startup Preflight',
  description:
    'Official brand assets, logos, high-resolution product screenshots, founder bio, and editorial guidelines for Startup Preflight press and partner coverage.',
  openGraph: {
    title: 'Media Kit & Brand Assets | Startup Preflight',
    description:
      'Official brand assets, logos, product screenshots, and founder bio for press, podcasts, and ecosystem partners.',
    url: 'https://startuppreflight.com/media-kit',
    siteName: 'Startup Preflight',
    images: [
      {
        url: '/appsumo-assets/01-hero-headline-1920x1080.png',
        width: 1920,
        height: 1080,
        alt: 'Startup Preflight Media Kit & Brand Assets',
      },
    ],
  },
};

export default function MediaKitPage() {
  return <MediaKitClientPage />;
}
