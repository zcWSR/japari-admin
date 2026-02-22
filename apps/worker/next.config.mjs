import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
};

initOpenNextCloudflareForDev();

export default nextConfig;
