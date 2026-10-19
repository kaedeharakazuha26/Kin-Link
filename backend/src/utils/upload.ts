import multer from 'multer';
import { bucket } from '../config/firebase';
import path from 'path';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
});

export const uploadFileToFirebase = async (
  file: Express.Multer.File,
  folder: 'posts' | 'stories' | 'profiles' | 'chat'
): Promise<string> => {
  try {
    if (!bucket || !bucket.name) {
      // Fallback if Firebase storage bucket isn't configured yet
      const base64 = file.buffer.toString('base64');
      return `data:${file.mimetype};base64,${base64}`;
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    const fileRef = bucket.file(filename);

    await fileRef.save(file.buffer, {
      contentType: file.mimetype,
      public: true,
      metadata: {
        firebaseStorageDownloadTokens: Date.now().toString(),
      },
    });

    // Make public and get public URL
    try {
      await fileRef.makePublic();
    } catch (e) {
      // some buckets have uniform bucket-level access
    }

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  } catch (error) {
    console.error('File upload error, using inline fallback:', error);
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
  }
};
