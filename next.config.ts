import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "*.ngrok-free.app"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  /* config options here */
};

export default nextConfig;
