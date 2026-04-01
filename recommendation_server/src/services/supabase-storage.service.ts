import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadedEnv } from "@/config/load-env";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";

type UploadResult = {
  path: string;
  publicUrl: string;
};

export type SupabaseStorageObject = {
  name: string;
  id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_accessed_at?: string | null;
  metadata?: unknown;
};

type ListObjectsOptions = {
  prefix?: string;
  limit?: number;
  offset?: number;
};

export class SupabaseStorageService {
  private client: SupabaseClient | null = null;

  private get bucketName(): string {
    return loadedEnv.supabase.productImagesBucket;
  }

  private getClient(): SupabaseClient {
    if (!loadedEnv.supabase.url || !loadedEnv.supabase.serviceRoleKey) {
      throw new AppError(
        "Supabase Storage is not configured",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR,
      );
    }

    if (!this.client) {
      this.client = createClient(loadedEnv.supabase.url, loadedEnv.supabase.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return this.client;
  }

  async uploadProductImage(productId: number, file: Express.Multer.File): Promise<UploadResult> {
    const client = this.getClient();
    const filePath = this.buildProductImagePath(productId, file);

    const { data, error } = await client.storage
      .from(this.bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error || !data) {
      throw new AppError(
        error?.message || "Failed to upload product image to Supabase Storage",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR,
      );
    }

    const { data: publicUrlData } = client.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    };
  }

  async deleteProductImageByPublicUrl(publicUrl: string): Promise<void> {
    const client = this.getClient();
    const storagePath = this.extractStoragePathFromPublicUrl(publicUrl);
    if (!storagePath) {
      return;
    }

    const { error } = await client.storage
      .from(this.bucketName)
      .remove([storagePath]);

    if (error) {
      throw new AppError(
        error.message || "Failed to delete product image from Supabase Storage",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR,
      );
    }
  }

  async listObjects(options: ListObjectsOptions = {}): Promise<SupabaseStorageObject[]> {
    const client = this.getClient();
    const prefix = options.prefix ?? "images";
    const limit = options.limit ?? 100;
    const offset = options.offset ?? 0;

    const { data, error } = await client.storage
      .from(this.bucketName)
      .list(prefix, {
        limit,
        offset,
        sortBy: {
          column: "name",
          order: "asc",
        },
      });

    if (error) {
      throw new AppError(
        error.message || "Failed to list Supabase Storage objects",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        ErrorCode.SERVER_ERROR,
      );
    }

    return (data ?? [])
      .filter((entry) => typeof entry.name === "string" && entry.name.length > 0)
      .map((entry) => ({
        name: entry.name,
        id: entry.id ?? null,
        created_at: entry.created_at ?? null,
        updated_at: entry.updated_at ?? null,
        last_accessed_at: entry.last_accessed_at ?? null,
        metadata: entry.metadata ?? undefined,
      }));
  }

  getPublicUrl(path: string): string {
    const client = this.getClient();
    const { data } = client.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  private buildProductImagePath(productId: number, file: Express.Multer.File): string {
    const extension = this.resolveExtension(file);
    const baseName = this.sanitizeFileName(path.parse(file.originalname).name || "product-image");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    return `products/${productId}/${timestamp}-${baseName}${extension}`;
  }

  private resolveExtension(file: Express.Multer.File): string {
    const originalExtension = path.extname(file.originalname || "").toLowerCase();
    if (originalExtension) {
      return originalExtension;
    }

    const mimeToExtension: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/svg+xml": ".svg",
    };

    return mimeToExtension[file.mimetype] ?? ".bin";
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

  private extractStoragePathFromPublicUrl(publicUrl: string): string | null {
    const marker = `/storage/v1/object/public/${this.bucketName}/`;
    const index = publicUrl.indexOf(marker);
    if (index === -1) {
      return null;
    }

    return publicUrl.slice(index + marker.length);
  }
}

export default new SupabaseStorageService();
