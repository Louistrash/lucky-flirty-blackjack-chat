// Lokale placeholder afbeeldingen om externe afhankelijkheden te vermijden
// Deze SVG afbeeldingen zijn gecodeerd als base64 data URLs

export const PLACEHOLDER_IMAGES = {
  // 300x400 placeholder voor dealer cards
  DEALER_CARD: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMzMzMyIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=",
  
  // 300x300 placeholder voor avatars
  AVATAR: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMzMzMyIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=",
  
  // 192x256 placeholder voor outfit progression
  OUTFIT: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMzMzMyIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4="
};

// Functie om te controleren of een afbeelding URL geldig is
export function getValidImageUrl(imageUrl: string | undefined, placeholderType: keyof typeof PLACEHOLDER_IMAGES = 'DEALER_CARD'): string {
  if (!imageUrl || imageUrl === "" || imageUrl === "null" || imageUrl === "undefined") {
    return PLACEHOLDER_IMAGES[placeholderType];
  }
  return imageUrl;
}

// Utility functie voor onError handlers
export function createImageErrorHandler(placeholderType: keyof typeof PLACEHOLDER_IMAGES = 'DEALER_CARD') {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = PLACEHOLDER_IMAGES[placeholderType];
  };
} 