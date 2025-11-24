/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    basePath: '/taskclearers-landing',
    trailingSlash: true,
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
        ],
    },
};

module.exports = nextConfig;