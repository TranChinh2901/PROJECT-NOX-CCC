import fs from "fs/promises";
import path from "path";

import { Repository } from "typeorm";

import { AppDataSource } from "@/config/database.config";
import { ProductImage } from "@/modules/products/entity/product-image";
import {
  buildCloudinaryBackfillPublicId,
  buildCloudinaryAssetUrl,
  isCloudinaryUrl,
  uploadRemoteImageToCloudinary,
} from "@/scripts/support/cloudinary-product-image-assets";

type ScriptOptions = {
  dryRun: boolean;
  imageId?: number;
  productId?: number;
  limit?: number;
  manifestFile?: string;
};

type BackfillRecord = {
  imageId: number;
  productId: number;
  previousImageUrl: string;
  previousThumbnailUrl: string | null;
  targetPublicId: string;
  nextUrl: string;
  status: "dry_run" | "updated" | "skipped_already_cloudinary" | "skipped_missing_source";
};

function parseNumberFlag(value: string | undefined, flagName: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flagName} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(argv: string[]): ScriptOptions {
  const args = [...argv];
  let imageId: number | undefined;
  let productId: number | undefined;
  let limit: number | undefined;
  let manifestFile: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];

    if (current === "--image-id") {
      imageId = parseNumberFlag(next, "--image-id");
      index += 1;
      continue;
    }

    if (current === "--product-id") {
      productId = parseNumberFlag(next, "--product-id");
      index += 1;
      continue;
    }

    if (current === "--limit") {
      limit = parseNumberFlag(next, "--limit");
      index += 1;
      continue;
    }

    if (current === "--manifest-file" && next) {
      manifestFile = next;
      index += 1;
    }
  }

  return {
    dryRun: args.includes("--dry-run"),
    imageId,
    productId,
    limit,
    manifestFile,
  };
}

async function loadProductImages(
  productImageRepository: Repository<ProductImage>,
  options: ScriptOptions,
): Promise<ProductImage[]> {
  const query = productImageRepository
    .createQueryBuilder("image")
    .where("image.deleted_at IS NULL")
    .orderBy("image.id", "ASC");

  if (options.imageId !== undefined) {
    query.andWhere("image.id = :imageId", { imageId: options.imageId });
  }

  if (options.productId !== undefined) {
    query.andWhere("image.product_id = :productId", { productId: options.productId });
  }

  if (options.limit !== undefined) {
    query.take(options.limit);
  }

  return query.getMany();
}

function resolveManifestPath(manifestFile: string | undefined): string {
  if (manifestFile) {
    return path.resolve(process.cwd(), manifestFile);
  }

  return path.resolve(process.cwd(), "product-image-cloudinary-backfill-manifest.json");
}

function createTargetRecord(image: ProductImage): Omit<BackfillRecord, "status"> {
  const targetPublicId = buildCloudinaryBackfillPublicId({
    imageId: image.id,
    productId: image.product_id,
    sourceUrl: image.image_url,
    altText: image.alt_text,
  });

  return {
    imageId: image.id,
    productId: image.product_id,
    previousImageUrl: image.image_url,
    previousThumbnailUrl: image.thumbnail_url ?? null,
    targetPublicId,
    nextUrl: buildCloudinaryAssetUrl(targetPublicId),
  };
}

async function applyBackfill(
  productImageRepository: Repository<ProductImage>,
  images: ProductImage[],
  options: ScriptOptions,
): Promise<BackfillRecord[]> {
  const records: BackfillRecord[] = [];

  for (const image of images) {
    if (!image.image_url) {
      records.push({
        ...createTargetRecord({
          ...image,
          image_url: `missing-source-${image.id}`,
        } as ProductImage),
        previousImageUrl: image.image_url,
        status: "skipped_missing_source",
      });
      continue;
    }

    if (isCloudinaryUrl(image.image_url)) {
      records.push({
        ...createTargetRecord(image),
        nextUrl: image.image_url,
        status: "skipped_already_cloudinary",
      });
      continue;
    }

    const target = createTargetRecord(image);

    if (options.dryRun) {
      records.push({
        ...target,
        status: "dry_run",
      });
      continue;
    }

    const uploadResult = await uploadRemoteImageToCloudinary({
      sourceUrl: image.image_url,
      publicId: target.targetPublicId,
      overwrite: true,
      tags: [`product:${image.product_id}`, "product-image", "product-image-backfill"],
    });

    image.image_url = uploadResult.secureUrl;
    image.thumbnail_url = uploadResult.secureUrl;
    await productImageRepository.save(image);

    records.push({
      ...target,
      nextUrl: uploadResult.secureUrl,
      status: "updated",
    });
  }

  return records;
}

async function writeManifest(manifestPath: string, summary: unknown): Promise<void> {
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, JSON.stringify(summary, null, 2), "utf8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath = resolveManifestPath(options.manifestFile);

  await AppDataSource.initialize();

  try {
    const productImageRepository = AppDataSource.getRepository(ProductImage);
    const images = await loadProductImages(productImageRepository, options);
    const records = await applyBackfill(productImageRepository, images, options);

    const summary = {
      dryRun: options.dryRun,
      totalRowsScanned: images.length,
      updatedCount: records.filter((record) => record.status === "updated").length,
      dryRunCount: records.filter((record) => record.status === "dry_run").length,
      skippedAlreadyCloudinaryCount: records.filter((record) => record.status === "skipped_already_cloudinary").length,
      skippedMissingSourceCount: records.filter((record) => record.status === "skipped_missing_source").length,
      manifestFile: manifestPath,
      records,
    };

    await writeManifest(manifestPath, summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
