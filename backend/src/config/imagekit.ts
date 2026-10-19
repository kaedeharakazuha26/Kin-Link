import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

let imagekit: ImageKit | null = null;

if (publicKey && privateKey && urlEndpoint) {
  imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
  console.log('✅ ImageKit initialized successfully');
} else {
  console.warn('⚠️ ImageKit credentials not fully provided. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in .env.');
}

export { imagekit };
