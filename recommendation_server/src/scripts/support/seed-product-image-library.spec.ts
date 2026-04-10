import * as cloudinaryProductImageAssets from "@/scripts/support/cloudinary-product-image-assets";
import supabaseStorageService from "@/services/supabase-storage.service";
import {
  hydrateCloudinaryLibraryFromSupabase,
  selectAliasedProductImageUrl,
  selectClosestProductImageUrl,
  selectExactProductImageUrl,
} from "./seed-product-image-library";

describe("seed product image library", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prefers an exact uploaded product image when the normalized product name matches", () => {
    const uploadedAssetsByNormalizedName = new Map<string, string[]>([
      [
        "asus_vivobook_15_oled_core_i5_16gb_512gb",
        [
          "https://example.com/storage/v1/object/public/product-images/images/asus_vivobook_15_oled_core_i5_16gb_512gb.png",
        ],
      ],
    ]);

    expect(
      selectExactProductImageUrl({
        productName: "ASUS Vivobook 15 OLED Core i5/16GB/512GB",
        uploadedAssetsByNormalizedName,
      }),
    ).toBe(
      "https://example.com/storage/v1/object/public/product-images/images/asus_vivobook_15_oled_core_i5_16gb_512gb.png",
    );
  });

  it("returns null when there is no exact uploaded asset for the seeded product", () => {
    const uploadedAssetsByNormalizedName = new Map<string, string[]>([
      ["iphone_17_128gb", ["https://example.com/storage/v1/object/public/product-images/images/iphone_17_128gb.png"]],
    ]);

    expect(
      selectExactProductImageUrl({
        productName: "Samsung Galaxy S26 12GB/256GB",
        uploadedAssetsByNormalizedName,
      }),
    ).toBeNull();
  });

  it("uses the shared alias map when a filename intentionally maps to the seeded product name", () => {
    const uploadedAssetsByNormalizedName = new Map<string, string[]>([
      [
        "dell_s2722qc_27in_4k_60hz",
        [
          "https://example.com/storage/v1/object/public/product-images/images/dell_s2722qc_27in_4k_60hz.jpg",
        ],
      ],
    ]);

    expect(
      selectAliasedProductImageUrl({
        productName: "Dell S2722QC 27in/4K/USB-C",
        uploadedAssetsByNormalizedName,
      }),
    ).toBe(
      "https://example.com/storage/v1/object/public/product-images/images/dell_s2722qc_27in_4k_60hz.jpg",
    );
  });

  it("supports conservative same-model aliases for nearby seeded variants", () => {
    const uploadedAssetsByNormalizedName = new Map<string, string[]>([
      [
        "iphone_17_512gb",
        [
          "https://example.com/storage/v1/object/public/product-images/images/iphone_17_512gb.jpg",
        ],
      ],
    ]);

    expect(
      selectAliasedProductImageUrl({
        productName: "iPhone 17 128GB",
        uploadedAssetsByNormalizedName,
      }),
    ).toBe(
      "https://example.com/storage/v1/object/public/product-images/images/iphone_17_512gb.jpg",
    );
  });

  it("falls back to the closest matching real product image when exact and alias matches are absent", () => {
    const uploadedAssetsByNormalizedName = new Map<string, string[]>([
      [
        "iphone_17_air_1tb",
        [
          "https://example.com/storage/v1/object/public/product-images/images/iphone_17_air_1tb.webp",
        ],
      ],
      [
        "iphone_17_pro_512gb",
        [
          "https://example.com/storage/v1/object/public/product-images/images/iphone_17_pro_512gb.jpg",
        ],
      ],
    ]);

    expect(
      selectClosestProductImageUrl({
        productName: "iPhone 17 Air 512GB",
        uploadedAssetsByNormalizedName,
      }),
    ).toBe(
      "https://example.com/storage/v1/object/public/product-images/images/iphone_17_air_1tb.webp",
    );
  });

  it("hydrates the Cloudinary library from Supabase objects when real product images exist there", async () => {
    jest
      .spyOn(supabaseStorageService, "listObjects")
      .mockResolvedValue([
        { id: "1", name: "iphone_17_128gb.jpg" },
        { id: null, name: "nested-folder" },
        { id: "2", name: "samsung_galaxy_s26_12gb_256gb.webp" },
      ]);
    jest
      .spyOn(supabaseStorageService, "getPublicUrl")
      .mockImplementation((path) => `https://supabase.example/${path}`);

    const uploadRemoteImageToCloudinarySpy = jest
      .spyOn(cloudinaryProductImageAssets, "uploadRemoteImageToCloudinary")
      .mockImplementation(async ({ publicId }) => ({
        publicId,
        secureUrl: `https://cloudinary.example/${publicId}`,
      }));
    jest
      .spyOn(cloudinaryProductImageAssets, "listCloudinaryAssetsByPrefix")
      .mockResolvedValue([
        {
          publicId: "products/library/iphone-17-128gb",
          secureUrl: "https://cloudinary.example/products/library/iphone-17-128gb",
        },
        {
          publicId: "products/library/samsung-galaxy-s26-12gb-256gb",
          secureUrl: "https://cloudinary.example/products/library/samsung-galaxy-s26-12gb-256gb",
        },
      ]);

    const assets = await hydrateCloudinaryLibraryFromSupabase();

    expect(uploadRemoteImageToCloudinarySpy).toHaveBeenCalledTimes(2);
    expect(uploadRemoteImageToCloudinarySpy).toHaveBeenNthCalledWith(1, {
      sourceUrl: "https://supabase.example/images/iphone_17_128gb.jpg",
      publicId: "products/library/iphone-17-128gb",
      overwrite: true,
      tags: ["product-image", "product-image-library", "supabase-import"],
    });
    expect(uploadRemoteImageToCloudinarySpy).toHaveBeenNthCalledWith(2, {
      sourceUrl: "https://supabase.example/images/samsung_galaxy_s26_12gb_256gb.webp",
      publicId: "products/library/samsung-galaxy-s26-12gb-256gb",
      overwrite: true,
      tags: ["product-image", "product-image-library", "supabase-import"],
    });
    expect(assets).toEqual([
      {
        publicId: "products/library/iphone-17-128gb",
        secureUrl: "https://cloudinary.example/products/library/iphone-17-128gb",
      },
      {
        publicId: "products/library/samsung-galaxy-s26-12gb-256gb",
        secureUrl: "https://cloudinary.example/products/library/samsung-galaxy-s26-12gb-256gb",
      },
    ]);
  });

  it("returns an empty library when Supabase does not contain any real product images", async () => {
    jest.spyOn(supabaseStorageService, "listObjects").mockResolvedValue([]);
    const uploadRemoteImageToCloudinarySpy = jest.spyOn(
      cloudinaryProductImageAssets,
      "uploadRemoteImageToCloudinary",
    );

    await expect(hydrateCloudinaryLibraryFromSupabase()).resolves.toEqual([]);
    expect(uploadRemoteImageToCloudinarySpy).not.toHaveBeenCalled();
  });
});
