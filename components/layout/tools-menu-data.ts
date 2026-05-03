export type ToolCategoryId = "video" | "image" | "audio" | "animation" | "ai-tools";

export type ToolMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  isNew?: boolean;
  /** One or more categories per product mapping (filters use OR within category pill). */
  categories: ToolCategoryId[];
};

/** Four columns; each column is a vertical stack (mega menu grid). */
export const TOOLS_MENU_COLUMNS: ToolMenuItem[][] = [
  [
    {
      id: "video-generator",
      title: "Video Generator",
      subtitle: "Text to video creation",
      icon: "🎬",
      href: "/video",
      isNew: true,
      categories: ["video"]
    },
    {
      id: "ingredients-video",
      title: "Ingredients Video",
      subtitle: "Combine and generate",
      icon: "🔗",
      href: "/dashboard",
      categories: ["video"]
    },
    {
      id: "product-holding",
      title: "Product Holding",
      subtitle: "Generate product videos",
      icon: "📦",
      href: "/dashboard",
      categories: ["video"]
    },
    {
      id: "character-consistency-video",
      title: "Character Consistency",
      subtitle: "Maintain subject identity",
      icon: "👤",
      href: "/dashboard",
      categories: ["video", "ai-tools"]
    }
  ],
  [
    {
      id: "video-edit",
      title: "Video Edit",
      subtitle: "Advanced video editing",
      icon: "✂️",
      href: "/dashboard",
      categories: ["video"]
    },
    {
      id: "animate",
      title: "Animate",
      subtitle: "Advanced animation tools",
      icon: "↔️",
      href: "/dashboard",
      categories: ["animation"]
    },
    {
      id: "motion-control",
      title: "Motion Control",
      subtitle: "Control video motion",
      icon: "⚙️",
      href: "/dashboard",
      isNew: true,
      categories: ["video", "animation"]
    },
    {
      id: "lipsyncing",
      title: "Lipsyncing",
      subtitle: "Create lipsync videos",
      icon: "🎤",
      href: "/dashboard",
      categories: ["video"]
    },
    {
      id: "content-aware-inpainting",
      title: "Content Aware Inpainting",
      subtitle: "Remove Unwanted Elements from Videos",
      icon: "🎯",
      href: "/dashboard",
      categories: ["video"]
    },
    {
      id: "video-extender",
      title: "Video Extender",
      subtitle: "Extend Videos with AI",
      icon: "↔️",
      href: "/dashboard",
      isNew: true,
      categories: ["video"]
    }
  ],
  [
    {
      id: "video-upscaler",
      title: "Video Upscaler",
      subtitle: "Enhance video quality",
      icon: "🎯",
      href: "/dashboard/enhance",
      categories: ["video"]
    },
    {
      id: "sound-effects",
      title: "Sound Effects",
      subtitle: "Add audio to video",
      icon: "🎵",
      href: "/dashboard",
      categories: ["audio"]
    },
    {
      id: "video-effects",
      title: "Video Effects",
      subtitle: "Add visual effects",
      icon: "✨",
      href: "/dashboard",
      categories: ["video"]
    },
    {
      id: "ugc-audio-fixer",
      title: "UGC Audio Fixer",
      subtitle: "Fix and enhance audio in short clips",
      icon: "🔊",
      href: "/dashboard",
      isNew: true,
      categories: ["audio"]
    },
    {
      id: "draw-to-edit",
      title: "Draw to Edit",
      subtitle: "Sketch based editing",
      icon: "✏️",
      href: "/dashboard",
      categories: ["image"]
    }
  ],
  [
    {
      id: "image-editing",
      title: "Image Editing",
      subtitle: "Advanced image tools",
      icon: "🖼️",
      href: "/image",
      isNew: true,
      categories: ["image"]
    },
    {
      id: "pose-transfer",
      title: "Pose Transfer",
      subtitle: "Transfer subject pose",
      icon: "🤸",
      href: "/dashboard",
      categories: ["image"]
    },
    {
      id: "virtual-try-on",
      title: "Virtual Try-On",
      subtitle: "Clothing try-on",
      icon: "👕",
      href: "/dashboard",
      categories: ["image"]
    },
    {
      id: "character-consistency-image",
      title: "Character Consistency",
      subtitle: "Generate characters preserving identity",
      icon: "👤",
      href: "/dashboard",
      categories: ["image", "ai-tools"]
    },
    {
      id: "product-holding-images",
      title: "Product Holding Images",
      subtitle: "Generate product shots",
      icon: "📸",
      href: "/dashboard",
      categories: ["image"]
    },
    {
      id: "product-placement",
      title: "Product Placement",
      subtitle: "Generate product placement images",
      icon: "📌",
      href: "/dashboard",
      categories: ["image"]
    },
    {
      id: "photo-resizer",
      title: "Photo Resizer",
      subtitle: "Smart resize & crop",
      icon: "📐",
      href: "/dashboard",
      categories: ["image"]
    },
    {
      id: "vectorize",
      title: "Vectorize",
      subtitle: "Text to vector illustration",
      icon: "🔷",
      href: "/dashboard",
      isNew: true,
      categories: ["image", "ai-tools"]
    },
    {
      id: "cad-generator",
      title: "CAD Generator",
      subtitle: "Garment specs to CAD flat sketch",
      icon: "📋",
      href: "/dashboard",
      isNew: true,
      categories: ["image", "ai-tools"]
    },
    {
      id: "creative-studio",
      title: "Creative Studio",
      subtitle: "AI image & video generation studio",
      icon: "🎨",
      href: "/dashboard",
      isNew: true,
      categories: ["ai-tools"]
    },
    {
      id: "face-swap",
      title: "Face Swap",
      subtitle: "Swap faces in photos",
      icon: "🔄",
      href: "/dashboard",
      isNew: true,
      categories: ["image", "ai-tools"]
    },
    {
      id: "influencer",
      title: "Influencer",
      subtitle: "Train and Generate",
      icon: "👥",
      href: "/dashboard",
      categories: ["image", "ai-tools"]
    }
  ]
];

export const ALL_TOOLS: ToolMenuItem[] = TOOLS_MENU_COLUMNS.flat();

export type CategoryFilter = "all" | ToolCategoryId;

export function toolMatchesCategory(tool: ToolMenuItem, filter: CategoryFilter): boolean {
  if (filter === "all") return true;
  return tool.categories.includes(filter);
}

export function toolMatchesSearch(tool: ToolMenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    tool.title.toLowerCase().includes(q) ||
    tool.subtitle.toLowerCase().includes(q) ||
    tool.categories.some((c) => c.replace("-", " ").includes(q))
  );
}

/** Split tools into `columnCount` columns (round-robin) for the mega grid. */
export function distributeToolsToColumns(tools: ToolMenuItem[], columnCount: number): ToolMenuItem[][] {
  const cols: ToolMenuItem[][] = Array.from({ length: columnCount }, () => []);
  tools.forEach((tool, i) => {
    cols[i % columnCount].push(tool);
  });
  return cols;
}
