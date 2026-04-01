import {
  buildProductImageSyncPlan,
  normalizeProductImageKey,
  ProductImageAliasMap,
} from "./supabase-product-image-sync";

describe("supabase product image sync helpers", () => {
  it("normalizes product names and filenames into the same exact-match key", () => {
    expect(normalizeProductImageKey("Samsung Galaxy Tab S10+ 12GB/512GB")).toBe(
      "samsung_galaxy_tab_s10_12gb_512gb",
    );
    expect(normalizeProductImageKey("Huawei Watch GT 5 Pro Golf Edition.jpg")).toBe(
      "huawei_watch_gt_5_pro_golf_edition_jpg",
    );
    expect(normalizeProductImageKey("PC Bán Hàng Mini Tower 16GB/512GB")).toBe(
      "pc_ban_hang_mini_tower_16gb_512gb",
    );
  });

  it("keeps unique exact matches and skips ambiguous or unmatched filenames", () => {
    const plan = buildProductImageSyncPlan({
      products: [
        { id: 1, name: "Samsung Galaxy A56 5G 12GB/256GB" },
        { id: 2, name: "ViewSonic VX2479 24in/FHD/180Hz" },
        { id: 3, name: "ViewSonic VX2479 24in/FHD/180Hz" },
        { id: 4, name: "PC Bán Hàng Mini Tower 16GB/512GB" },
      ],
      objects: [
        {
          fileName: "samsung_galaxy_a56_5g_12gb_256gb.jpg",
          storagePath: "images/samsung_galaxy_a56_5g_12gb_256gb.jpg",
          publicUrl: "https://example.com/samsung.jpg",
        },
        {
          fileName: "viewsonic_vx2479_24in_fhd_180hz.jpg",
          storagePath: "images/viewsonic_vx2479_24in_fhd_180hz.jpg",
          publicUrl: "https://example.com/viewsonic.jpg",
        },
        {
          fileName: "pc_b_n_h_ng_mini_tower_16gb_512gb.png",
          storagePath: "images/pc_b_n_h_ng_mini_tower_16gb_512gb.png",
          publicUrl: "https://example.com/pc.png",
        },
      ],
    });

    expect(plan.exactMatches).toHaveLength(1);
    expect(plan.exactMatches[0]?.product.id).toBe(1);

    expect(plan.aliasMatches).toHaveLength(0);

    expect(plan.ambiguousMatches).toEqual([
      expect.objectContaining({
        fileName: "viewsonic_vx2479_24in_fhd_180hz.jpg",
        reason: "duplicate_product_name",
      }),
    ]);

    expect(plan.unmatchedObjects).toEqual([
      expect.objectContaining({
        fileName: "pc_b_n_h_ng_mini_tower_16gb_512gb.png",
        reason: "alias_target_missing",
      }),
    ]);
  });

  it("supports an explicit alias map without widening exact-match behavior", () => {
    const aliases: ProductImageAliasMap = {
      pc_b_n_h_ng_mini_tower_16gb_512gb: "PC Bán Hàng Mini Tower 16GB/512GB",
      thiet_bi_cong_nghe_nox_ban_cao_cap: 7,
    };

    const plan = buildProductImageSyncPlan({
      products: [
        { id: 4, name: "PC Bán Hàng Mini Tower 16GB/512GB" },
        { id: 7, name: "Thiết Bị Công Nghệ NOX Bản Cao Cấp" },
      ],
      objects: [
        {
          fileName: "pc_b_n_h_ng_mini_tower_16gb_512gb.png",
          storagePath: "images/pc_b_n_h_ng_mini_tower_16gb_512gb.png",
          publicUrl: "https://example.com/pc.png",
        },
        {
          fileName: "thiet_bi_cong_nghe_nox_ban_cao_cap.jpg",
          storagePath: "images/thiet_bi_cong_nghe_nox_ban_cao_cap.jpg",
          publicUrl: "https://example.com/nox.jpg",
        },
      ],
      aliases,
    });

    expect(plan.exactMatches).toHaveLength(0);

    expect(plan.aliasMatches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fileName: "thiet_bi_cong_nghe_nox_ban_cao_cap.jpg",
        product: expect.objectContaining({ id: 7 }),
        matchSource: "alias",
      }),
      expect.objectContaining({
        fileName: "pc_b_n_h_ng_mini_tower_16gb_512gb.png",
        product: expect.objectContaining({ id: 4 }),
        matchSource: "alias",
      }),
    ]));
  });

  it("supports explicit multi-product aliases for controlled duplicate wiring", () => {
    const aliases: ProductImageAliasMap = {
      viewsonic_vx2479_24in_fhd_180hz: [2, 3],
      thi_t_b_c_ng_ngh_nox_b_n_cao_c_p: [7, 8],
    };

    const plan = buildProductImageSyncPlan({
      products: [
        { id: 2, name: "ViewSonic VX2479 24in/FHD/180Hz" },
        { id: 3, name: "ViewSonic VX2479 24in/FHD/180Hz" },
        { id: 7, name: "Thiết Bị Công Nghệ NOX Bản Cao Cấp" },
        { id: 8, name: "Thiết Bị Công Nghệ NOX Bản Cao Cấp" },
      ],
      objects: [
        {
          fileName: "viewsonic_vx2479_24in_fhd_180hz.jpg",
          storagePath: "images/viewsonic_vx2479_24in_fhd_180hz.jpg",
          publicUrl: "https://example.com/viewsonic.jpg",
        },
        {
          fileName: "thi_t_b_c_ng_ngh_nox_b_n_cao_c_p.jpg",
          storagePath: "images/thi_t_b_c_ng_ngh_nox_b_n_cao_c_p.jpg",
          publicUrl: "https://example.com/nox.jpg",
        },
      ],
      aliases,
    });

    expect(plan.ambiguousMatches).toHaveLength(0);
    expect(plan.unmatchedObjects).toHaveLength(0);
    expect(plan.aliasMatches).toEqual([
      expect.objectContaining({ fileName: "viewsonic_vx2479_24in_fhd_180hz.jpg", product: expect.objectContaining({ id: 2 }) }),
      expect.objectContaining({ fileName: "viewsonic_vx2479_24in_fhd_180hz.jpg", product: expect.objectContaining({ id: 3 }) }),
      expect.objectContaining({ fileName: "thi_t_b_c_ng_ngh_nox_b_n_cao_c_p.jpg", product: expect.objectContaining({ id: 7 }) }),
      expect.objectContaining({ fileName: "thi_t_b_c_ng_ngh_nox_b_n_cao_c_p.jpg", product: expect.objectContaining({ id: 8 }) }),
    ]);
  });
});
