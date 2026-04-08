import path from "path";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

import cloudinary from "@/config/cloudinary-config";
import { loadedEnv } from "@/config/load-env";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";

type UploadResult = {
  publicId: string;
  secureUrl: string;
};

export class CloudinaryProductImageService {
  private get baseFolder(): string {
    return loadedEnv.cloudinary.productImagesFolder;
  }

  async uploadProductImage(productId: number, file: Express.Multer.File): Promise<UploadResult> {
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.buildProductFolder(productId),
          public_id: this.buildPublicId(file),
          resource_type: "image",
          overwrite: false,
          invalidate: true,
          tags: [`product:${productId}`, "product-image"],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    }).catch((error: UploadApiErrorResponse | undefined) => {
      throw new AppError(
        error?.message || "Failed to upload product image to Cloudinary",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR,
      );
    });

    return {
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
    };
  }

  async deleteProductImageByUrl(publicUrl: string): Promise<void> {
    const publicId = this.extractPublicIdFromUrl(publicUrl);

    if (!publicId) {
      throw new AppError(
        "Unsupported Cloudinary product image URL",
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    if (result.result !== "ok") {
      throw new AppError(
        `Failed to delete product image from Cloudinary: ${result.result}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR,
      );
    }
  }

  isCloudinaryUrl(publicUrl: string): boolean {
    try {
      const parsedUrl = new URL(publicUrl);
      return parsedUrl.hostname === "res.cloudinary.com";
    } catch {
      return false;
    }
  }

  private buildProductFolder(productId: number): string {
    return `${this.baseFolder}/${productId}`;
  }

  private buildPublicId(file: Express.Multer.File): string {
    const baseName = this.sanitizeFileName(path.parse(file.originalname).name || "product-image");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return `${timestamp}-${baseName}`;
  }

  private sanitizeFileName(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "product-image";
  }

  private extractPublicIdFromUrl(publicUrl: string): string | null {
    try {
      const parsedUrl = new URL(publicUrl);
      if (parsedUrl.hostname !== "res.cloudinary.com") {
        return null;
      }

      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const uploadIndex = segments.indexOf("upload");

      if (uploadIndex === -1 || uploadIndex === segments.length - 1) {
        return null;
      }

      const assetSegments = segments.slice(uploadIndex + 1);
      const versionIndex = assetSegments.findIndex((segment) => /^v\d+$/.test(segment));
      const publicIdSegments = versionIndex >= 0 ? assetSegments.slice(versionIndex + 1) : assetSegments;

      if (publicIdSegments.length === 0) {
        return null;
      }

      const lastSegment = publicIdSegments[publicIdSegments.length - 1];
      const extensionIndex = lastSegment.lastIndexOf(".");
      publicIdSegments[publicIdSegments.length - 1] =
        extensionIndex >= 0 ? lastSegment.slice(0, extensionIndex) : lastSegment;

      return publicIdSegments.join("/");
    } catch {
      return null;
    }
  }
}

export default new CloudinaryProductImageService();
