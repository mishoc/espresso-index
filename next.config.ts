import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // MDX powers the Inequality section's explainers and perspectives.
  pageExtensions: ["ts", "tsx", "md", "mdx"],
};

export default createMDX({})(nextConfig);
