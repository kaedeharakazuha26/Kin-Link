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

export interface UploadResult {
  url: string;
  fileId?: string;
}

export const uploadFileDetailed = async (
  file: Express.Multer.File,
  folder: 'posts' | 'stories' | 'profiles' | 'chat'
): Promise<UploadResult> => {
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

    if (!imagekit) {
      throw new Error('ImageKit storage is not configured.');
    }

    const ext = path.extname(originalName) || (uploadMimetype === 'image/webp' ? '.webp' : '.jpg');
    const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    const response = await imagekit.upload({
      file: uploadBuffer,
      fileName: filename,
      folder: `/link/${folder}`,
      useUniqueFileName: true,
    });

    return {
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error: any) {
    console.error('Upload failed:', error?.message || error);
    throw new Error('Failed to upload file to storage.');
  }
};

export const uploadFile = async (
  file: Express.Multer.File,
  folder: 'posts' | 'stories' | 'profiles' | 'chat'
): Promise<string> => {
  const result = await uploadFileDetailed(file, folder);
  return result.url;
};

export const deleteFileFromImageKit = async (fileIdOrUrl: string): Promise<boolean> => {
  if (!imagekit || !fileIdOrUrl) return false;
  try {
    // If it's directly a fileId
    if (!fileIdOrUrl.startsWith('http://') && !fileIdOrUrl.startsWith('https://')) {
      await imagekit.deleteFile(fileIdOrUrl);
      console.log(`🗑️ Deleted file from ImageKit by fileId: ${fileIdOrUrl}`);
      return true;
    }

    // If it's a URL, search by filename and delete
    try {
      const urlObj = new URL(fileIdOrUrl);
      const filename = path.basename(urlObj.pathname);
      const files = await imagekit.listFiles({
        searchQuery: `name = "${filename}"`,
        limit: 1,
      });

      if (files && files.length > 0 && (files[0] as any).fileId) {
        const fileId = (files[0] as any).fileId;
        await imagekit.deleteFile(fileId);
        console.log(`🗑️ Deleted file from ImageKit: ${fileId} (${filename})`);
        return true;
      }
    } catch (urlErr) {
      console.warn('Could not parse ImageKit URL for deletion:', urlErr);
    }
    return false;
  } catch (error) {
    console.error('Failed to delete file from ImageKit:', error);
    return false;
  }
};

export const uploadFileToFirebase = uploadFile;

