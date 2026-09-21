/** @type {import('next').NextConfig} */
// Local: API_URL / NEXT_PUBLIC_API_URL = http://127.0.0.1:8000
// Vercel: set the same env to the Render API origin (no trailing slash) so /api is rewritten there.
const backend = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/+$/, '');

const nextConfig = {
  // Django routes use trailing slashes; without this, Next 308s POST /api/.../ and the login body is dropped.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: `${backend}/api/:path*/`,
      },
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*/`,
      },
    ];
  },
};

module.exports = nextConfig;
