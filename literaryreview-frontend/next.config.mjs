/** @type {import('next').NextConfig} */
const repo = process.env.GITHUB_REPOSITORY || ""; // e.g. owner/repo
const [owner, name] = repo.split("/");
const isUserSite = name && name.endsWith(".github.io");
const computedBasePath = isUserSite ? "" : (name ? `/${name}` : "");

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
  // Auto-compute basePath for GitHub Pages
  basePath: computedBasePath || undefined,
  assetPrefix: computedBasePath || undefined,
  // Static export for GitHub Pages
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;


