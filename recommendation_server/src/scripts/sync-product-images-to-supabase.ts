import fs from "fs/promises";

import { IsNull, Repository } from "typeorm";

import { AppDataSource } from "@/config/database.config";
import { Product } from "@/modules/products/entity/product";
import { ProductImage } from "@/modules/products/entity/product-image";
import {
  buildProductImageSyncPlan,
  ProductImageAliasMap,
  ProductImageSyncPlan,
} from "@/scripts/support/supabase-product-image-sync";
import { SupabaseStorageService } from "@/services/supabase-storage.service";

interface ScriptOptions {
  dryRun: boolean;
  aliasFile?: string;
  prefix: string;
}

interface AppliedMatchResult {
  productId: number;
  productName: string;
  fileName: string;
  imageId: number;
  previousUrl: string | null;
  nextUrl: string;
  status: "updated" | "unchanged" | "created";
  matchSource: "exact" | "alias";
}

function parseArgs(argv: string[]): ScriptOptions {
  const args = [...argv];
  let aliasFile: string | undefined;
  let prefix = "images";

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];

    if (current === "--alias-file" && next) {
      aliasFile = next;
      index += 1;
      continue;
    }

    if (current === "--prefix" && next) {
      prefix = next;
      index += 1;
    }
  }

  return {
    dryRun: args.includes("--dry-run"),
    aliasFile,
    prefix,
  };
}

async function readAliasFile(aliasFile?: string): Promise<ProductImageAliasMap> {
  if (!aliasFile) {
    return {};
  }

  const fileContents = await fs.readFile(aliasFile, "utf8");
  const parsed = JSON.parse(fileContents) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Alias file must be a JSON object mapping filenames to product names or ids.");
  }

  return parsed as ProductImageAliasMap;
}

async function loadProducts(productRepository: Repository<Product>): Promise<Product[]> {
  return productRepository.find({
    where: {
      deleted_at: IsNull(),
    },
    relations: ["images"],
    order: {
      id: "ASC",
    },
  });
}

function pickPrimaryImage(images: ProductImage[] | undefined): ProductImage | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }

  return (
    images.find((image) => image.is_primary) ??
    [...images].sort((left, right) => {
      if (left.sort_order !== right.sort_order) {
        return left.sort_order - right.sort_order;
      }

      return left.id - right.id;
    })[0]
  );
}

async function applyPlan(params: {
  plan: ProductImageSyncPlan;
  products: Product[];
  dryRun: boolean;
}): Promise<AppliedMatchResult[]> {
  const allMatches = [...params.plan.exactMatches, ...params.plan.aliasMatches];
  const productById = new Map(params.products.map((product) => [product.id, product]));

  if (params.dryRun) {
    return allMatches.map((match) => {
      const product = productById.get(match.product.id);
      const currentPrimaryImage = pickPrimaryImage(product?.images);

      return {
        productId: match.product.id,
        productName: match.product.name,
        fileName: match.fileName,
        imageId: currentPrimaryImage?.id ?? 0,
        previousUrl: currentPrimaryImage?.image_url ?? null,
        nextUrl: match.publicUrl,
        status: currentPrimaryImage ? (currentPrimaryImage.image_url === match.publicUrl ? "unchanged" : "updated") : "created",
        matchSource: match.matchSource,
      };
    });
  }

  return AppDataSource.transaction(async (manager) => {
    const productImageRepository = manager.getRepository(ProductImage);
    const appliedResults: AppliedMatchResult[] = [];

    for (const match of allMatches) {
      const product = productById.get(match.product.id);
      if (!product) {
        continue;
      }

      let currentPrimaryImage = pickPrimaryImage(product.images);
      let status: AppliedMatchResult["status"];
      const previousUrl = currentPrimaryImage?.image_url ?? null;

      if (!currentPrimaryImage) {
        currentPrimaryImage = productImageRepository.create({
          product_id: product.id,
          image_url: match.publicUrl,
          thumbnail_url: match.publicUrl,
          alt_text: product.name,
          sort_order: 0,
          is_primary: true,
        });
        status = "created";
      } else if (currentPrimaryImage.image_url === match.publicUrl) {
        currentPrimaryImage.thumbnail_url = currentPrimaryImage.thumbnail_url ?? match.publicUrl;
        currentPrimaryImage.alt_text = currentPrimaryImage.alt_text ?? product.name;
        currentPrimaryImage.is_primary = true;
        status = "unchanged";
      } else {
        currentPrimaryImage.image_url = match.publicUrl;
        currentPrimaryImage.thumbnail_url = match.publicUrl;
        currentPrimaryImage.alt_text = product.name;
        currentPrimaryImage.is_primary = true;
        status = "updated";
      }

      const savedImage = await productImageRepository.save(currentPrimaryImage);

      if (!product.images) {
        product.images = [];
      }

      if (!product.images.some((image) => image.id === savedImage.id)) {
        product.images.push(savedImage);
      } else {
        product.images = product.images.map((image) => (image.id === savedImage.id ? savedImage : image));
      }

      appliedResults.push({
        productId: product.id,
        productName: product.name,
        fileName: match.fileName,
        imageId: savedImage.id,
        previousUrl,
        nextUrl: match.publicUrl,
        status,
        matchSource: match.matchSource,
      });
    }

    return appliedResults;
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const aliases = await readAliasFile(options.aliasFile);
  const storageService = new SupabaseStorageService();

  await AppDataSource.initialize();

  try {
    const productRepository = AppDataSource.getRepository(Product);
    const products = await loadProducts(productRepository);
    const storageObjects = await storageService.listObjects({ prefix: options.prefix, limit: 200, offset: 0 });

    const plan = buildProductImageSyncPlan({
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
      })),
      objects: storageObjects.map((object) => ({
        fileName: object.name,
        storagePath: `${options.prefix}/${object.name}`,
        publicUrl: storageService.getPublicUrl(`${options.prefix}/${object.name}`),
      })),
      aliases,
    });

    const appliedResults = await applyPlan({
      plan,
      products,
      dryRun: options.dryRun,
    });

    const summary = {
      dryRun: options.dryRun,
      totalStorageObjects: storageObjects.length,
      exactMatchCount: plan.exactMatches.length,
      aliasMatchCount: plan.aliasMatches.length,
      ambiguousCount: plan.ambiguousMatches.length,
      unmatchedCount: plan.unmatchedObjects.length,
      updatedCount: appliedResults.filter((result) => result.status === "updated").length,
      createdCount: appliedResults.filter((result) => result.status === "created").length,
      unchangedCount: appliedResults.filter((result) => result.status === "unchanged").length,
      changedProducts: appliedResults,
      ambiguousObjects: plan.ambiguousMatches,
      unmatchedObjects: plan.unmatchedObjects,
    };

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
