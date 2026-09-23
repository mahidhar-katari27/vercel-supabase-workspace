import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Pin the tracing root to this app. Without it Next.js walks upward, finds a
  // second lockfile in the workspace parent and infers the wrong root — which
  // changes what gets traced into the serverless bundle on deploy.
  outputFileTracingRoot: here,

  images: {
    // Demo imagery is generated as inline SVG/data URIs, so no remote loader
    // is required. Kept permissive in case real photos are added later.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
}

export default nextConfig
