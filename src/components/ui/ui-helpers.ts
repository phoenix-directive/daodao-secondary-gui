import { cn } from '@/lib/utils';

export const gradientStart = 'text-[#E24A17] dark:text-[#F0651E]';
export const gradientText =
  'bg-linear-to-br from-[#B32712] via-[#E24A17] to-[#FF8A1E] dark:from-[#E24A17] dark:via-[#FF8A1E] dark:to-[#FFC83D] bg-clip-text text-transparent';

export const gradientBg = 'bg-linear-to-tr from-[#E24A17] via-[#FF8A1E] to-[#FFC83D] ';
export const gradientBgHover = 'bg-linear-to-tr hover:from-[#B32712] hover:via-[#E24A17] hover:to-[#FF9F2E] ';

// use tailwind classes, for dark red to yellow to green gradient background use tailwind classes
export const redGreenGradientBg =
  'bg-gradient-to-r from-[#9E1B0F] via-[#FFC83D] to-green-500 dark:from-[#B32712] dark:via-[#FFD966] dark:to-green-600';

export const strippedBg = cn(
  'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.4)_5px,rgba(255,255,255,0.4)_10px)]',
  'dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.4)_5px,rgba(0,0,0,0.4)_10px)]',
);
