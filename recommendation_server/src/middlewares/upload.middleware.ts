import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '@/config/cloudinary-config';
import { AppError } from '@/common/error.response';
import { HttpStatusCode } from '@/constants/status-code';
import { ErrorCode } from '@/constants/error-code';

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user-avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    public_id: (req: Request, avatar: Express.Multer.File) => {
      return `avatar_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    }
  } as any
});



const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Only image files are allowed',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      ),
      false
    );
  }
};



export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 //2mb
  }
});


