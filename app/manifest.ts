import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Kaily - Family Vault',
    short_name: 'The Kaily',
    description: 'Lưu giữ những kỷ niệm quý giá của gia đình.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcf9f6',
    theme_color: '#d4bba3',
    icons: [
      {
        src: 'https://res.cloudinary.com/demo/image/upload/w_192,h_192,c_fill/sample.jpg', // Placeholder icon
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://res.cloudinary.com/demo/image/upload/w_512,h_512,c_fill/sample.jpg', // Placeholder icon
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
