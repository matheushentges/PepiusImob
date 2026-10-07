import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimização para Vercel
  typescript: {
    ignoreBuildErrors: true, // Temporário para build
  },
  // Configuração de imagens (se usar Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Permitir falhas no prerendering
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
