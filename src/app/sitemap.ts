import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurora-polaris.ru';
  const currentDate = new Date().toISOString();

  return [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
      alternates: {
        languages: {
          ru: `${baseUrl}/?lang=ru`,
          zh: `${baseUrl}/?lang=zh`,
        },
      },
    },
  ];
}
