export function getOptimizedCloudinaryUrl(url: string, width: number = 500): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  
  // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
  // We want to insert transformations after 'upload/'
  const uploadIndex = url.indexOf('upload/');
  if (uploadIndex === -1) return url;
  
  const beforeUpload = url.substring(0, uploadIndex + 7);
  const afterUpload = url.substring(uploadIndex + 7);
  
  // Add transformations: c_scale,w_{width},q_auto,f_auto
  return `${beforeUpload}c_scale,w_${width},q_auto,f_auto/${afterUpload}`;
}
