export interface ProductImageSyncProduct {
  id: number;
  name: string;
}

export interface ProductImageSyncObject {
  fileName: string;
  storagePath: string;
  publicUrl: string;
}

export type ProductImageAliasTarget = number | string | Array<number | string>;
export type ProductImageAliasMap = Record<string, ProductImageAliasTarget>;

export interface PlannedImageMatch {
  fileName: string;
  storagePath: string;
  publicUrl: string;
  normalizedFileName: string;
  product: ProductImageSyncProduct;
  matchSource: "exact" | "alias";
}

export interface AmbiguousImageMatch {
  fileName: string;
  storagePath: string;
  normalizedFileName: string;
  candidateProducts: ProductImageSyncProduct[];
  reason: "duplicate_product_name" | "alias_target_ambiguous";
}

export interface UnmatchedImageMatch {
  fileName: string;
  storagePath: string;
  normalizedFileName: string;
  reason: "no_exact_match" | "alias_target_missing";
}

export interface ProductImageSyncPlan {
  exactMatches: PlannedImageMatch[];
  aliasMatches: PlannedImageMatch[];
  ambiguousMatches: AmbiguousImageMatch[];
  unmatchedObjects: UnmatchedImageMatch[];
}

const normalizeAliasKey = (value: string) => normalizeProductImageKey(value.replace(/\.[^.]+$/, ""));

export function normalizeProductImageKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildProductImageSyncPlan(input: {
  products: ProductImageSyncProduct[];
  objects: ProductImageSyncObject[];
  aliases?: ProductImageAliasMap;
}): ProductImageSyncPlan {
  const aliases = input.aliases ?? {};
  const productsByNormalizedName = new Map<string, ProductImageSyncProduct[]>();
  const productsById = new Map<number, ProductImageSyncProduct>();

  for (const product of input.products) {
    const normalizedName = normalizeProductImageKey(product.name);
    const group = productsByNormalizedName.get(normalizedName) ?? [];
    group.push(product);
    productsByNormalizedName.set(normalizedName, group);
    productsById.set(product.id, product);
  }

  const exactMatches: PlannedImageMatch[] = [];
  const aliasMatches: PlannedImageMatch[] = [];
  const ambiguousMatches: AmbiguousImageMatch[] = [];
  const unmatchedObjects: UnmatchedImageMatch[] = [];

  for (const object of input.objects) {
    const normalizedFileName = normalizeAliasKey(object.fileName);
    const aliasTarget = aliases[normalizedFileName];

    if (aliasTarget !== undefined) {
      const aliasTargets = Array.isArray(aliasTarget) ? aliasTarget : [aliasTarget];
      const resolvedTargets = aliasTargets.flatMap((target) => {
        if (typeof target === "number") {
          const product = productsById.get(target);
          return product ? [product] : [];
        }

        return productsByNormalizedName.get(normalizeProductImageKey(target)) ?? [];
      });

      const uniqueResolvedTargets = Array.from(
        new Map(resolvedTargets.map((product) => [product.id, product])).values(),
      );

      if (uniqueResolvedTargets.length === 0) {
        unmatchedObjects.push({
          fileName: object.fileName,
          storagePath: object.storagePath,
          normalizedFileName,
          reason: "alias_target_missing",
        });
        continue;
      }

      aliasMatches.push(
        ...uniqueResolvedTargets.map((product) => ({
          ...object,
          normalizedFileName,
          product,
          matchSource: "alias" as const,
        })),
      );
      continue;
    }

    const directCandidates = productsByNormalizedName.get(normalizedFileName) ?? [];

    if (directCandidates.length === 1) {
      exactMatches.push({
        ...object,
        normalizedFileName,
        product: directCandidates[0],
        matchSource: "exact",
      });
      continue;
    }

    if (directCandidates.length > 1) {
      ambiguousMatches.push({
        fileName: object.fileName,
        storagePath: object.storagePath,
        normalizedFileName,
        candidateProducts: directCandidates,
        reason: "duplicate_product_name",
      });
      continue;
    }

    unmatchedObjects.push({
      fileName: object.fileName,
      storagePath: object.storagePath,
      normalizedFileName,
      reason: "alias_target_missing",
    });
  }

  return {
    exactMatches,
    aliasMatches,
    ambiguousMatches,
    unmatchedObjects,
  };
}
