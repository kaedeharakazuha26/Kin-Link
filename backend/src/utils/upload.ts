import multer from 'multer';
import { imagekit } from '../config/imagekit';
import path from 'path';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
});

export const uploadFile = async (
  file: Express.Multer.File,
  folder: 'posts' | 'stories' | 'profiles' | 'chat'
): Promise<string> => {
  try {
    if (imagekit) {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

      const response = await imagekit.upload({
        file: file.buffer,
        fileName: filename,
        folder: `/kinlink/${folder}`,
        useUniqueFileName: true,
      });

      return response.url;
    }

    // Fallback if ImageKit keys are not provided yet in .env
    console.warn(`⚠️ ImageKit not configured, using base64 inline fallback for ${file.originalname}`);
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  } catch (error) {
    console.error('ImageKit upload error, using inline fallback:', error);
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }
};

// Alias for backwards compatibility
export const uploadFileToFirebase = uploadFile;
