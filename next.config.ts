import type { NextConfig } from "next";

// Las imágenes subidas desde el panel se sirven desde el bucket público de dbm
// (S3_PUBLIC_BASE_URL, p. ej. https://calandrias.web.bautygarcia.com).
const publicImageHost = process.env.S3_PUBLIC_BASE_URL
  ? new URL(process.env.S3_PUBLIC_BASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: publicImageHost
      ? [{ protocol: 'https', hostname: publicImageHost }]
      : [],
  },
};

export default nextConfig;
