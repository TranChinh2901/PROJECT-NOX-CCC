import path from "path";

import cloudinary from "@/config/cloudinary-config";
import { loadedEnv } from "@/config/load-env";
import { AppError } from "@/common/error.response";
import { HttpStatusCode } from "@/constants/status-code";
import { ErrorCode } from "@/constants/error-code";
import { normalizeProductImageKey } from "@/scripts/support/supabase-product-image-sync";

const CLOUDINARY_HOSTNAME = "res.cloudinary.com";
const CLOUDINARY_MAX_RESULTS = 500;
const PRODUCT_IMAGE_LIBRARY_FOLDER = "library";
const PRODUCT_IMAGE_SEED_FOLDER = "seed/products";

export type CloudinaryListedAsset = {
  publicId: string;
  secureUrl: string;
  format?: string | null;
};

function assertCloudinaryProductImageConfig(): void {
  if (loadedEnv.cloudinary.name && loadedEnv.cloudinary.key && loadedEnv.cloudinary.secret) {
    return;
  }

  throw new AppError(
    "Cloudinary product image storage is not configured",
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    ErrorCode.SERVER_ERROR,
  );
}

function sanitizePublicIdSegment(value: string): string {
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

function resolveSourceFileStem(sourceUrl: string, fallback: string): string {
  try {
    const parsedUrl = new URL(sourceUrl);
    const fileName = path.posix.basename(parsedUrl.pathname);
    const stem = path.posix.parse(fileName).name;
    return sanitizePublicIdSegment(stem || fallback);
  } catch {
    return sanitizePublicIdSegment(fallback);
  }
}

export function getCloudinaryProductImagesRoot(): string {
  assertCloudinaryProductImageConfig();
  return loadedEnv.cloudinary.productImagesFolder;
}

export function getCloudinaryProductImageLibraryPrefix(): string {
  return `${getCloudinaryProductImagesRoot()}/${PRODUCT_IMAGE_LIBRARY_FOLDER}`;
}

export function getCloudinaryProductImageSeedPrefix(): string {
  return `${getCloudinaryProductImagesRoot()}/${PRODUCT_IMAGE_SEED_FOLDER}`;
}

export function buildCloudinaryBackfillPublicId(input: {
  imageId: number;
  productId: number;
  sourceUrl: string;
  altText?: string | null;
}): string {
  const baseFolder = `${getCloudinaryProductImagesRoot()}/${input.productId}`;
  const fallbackStem = input.altText || `image-${input.imageId}`;
  const sourceStem = resolveSourceFileStem(input.sourceUrl, fallbackStem);

  return `${baseFolder}/backfill-${input.imageId}-${sourceStem}`;
}

export function buildCloudinarySeedAssetPublicId(family: string, view: number): string {
  return `${getCloudinaryProductImageSeedPrefix()}/${family}/view-${view + 1}`;
}

export function buildCloudinaryLibraryPublicId(fileName: string): string {
  const parsed = path.parse(fileName);
  const baseName = sanitizePublicIdSegment(parsed.name || fileName);
  return `${getCloudinaryProductImageLibraryPrefix()}/${baseName}`;
}

export function buildCloudinaryAssetUrl(publicId: string, format?: string): string {
  assertCloudinaryProductImageConfig();
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    format,
  });
}

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).hostname === CLOUDINARY_HOSTNAME;
  } catch {
    return false;
  }
}

export function isCloudinarySeedUrl(url: string | null | undefined): boolean {
  return (url ?? "").includes(`/${getCloudinaryProductImageSeedPrefix()}/`);
}

function normalizePublicIdKey(publicId: string): string {
  return normalizeProductImageKey(path.posix.basename(publicId));
}

export function buildCloudinaryAssetIndex(assets: CloudinaryListedAsset[]): Map<string, string[]> {
  const urlsByNormalizedName = new Map<string, string[]>();

  for (const asset of assets) {
    const normalizedName = normalizePublicIdKey(asset.publicId);
    const existing = urlsByNormalizedName.get(normalizedName) ?? [];
    existing.push(asset.secureUrl);
    existing.sort((left, right) => left.localeCompare(right));
    urlsByNormalizedName.set(normalizedName, existing);
  }

  return urlsByNormalizedName;
}

export async function listCloudinaryAssetsByPrefix(prefix: string): Promise<CloudinaryListedAsset[]> {
  assertCloudinaryProductImageConfig();

  const assets: CloudinaryListedAsset[] = [];
  let nextCursor: string | undefined;

  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: CLOUDINARY_MAX_RESULTS,
      next_cursor: nextCursor,
    } as Record<string, string | number | undefined>);

    const resources = Array.isArray(result.resources) ? result.resources : [];

    for (const resource of resources) {
      if (!resource?.public_id || !resource?.secure_url) {
        continue;
      }

      assets.push({
        publicId: resource.public_id,
        secureUrl: resource.secure_url,
        format: resource.format ?? null,
      });
    }

    nextCursor = typeof result.next_cursor === "string" ? result.next_cursor : undefined;
  } while (nextCursor);

  return assets;
}

export async function uploadRemoteImageToCloudinary(input: {
  sourceUrl: string;
  publicId: string;
  overwrite?: boolean;
  tags?: string[];
}): Promise<{ publicId: string; secureUrl: string }> {
  assertCloudinaryProductImageConfig();

  const result = await cloudinary.uploader.upload(input.sourceUrl, {
    public_id: input.publicId,
    resource_type: "image",
    overwrite: input.overwrite ?? true,
    invalidate: true,
    tags: input.tags,
    use_filename: false,
    unique_filename: false,
  });

  if (!result.secure_url || !result.public_id) {
    throw new AppError(
      "Cloudinary did not return a secure URL for the migrated product image",
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR,
    );
  }

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}

export async function uploadSvgToCloudinary(input: {
  publicId: string;
  svg: string;
  overwrite?: boolean;
  tags?: string[];
}): Promise<{ publicId: string; secureUrl: string }> {
  assertCloudinaryProductImageConfig();

  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(input.svg, "utf8").toString("base64")}`;
  const result = await cloudinary.uploader.upload(svgDataUri, {
    public_id: input.publicId,
    resource_type: "image",
    format: "svg",
    overwrite: input.overwrite ?? true,
    invalidate: true,
    tags: input.tags,
    use_filename: false,
    unique_filename: false,
  });

  if (!result.secure_url || !result.public_id) {
    throw new AppError(
      "Cloudinary did not return a secure URL for the seeded product image",
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR,
    );
  }

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
  };
}
