import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHealthBadgeSettings } from '@/hooks/useHealthBadgeSettings';
import { useTheme } from '@/lib/useTheme';
import { cn } from '@/lib/utils';

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { displayMode, setDisplayMode } = useHealthBadgeSettings();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="border">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Theme
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={theme === 'light'}
            onClick={() => setTheme('light')}
            className={cn('cursor-pointer')}
          >
            <span>Light</span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === 'dark'}
            onClick={() => setTheme('dark')}
            className={cn('cursor-pointer')}
          >
            <span>Dark</span>
          </DropdownMenuCheckboxItem>
        </div>

        {/* <DropdownMenuSeparator />

        <DropdownMenuSeparator />

        <div>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            APY Calculation
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={signalIncludeAssetApy.value}
            onClick={() => {
              signalIncludeAssetApy.value = !signalIncludeAssetApy.value;
            }}
            className={cn('cursor-pointer')}
          >
            <span>Include Asset APY</span>
          </DropdownMenuCheckboxItem>
        </div> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SettingsMenu;
