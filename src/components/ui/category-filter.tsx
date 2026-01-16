import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssetCategory } from '@/config/assets';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  className?: string;
}

const CATEGORIES = [
  { label: 'Core', value: AssetCategory.CORE },
  { label: 'Stablecoins', value: AssetCategory.STABLECOIN },
  { label: 'Liquid Staking', value: AssetCategory.LST },
  { label: 'LP', value: AssetCategory.LP },
  { label: 'Unsupported', value: AssetCategory.OTHER },
];

export function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
  className,
}: CategoryFilterProps) {
  // useEffect(() => {
  //   if (selectedCategories.length === 0) {
  //     onCategoriesChange(
  //       CATEGORIES.filter((a) => a.value !== AssetCategory.OTHER).map((cat) => cat.value),
  //     );
  //   }
  // }, [selectedCategories, onCategoriesChange]);

  const isAllSelected =
    selectedCategories.length === 0 ||
    (selectedCategories.length === CATEGORIES.length - 1 &&
      !selectedCategories.includes(AssetCategory.OTHER));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghostborder'}
          size={'form'}
          className={cn(
            'w-[141px] justify-center bg-background rounded-md px-3 py-2 text-sm flex items-center gap-2 min-w-[120px]',
            className,
          )}
        >
          <span>
            {isAllSelected
              ? 'All categories'
              : selectedCategories.length === 1
              ? CATEGORIES.find((cat) => cat.value === selectedCategories[0])?.label
              : `${selectedCategories.length} selected`}
          </span>
          <ChevronDownIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CATEGORIES.map((cat) => (
          <DropdownMenuCheckboxItem
            key={cat.value}
            checked={selectedCategories.includes(cat.value)}
            onSelect={(ev) => {
              ev.preventDefault();
            }}
            onCheckedChange={(checked) => {
              onCategoriesChange(
                checked
                  ? [...selectedCategories, cat.value]
                  : selectedCategories.filter((v) => v !== cat.value),
              );
            }}
            className="capitalize"
          >
            {cat.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <button
          type="button"
          className="w-full text-xs text-muted-foreground hover:underline text-right px-2 py-1 cursor-pointer"
          onClick={() => onCategoriesChange([])}
        >
          Reset
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
