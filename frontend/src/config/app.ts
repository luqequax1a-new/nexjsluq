export const APP_CONFIG = {
  name: 'Fabric Market',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://yourstore.com',
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};
