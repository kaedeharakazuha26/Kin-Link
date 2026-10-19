import multer from 'multer';
import { imagekit } from '../config/imagekit';
import path from 'path';
import sharp from 'sharp';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max
  },
});

export const uploadFile = async (
  file: Express.Multer.File,
  folder: 'posts' | 'stories' | 'profiles' | 'chat'
): Promise<string> => {
  try {
    let uploadBuffer = file.buffer;
    let uploadMimetype = file.mimetype;
    let originalName = file.originalname;

    // Automatic compression for images to save bandwidth and storage
    if (file.mimetype.startsWith('image/') && !file.mimetype.includes('svg')) {
      try {
        const compressed = await sharp(file.buffer)
          .rotate() // preserve EXIF orientation
          .resize({
            width: 1600,
            height: 1600,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();

        uploadBuffer = compressed;
        uploadMimetype = 'image/webp';
        originalName = `${path.parse(file.originalname).name}.webp`;
      } catch (sharpError) {
        console.warn('Image compression skipped, using original:', sharpError);
      }
    }

    if (imagekit) {
      const ext = path.extname(originalName) || (uploadMimetype === 'image/webp' ? '.webp' : '.jpg');
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

      const response = await imagekit.upload({
        file: uploadBuffer,
        fileName: filename,
        folder: `/link/${folder}`,
        useUniqueFileName: true,
      });

      return response.url;
    }

    // Fallback if ImageKit keys are not set yet
    console.warn(`⚠️ ImageKit not configured, using base64 inline fallback for ${file.originalname}`);
    const base64 = uploadBuffer.toString('base64');
    return `data:${uploadMimetype};base64,${base64}`;
  } catch (error) {
    console.error('Upload error, using inline fallback:', error);
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }
};

export const uploadFileToFirebase = uploadFile;
