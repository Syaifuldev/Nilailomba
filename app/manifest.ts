import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIMPATI MAPSI',
    short_name: 'SIMPATI',
    description: 'Sistem Informasi Manajemen Penilaian Terintegrasi MAPSI',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#f8fafc',
    icons: [
      {
        src: '/logo-sm.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-sm.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
