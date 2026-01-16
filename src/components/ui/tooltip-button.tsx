import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TooltipButtonProps extends ButtonProps {
  tooltipMessages?: string[];
  showTooltip?: boolean;
}

export function TooltipButton({
  tooltipMessages = [],
  showTooltip = false,
  children,
  ...buttonProps
}: TooltipButtonProps) {
  const button = <Button {...buttonProps}>{children}</Button>;

  if (!showTooltip || tooltipMessages.length === 0) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          {tooltipMessages.map((msg: string, idx: number) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
