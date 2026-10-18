import type { Metadata } from 'next';
import { PreviewClient } from './preview-client';
import './preview.css';

export const metadata: Metadata = {
  title: 'Просмотр мобильной и компьютерной версии · Aurora Polaris',
  robots: { index: false, follow: false },
  alternates: { canonical: '/preview' },
};

export default function PreviewPage() {
  return <PreviewClient />;
}
