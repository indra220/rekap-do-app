import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Wajib untuk Electron (Static Export)
  images: {
    unoptimized: true, // Wajib karena tidak ada server Image Optimization di Electron
  },
};

export default nextConfig;