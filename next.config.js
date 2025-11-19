// next.config.js at your Next.js project root
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Your backend routes
      },
    ]
  },
}
export default nextConfig;
