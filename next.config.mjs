/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oqdqcfllhpbnbyeampjc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
