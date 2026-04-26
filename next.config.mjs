/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oqdqcfllhpbnbyeampjc.supabase.co",
      },
    ],
  },
};

export default nextConfig;
