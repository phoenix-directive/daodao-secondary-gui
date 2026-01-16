import { useTheme } from "@/components/theme-provider";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";

interface TreasuryTabProps {
  daoAddress?: string;
  daoName?: string;
}

export function TreasuryTab({ daoAddress, daoName }: TreasuryTabProps) {
  const { isDark } = useTheme();
  const [timestamp] = useState(() => Date.now());

  // Build the portfolio widget config
  const portfolioConfig = useMemo(() => {
    if (!daoAddress) return null;

    const config = [
      {
        id: `dao_${timestamp}`,
        name: daoName || "DAO Treasury",
        addresses: [
          {
            address: daoAddress,
            info: "DAO Treasury",
            dapps: [
              "balances",
              "cw20",
              "astroport",
              "skeleton-swap",
              "tla",
              "tla-locks",
              "tla-compounder",
              "votion",
              "creda",
            ],
          },
        ],
        createdAt: new Date(timestamp).toISOString(),
        updatedAt: new Date(timestamp).toISOString(),
      },
    ];

    return encodeURIComponent(JSON.stringify(config));
  }, [daoAddress, daoName, timestamp]);

  // Build the widget URL
  const widgetUrl = useMemo(() => {
    if (!portfolioConfig) return null;
    const darkParam = isDark ? "&dark=1" : "&dark=0";
    return `https://phoenix.money/portfolio?config=${portfolioConfig}&transparent=1${darkParam}`;
  }, [portfolioConfig, isDark]);

  // Reload iframe when theme changes
  useEffect(() => {
    const iframe = document.getElementById(
      "treasury-widget"
    ) as HTMLIFrameElement;
    console.log("🚀 ~ TreasuryTab ~ widgetUrl:", widgetUrl);
    if (iframe && widgetUrl) {
      iframe.src = widgetUrl;
    }
  }, [widgetUrl]);

  if (!daoAddress) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Treasury</h3>
            <p className="text-sm text-muted-foreground">
              DAO address not available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <iframe
          id="treasury-widget"
          src={widgetUrl || ""}
          className="h-200 w-full border-0"
          title="DAO Treasury Portfolio"
        />
      </CardContent>
    </Card>
  );
}
