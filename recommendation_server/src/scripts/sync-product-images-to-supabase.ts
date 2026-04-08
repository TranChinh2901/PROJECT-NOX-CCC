console.warn(
  "[deprecated] sync-product-images-to-supabase.ts now delegates to the Cloudinary backfill workflow. Use src/scripts/sync-product-images-to-cloudinary.ts directly when updating automation.",
);

void import("./sync-product-images-to-cloudinary");
