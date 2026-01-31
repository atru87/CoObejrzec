/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  // Wyłącz strict mode dla lepszej kompatybilności z Zustand
  reactStrictMode: true,
}

module.exports = nextConfig
