import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TactLink Absensi',
    short_name: 'TactLink',
    description: 'Aplikasi Absensi & Manajemen Internal TactLink',
    start_url: '/absen-kantor',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#1E3A8A',
    icons: [
      {
        src: '/logo/LOGO TACTLINK.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo/LOGO TACTLINK.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
