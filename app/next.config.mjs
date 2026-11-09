import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@allowance/shared"],
  outputFileTracingRoot: root,
};

export default nextConfig;
