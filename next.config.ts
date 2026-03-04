import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "*.ngrok-free.app"],
  /* config options here */
};

export default nextConfig;
