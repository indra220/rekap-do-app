/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mengizinkan akses Hot Module Replacement (HMR) dari IP lokal untuk Electron
  allowedDevOrigins: [
    '127.0.0.1',
    '192.168.1.13',
    'localhost'
  ],
  
  // Jika Anda sudah memiliki konfigurasi nextConfig lainnya sebelumnya, 
  // Anda bisa menggabungkannya di dalam object ini.
};

export default nextConfig;