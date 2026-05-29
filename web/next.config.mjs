/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // RainbowKit / WalletConnect pull in optional native deps we don't use.
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
