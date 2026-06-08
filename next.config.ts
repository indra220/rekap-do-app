/** @type {import('next').NextConfig} */
const nextConfig = {
  // WAJIB UNTUK ELECTRON: 
  // Memaksa Next.js untuk mem-build file menjadi HTML statis di dalam folder 'out'
  output: 'export',
  
  // Wajib ditambahkan saat menggunakan output: 'export' 
  // karena fitur optimasi gambar bawaan server Next.js tidak didukung pada mode statis desktop
  images: {
    unoptimized: true,
  },

  // Mengizinkan akses Hot Module Replacement (HMR) dari IP lokal untuk Electron
  allowedDevOrigins: [
    '127.0.0.1',
    '192.168.1.13',
    'localhost'
  ],
};

export default nextConfig;