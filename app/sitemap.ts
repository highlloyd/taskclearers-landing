import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://taskclearers.com';
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Since this is currently a single-page landing site, we only list the root.
    // If multiple pages are added later (e.g., /services, /about), they should be added here.
  ];
}