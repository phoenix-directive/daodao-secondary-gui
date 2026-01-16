export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-purple-600">
              <span className="text-xs font-bold text-white">DD</span>
            </div>
            <span className="text-sm font-semibold text-foreground">
              DAO DAO
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} DAO DAO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
