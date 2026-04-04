import {
  selectAliasedProductImageUrl,
  selectClosestProductImageUrl,
  selectExactProductImageUrl,
} from "./seed-product-image-library";

describe("seed product image library", () => {
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
});
