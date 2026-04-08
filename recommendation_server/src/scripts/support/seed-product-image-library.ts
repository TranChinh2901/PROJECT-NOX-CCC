import { DEFAULT_PRODUCT_IMAGE_ALIASES } from "@/scripts/support/product-image-aliases";
import {
  buildCloudinaryAssetIndex,
  buildCloudinaryAssetUrl,
  buildCloudinarySeedAssetPublicId,
  getCloudinaryProductImageLibraryPrefix,
  getCloudinaryProductImageSeedPrefix,
  isCloudinarySeedUrl,
  isCloudinaryUrl,
  listCloudinaryAssetsByPrefix,
  uploadSvgToCloudinary,
} from "@/scripts/support/cloudinary-product-image-assets";
import { normalizeProductImageKey } from "@/scripts/support/supabase-product-image-sync";

type DeviceFamily =
  | "phone"
  | "gaming-phone"
  | "laptop"
  | "gaming-laptop"
  | "desktop"
  | "monitor"
  | "tablet"
  | "earbuds"
  | "speaker"
  | "watch"
  | "charger";

type Palette = {
  backgroundStart: string;
  backgroundEnd: string;
  accent: string;
  accentSoft: string;
  foreground: string;
  frame: string;
  surface: string;
};

type FamilyDefinition = {
  title: string;
  subtitle: string;
  palette: Palette;
};

const VIEW_COUNT = 3;
const FAMILY_DEFINITIONS: Record<DeviceFamily, FamilyDefinition> = {
  "phone": {
    title: "Flagship Phone",
    subtitle: "OLED display / pro camera",
    palette: {
      backgroundStart: "#E0F2FE",
      backgroundEnd: "#DBEAFE",
      accent: "#2563EB",
      accentSoft: "#93C5FD",
      foreground: "#0F172A",
      frame: "#1E293B",
      surface: "#FFFFFF",
    },
  },
  "gaming-phone": {
    title: "Gaming Phone",
    subtitle: "High refresh / vapor cooling",
    palette: {
      backgroundStart: "#EDE9FE",
      backgroundEnd: "#FCE7F3",
      accent: "#7C3AED",
      accentSoft: "#C4B5FD",
      foreground: "#111827",
      frame: "#1F2937",
      surface: "#0F172A",
    },
  },
  "laptop": {
    title: "Ultrabook",
    subtitle: "Thin chassis / all-day battery",
    palette: {
      backgroundStart: "#F8FAFC",
      backgroundEnd: "#E2E8F0",
      accent: "#0F766E",
      accentSoft: "#99F6E4",
      foreground: "#0F172A",
      frame: "#334155",
      surface: "#FFFFFF",
    },
  },
  "gaming-laptop": {
    title: "Gaming Laptop",
    subtitle: "Discrete GPU / high airflow",
    palette: {
      backgroundStart: "#111827",
      backgroundEnd: "#1F2937",
      accent: "#F97316",
      accentSoft: "#FDBA74",
      foreground: "#F8FAFC",
      frame: "#020617",
      surface: "#0F172A",
    },
  },
  "desktop": {
    title: "Desktop Setup",
    subtitle: "Tower build / tuned airflow",
    palette: {
      backgroundStart: "#ECFDF5",
      backgroundEnd: "#D1FAE5",
      accent: "#059669",
      accentSoft: "#6EE7B7",
      foreground: "#052E16",
      frame: "#14532D",
      surface: "#F0FDF4",
    },
  },
  "monitor": {
    title: "Display",
    subtitle: "High refresh / accurate color",
    palette: {
      backgroundStart: "#FEF3C7",
      backgroundEnd: "#FDE68A",
      accent: "#D97706",
      accentSoft: "#FCD34D",
      foreground: "#451A03",
      frame: "#78350F",
      surface: "#FFFBEB",
    },
  },
  "tablet": {
    title: "Tablet",
    subtitle: "Portable / note-ready",
    palette: {
      backgroundStart: "#EEF2FF",
      backgroundEnd: "#E0E7FF",
      accent: "#4F46E5",
      accentSoft: "#A5B4FC",
      foreground: "#1E1B4B",
      frame: "#312E81",
      surface: "#FFFFFF",
    },
  },
  "earbuds": {
    title: "Wireless Audio",
    subtitle: "Compact fit / active ANC",
    palette: {
      backgroundStart: "#FDF2F8",
      backgroundEnd: "#FCE7F3",
      accent: "#DB2777",
      accentSoft: "#F9A8D4",
      foreground: "#500724",
      frame: "#831843",
      surface: "#FFF1F2",
    },
  },
  "speaker": {
    title: "Portable Speaker",
    subtitle: "IP rated / deep bass",
    palette: {
      backgroundStart: "#FFF7ED",
      backgroundEnd: "#FFEDD5",
      accent: "#EA580C",
      accentSoft: "#FDBA74",
      foreground: "#431407",
      frame: "#7C2D12",
      surface: "#FFFBEB",
    },
  },
  "watch": {
    title: "Smart Watch",
    subtitle: "Health tracking / long battery",
    palette: {
      backgroundStart: "#F1F5F9",
      backgroundEnd: "#E2E8F0",
      accent: "#0F172A",
      accentSoft: "#94A3B8",
      foreground: "#0F172A",
      frame: "#1E293B",
      surface: "#FFFFFF",
    },
  },
  "charger": {
    title: "Charging Gear",
    subtitle: "GaN power / travel ready",
    palette: {
      backgroundStart: "#F0FDF4",
      backgroundEnd: "#DCFCE7",
      accent: "#16A34A",
      accentSoft: "#86EFAC",
      foreground: "#14532D",
      frame: "#166534",
      surface: "#F7FEE7",
    },
  },
};

let uploadedFamilyAssetsPromise: Promise<Map<DeviceFamily, string[]>> | null = null;
let uploadedProductAssetsPromise: Promise<Map<string, string[]>> | null = null;

function getLeafCategoryName(categoryName: string): string {
  const parts = categoryName.split(" - ");
  return parts[parts.length - 1] ?? categoryName;
}

function resolveFamily(categoryName: string): DeviceFamily {
  switch (getLeafCategoryName(categoryName)) {
    case "iPhone":
    case "Samsung Galaxy":
    case "Xiaomi POCO":
      return "phone";
    case "Điện Thoại Gaming":
      return "gaming-phone";
    case "MacBook":
    case "Laptop Văn Phòng":
    case "Laptop AI":
      return "laptop";
    case "Laptop Gaming":
      return "gaming-laptop";
    case "PC Gaming":
    case "PC Văn Phòng":
    case "Mini PC":
      return "desktop";
    case "Màn Hình":
      return "monitor";
    case "iPad":
    case "Tablet Android":
    case "Tablet Học Tập":
    case "Tablet Cao Cấp":
      return "tablet";
    case "Tai Nghe":
      return "earbuds";
    case "Loa":
      return "speaker";
    case "Đồng Hồ Thông Minh":
      return "watch";
    case "Sạc - Pin Dự Phòng":
      return "charger";
    default:
      return "phone";
  }
}

function getAssetPath(family: DeviceFamily, sortOrder: number): string {
  const view = ((sortOrder % VIEW_COUNT) + VIEW_COUNT) % VIEW_COUNT;
  return `seed/products/${family}/view-${view + 1}.svg`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderBackdrop(palette: Palette): string {
  return `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.backgroundStart}" />
        <stop offset="100%" stop-color="${palette.backgroundEnd}" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.accent}" />
        <stop offset="100%" stop-color="${palette.accentSoft}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#0f172a" flood-opacity="0.14" />
      </filter>
    </defs>
    <rect width="1200" height="1200" rx="72" fill="url(#bg)" />
    <circle cx="1020" cy="150" r="180" fill="${palette.accentSoft}" fill-opacity="0.35" />
    <circle cx="230" cy="980" r="220" fill="${palette.accent}" fill-opacity="0.12" />
    <rect x="72" y="72" width="1056" height="1056" rx="56" fill="rgba(255,255,255,0.24)" opacity="0.72" />
  `;
}

function renderPhone(definition: FamilyDefinition, view: number): string {
  const deviceX = [710, 680, 650][view];
  const accentPanelX = [772, 742, 712][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${deviceX}" y="214" width="250" height="600" rx="42" fill="${definition.palette.frame}" />
      <rect x="${deviceX + 16}" y="230" width="218" height="568" rx="32" fill="${definition.palette.surface}" />
      <rect x="${deviceX + 24}" y="260" width="202" height="496" rx="26" fill="url(#accent)" />
      <rect x="${deviceX + 82}" y="242" width="86" height="12" rx="6" fill="${definition.palette.frame}" opacity="0.65" />
      <circle cx="${deviceX + 195}" cy="314" r="20" fill="${definition.palette.surface}" fill-opacity="0.85" />
      <circle cx="${deviceX + 195}" cy="366" r="20" fill="${definition.palette.surface}" fill-opacity="0.75" />
      <circle cx="${deviceX + 195}" cy="418" r="20" fill="${definition.palette.surface}" fill-opacity="0.65" />
    </g>
    <g opacity="0.88">
      <rect x="${accentPanelX}" y="860" width="160" height="18" rx="9" fill="${definition.palette.accent}" />
      <rect x="${accentPanelX}" y="894" width="110" height="14" rx="7" fill="${definition.palette.foreground}" opacity="0.32" />
    </g>
  `;
}

function renderLaptop(definition: FamilyDefinition, view: number): string {
  const screenX = [640, 610, 580][view];
  const baseX = [575, 545, 515][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${screenX}" y="280" width="360" height="250" rx="20" fill="${definition.palette.frame}" />
      <rect x="${screenX + 14}" y="294" width="332" height="222" rx="12" fill="url(#accent)" />
      <rect x="${baseX}" y="548" width="500" height="38" rx="18" fill="${definition.palette.frame}" />
      <rect x="${baseX + 64}" y="586" width="372" height="24" rx="12" fill="${definition.palette.accentSoft}" opacity="0.75" />
    </g>
  `;
}

function renderDesktop(definition: FamilyDefinition, view: number): string {
  const towerX = [708, 738, 680][view];
  const monitorX = [500, 470, 530][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${monitorX}" y="286" width="360" height="230" rx="18" fill="${definition.palette.frame}" />
      <rect x="${monitorX + 16}" y="302" width="328" height="198" rx="10" fill="url(#accent)" />
      <rect x="${monitorX + 150}" y="516" width="60" height="64" rx="10" fill="${definition.palette.frame}" />
      <rect x="${monitorX + 110}" y="580" width="140" height="18" rx="9" fill="${definition.palette.foreground}" opacity="0.28" />
      <rect x="${towerX}" y="244" width="180" height="392" rx="22" fill="${definition.palette.frame}" />
      <rect x="${towerX + 18}" y="262" width="144" height="356" rx="14" fill="${definition.palette.surface}" />
      <circle cx="${towerX + 120}" cy="356" r="22" fill="${definition.palette.accent}" />
      <circle cx="${towerX + 120}" cy="430" r="22" fill="${definition.palette.accentSoft}" />
      <rect x="${towerX + 52}" y="520" width="56" height="12" rx="6" fill="${definition.palette.foreground}" opacity="0.4" />
    </g>
  `;
}

function renderMonitor(definition: FamilyDefinition, view: number): string {
  const monitorX = [450, 480, 420][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${monitorX}" y="266" width="470" height="270" rx="22" fill="${definition.palette.frame}" />
      <rect x="${monitorX + 20}" y="286" width="430" height="230" rx="12" fill="url(#accent)" />
      <rect x="${monitorX + 200}" y="536" width="70" height="82" rx="16" fill="${definition.palette.frame}" />
      <rect x="${monitorX + 136}" y="618" width="198" height="22" rx="11" fill="${definition.palette.foreground}" opacity="0.28" />
    </g>
  `;
}

function renderTablet(definition: FamilyDefinition, view: number): string {
  const tabletX = [610, 570, 650][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${tabletX}" y="270" width="340" height="470" rx="34" fill="${definition.palette.frame}" />
      <rect x="${tabletX + 18}" y="288" width="304" height="434" rx="24" fill="${definition.palette.surface}" />
      <rect x="${tabletX + 30}" y="320" width="280" height="360" rx="20" fill="url(#accent)" />
      <circle cx="${tabletX + 170}" cy="304" r="8" fill="${definition.palette.frame}" opacity="0.7" />
      <rect x="${tabletX + 68}" y="770" width="204" height="18" rx="9" fill="${definition.palette.accent}" />
    </g>
  `;
}

function renderEarbuds(definition: FamilyDefinition, view: number): string {
  const caseX = [610, 590, 630][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${caseX}" y="500" width="300" height="190" rx="56" fill="${definition.palette.surface}" stroke="${definition.palette.frame}" stroke-width="12" />
      <path d="M${caseX + 48} 560h204" stroke="${definition.palette.frame}" stroke-width="10" stroke-linecap="round" opacity="0.22" />
      <rect x="${caseX + 56}" y="370" width="56" height="138" rx="26" fill="${definition.palette.frame}" />
      <rect x="${caseX + 188}" y="370" width="56" height="138" rx="26" fill="${definition.palette.frame}" />
      <circle cx="${caseX + 84}" cy="394" r="16" fill="${definition.palette.accent}" />
      <circle cx="${caseX + 216}" cy="394" r="16" fill="${definition.palette.accent}" />
    </g>
  `;
}

function renderSpeaker(definition: FamilyDefinition, view: number): string {
  const speakerX = [600, 560, 640][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${speakerX}" y="360" width="320" height="430" rx="42" fill="${definition.palette.frame}" />
      <rect x="${speakerX + 18}" y="378" width="284" height="394" rx="28" fill="${definition.palette.surface}" />
      <circle cx="${speakerX + 160}" cy="500" r="82" fill="url(#accent)" />
      <circle cx="${speakerX + 160}" cy="500" r="44" fill="${definition.palette.surface}" opacity="0.9" />
      <circle cx="${speakerX + 160}" cy="660" r="52" fill="${definition.palette.accentSoft}" />
    </g>
  `;
}

function renderWatch(definition: FamilyDefinition, view: number): string {
  const watchX = [650, 620, 680][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${watchX}" y="220" width="180" height="760" rx="72" fill="${definition.palette.accentSoft}" />
      <rect x="${watchX + 18}" y="368" width="144" height="302" rx="36" fill="${definition.palette.frame}" />
      <rect x="${watchX + 34}" y="384" width="112" height="270" rx="24" fill="url(#accent)" />
      <circle cx="${watchX + 90}" cy="458" r="36" fill="${definition.palette.surface}" opacity="0.82" />
      <path d="M${watchX + 90} 458l16-20" stroke="${definition.palette.frame}" stroke-width="8" stroke-linecap="round" />
      <path d="M${watchX + 90} 458l-22 12" stroke="${definition.palette.frame}" stroke-width="8" stroke-linecap="round" />
    </g>
  `;
}

function renderCharger(definition: FamilyDefinition, view: number): string {
  const blockX = [650, 620, 680][view];
  return `
    <g filter="url(#shadow)">
      <rect x="${blockX}" y="346" width="210" height="310" rx="32" fill="${definition.palette.surface}" stroke="${definition.palette.frame}" stroke-width="12" />
      <rect x="${blockX + 56}" y="418" width="98" height="116" rx="18" fill="url(#accent)" />
      <rect x="${blockX + 44}" y="250" width="22" height="96" rx="11" fill="${definition.palette.frame}" />
      <rect x="${blockX + 144}" y="250" width="22" height="96" rx="11" fill="${definition.palette.frame}" />
      <rect x="${blockX + 70}" y="706" width="70" height="18" rx="9" fill="${definition.palette.accent}" />
    </g>
  `;
}

function renderDeviceArtwork(family: DeviceFamily, definition: FamilyDefinition, view: number): string {
  switch (family) {
    case "phone":
    case "gaming-phone":
      return renderPhone(definition, view);
    case "laptop":
    case "gaming-laptop":
      return renderLaptop(definition, view);
    case "desktop":
      return renderDesktop(definition, view);
    case "monitor":
      return renderMonitor(definition, view);
    case "tablet":
      return renderTablet(definition, view);
    case "earbuds":
      return renderEarbuds(definition, view);
    case "speaker":
      return renderSpeaker(definition, view);
    case "watch":
      return renderWatch(definition, view);
    case "charger":
      return renderCharger(definition, view);
    default:
      return renderPhone(definition, view);
  }
}

function renderSvg(family: DeviceFamily, view: number): string {
  const definition = FAMILY_DEFINITIONS[family];
  const title = escapeXml(definition.title);
  const subtitle = escapeXml(definition.subtitle);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="1200" viewBox="0 0 1200 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${renderBackdrop(definition.palette)}
  <g>
    <text x="120" y="224" fill="${definition.palette.foreground}" font-size="36" font-family="Arial, Helvetica, sans-serif" font-weight="700" letter-spacing="3">NOX SAMPLE ASSET</text>
    <text x="120" y="310" fill="${definition.palette.foreground}" font-size="88" font-family="Arial, Helvetica, sans-serif" font-weight="800">${title}</text>
    <text x="120" y="374" fill="${definition.palette.foreground}" fill-opacity="0.78" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="500">${subtitle}</text>
    <rect x="120" y="430" width="240" height="16" rx="8" fill="${definition.palette.accent}" />
    <rect x="120" y="468" width="180" height="14" rx="7" fill="${definition.palette.foreground}" opacity="0.24" />
    <rect x="120" y="904" width="286" height="106" rx="28" fill="${definition.palette.surface}" opacity="0.92" />
    <text x="156" y="958" fill="${definition.palette.foreground}" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="700">View ${view + 1}</text>
    <text x="156" y="998" fill="${definition.palette.foreground}" fill-opacity="0.72" font-size="24" font-family="Arial, Helvetica, sans-serif" font-weight="500">Cloudinary hosted product image</text>
  </g>
  ${renderDeviceArtwork(family, definition, view)}
</svg>`;
}

async function loadUploadedFamilyAssets(): Promise<Map<DeviceFamily, string[]>> {
  if (!uploadedFamilyAssetsPromise) {
    uploadedFamilyAssetsPromise = (async () => {
      const families = Object.keys(FAMILY_DEFINITIONS) as DeviceFamily[];
      const entries = await Promise.all(
        families.map(async (family) => {
          const assets = await listCloudinaryAssetsByPrefix(`${getCloudinaryProductImageSeedPrefix()}/${family}/`);
          const urls = assets
            .map((asset) => asset.secureUrl)
            .sort((left, right) => left.localeCompare(right));

          return [family, urls] as const;
        }),
      );

      return new Map(entries);
    })();
  }

  return uploadedFamilyAssetsPromise;
}

function toNormalizedTokens(value: string): string[] {
  return normalizeProductImageKey(value).split("_").filter(Boolean);
}

function calculateTokenOverlapScore(productName: string, candidateKey: string): number {
  const productTokens = toNormalizedTokens(productName);
  const candidateTokens = candidateKey.split("_").filter(Boolean);

  if (productTokens.length === 0 || candidateTokens.length === 0) {
    return 0;
  }

  const productTokenSet = new Set(productTokens);
  const candidateTokenSet = new Set(candidateTokens);
  let commonCount = 0;

  for (const token of productTokenSet) {
    if (candidateTokenSet.has(token)) {
      commonCount += 1;
    }
  }

  let orderedPrefixCount = 0;
  while (
    orderedPrefixCount < productTokens.length &&
    orderedPrefixCount < candidateTokens.length &&
    productTokens[orderedPrefixCount] === candidateTokens[orderedPrefixCount]
  ) {
    orderedPrefixCount += 1;
  }

  const overlapScore = commonCount / Math.max(productTokenSet.size, candidateTokenSet.size, 1);
  const prefixScore = orderedPrefixCount / Math.max(Math.min(productTokens.length, candidateTokens.length), 1);
  const sameLeadTokenBonus = productTokens[0] === candidateTokens[0] ? 0.1 : 0;

  return overlapScore * 0.7 + prefixScore * 0.2 + sameLeadTokenBonus;
}

export function selectExactProductImageUrl(input: {
  productName: string;
  uploadedAssetsByNormalizedName: Map<string, string[]>;
}): string | null {
  const normalizedProductName = normalizeProductImageKey(input.productName);
  const matchingAssets = input.uploadedAssetsByNormalizedName.get(normalizedProductName) ?? [];

  return matchingAssets[0] ?? null;
}

export function selectAliasedProductImageUrl(input: {
  productName: string;
  uploadedAssetsByNormalizedName: Map<string, string[]>;
}): string | null {
  const normalizedProductName = normalizeProductImageKey(input.productName);

  for (const [aliasKey, aliasTarget] of Object.entries(DEFAULT_PRODUCT_IMAGE_ALIASES)) {
    const aliasTargets = Array.isArray(aliasTarget) ? aliasTarget : [aliasTarget];
    const matchesTarget = aliasTargets.some(
      (candidateTarget) => normalizeProductImageKey(candidateTarget) === normalizedProductName,
    );

    if (!matchesTarget) {
      continue;
    }

    const matchingAssets = input.uploadedAssetsByNormalizedName.get(aliasKey) ?? [];
    if (matchingAssets.length > 0) {
      return matchingAssets[0] ?? null;
    }
  }

  return null;
}

export function selectClosestProductImageUrl(input: {
  productName: string;
  uploadedAssetsByNormalizedName: Map<string, string[]>;
}): string | null {
  const candidates = Array.from(input.uploadedAssetsByNormalizedName.entries())
    .map(([normalizedName, urls]) => ({
      normalizedName,
      url: urls[0] ?? null,
      score: calculateTokenOverlapScore(input.productName, normalizedName),
    }))
    .filter((candidate) => candidate.url && candidate.score >= 0.5)
    .sort((left, right) => right.score - left.score);

  const bestCandidate = candidates[0];
  const secondCandidate = candidates[1];

  if (!bestCandidate?.url) {
    return null;
  }

  if (secondCandidate && bestCandidate.score - secondCandidate.score < 0.03) {
    return null;
  }

  return bestCandidate.url;
}

async function loadUploadedProductAssets(): Promise<Map<string, string[]>> {
  if (!uploadedProductAssetsPromise) {
    uploadedProductAssetsPromise = (async () => {
      const uploadedAssets = await listCloudinaryAssetsByPrefix(`${getCloudinaryProductImageLibraryPrefix()}/`);
      return buildCloudinaryAssetIndex(uploadedAssets);
    })();
  }

  return uploadedProductAssetsPromise;
}

async function uploadSeedAsset(family: DeviceFamily, view: number): Promise<void> {
  const publicId = buildCloudinarySeedAssetPublicId(family, view);
  const svg = renderSvg(family, view);

  await uploadSvgToCloudinary({
    publicId,
    svg,
    overwrite: true,
    tags: ["product-image", "seed-product-image"],
  });
}

export async function ensureSeedProductAssets(): Promise<void> {
  const families = Object.keys(FAMILY_DEFINITIONS) as DeviceFamily[];

  for (const family of families) {
    let existingAssets = new Set<string>();

    try {
      const assets = await listCloudinaryAssetsByPrefix(`${getCloudinaryProductImageSeedPrefix()}/${family}/`);
      existingAssets = new Set(assets.map((asset) => asset.publicId));
    } catch (error) {
      console.warn(
        `[seed-product-image-library] Failed to inspect fallback assets for ${family}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    for (let view = 0; view < VIEW_COUNT; view += 1) {
      const expectedPublicId = buildCloudinarySeedAssetPublicId(family, view);
      if (existingAssets.has(expectedPublicId)) {
        continue;
      }

      try {
        await uploadSeedAsset(family, view);
      } catch (error) {
        console.warn(
          `[seed-product-image-library] Skipping fallback asset ${expectedPublicId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}

export function getSeedProductImageUrl(categoryName: string, sortOrder: number): string {
  const family = resolveFamily(categoryName);
  return buildCloudinaryAssetUrl(buildCloudinarySeedAssetPublicId(family, sortOrder % VIEW_COUNT), "svg");
}

export async function getPreferredProductImageUrl(
  categoryName: string,
  productName: string,
  sortOrder: number,
): Promise<string> {
  const uploadedProductAssets = await loadUploadedProductAssets();
  const exactProductImageUrl = selectExactProductImageUrl({
    productName,
    uploadedAssetsByNormalizedName: uploadedProductAssets,
  });

  if (exactProductImageUrl) {
    return exactProductImageUrl;
  }

  const aliasedProductImageUrl = selectAliasedProductImageUrl({
    productName,
    uploadedAssetsByNormalizedName: uploadedProductAssets,
  });

  if (aliasedProductImageUrl) {
    return aliasedProductImageUrl;
  }

  const closestProductImageUrl = selectClosestProductImageUrl({
    productName,
    uploadedAssetsByNormalizedName: uploadedProductAssets,
  });

  if (closestProductImageUrl) {
    return closestProductImageUrl;
  }

  const family = resolveFamily(categoryName);
  const uploadedAssets = (await loadUploadedFamilyAssets()).get(family) ?? [];

  if (uploadedAssets.length > 0) {
    return uploadedAssets[((sortOrder % uploadedAssets.length) + uploadedAssets.length) % uploadedAssets.length];
  }

  return buildCloudinaryAssetUrl(buildCloudinarySeedAssetPublicId(family, sortOrder % VIEW_COUNT), "svg");
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  return Boolean(url) && !isCloudinaryUrl(url);
}

export function isSeedProductImageUrl(url: string | null | undefined): boolean {
  return isCloudinarySeedUrl(url);
}
