import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export', // Bu satırı ekle
  images: {
    unoptimized: true, // Statik export (Nginx) için bu gereklidir
  },
};

export default nextConfig;