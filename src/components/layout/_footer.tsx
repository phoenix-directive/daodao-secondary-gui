import Logo from '@/components/ui/custom/creda-logo';
import { Landmark, Send } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { siX } from 'simple-icons';

interface MenuItem {
  title: string;
  links: {
    text: string | ReactNode;
    url?: string;
    link?: string;
    external?: boolean;
  }[];
}

interface FooterProps {
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url?: string;
    link?: string;
  }[];
}

export function Footer({
  tagline = 'Everyone needs a DAO.',
  menuItems = [
    // {
    //   title: 'Product',
    //   links: [
    //     { text: 'Markets', link: '/markets' },
    //     { text: 'Dashboard', link: '/' },
    //     // { text: 'Analytics', link: '/analytics' },
    //     // { text: 'Governance', link: '/governance' },
    //   ],
    // },
    {
      title: 'Resources',
      links: [
        { text: 'Documentation', url: 'https://docs.phoenix.money', external: true },
        { text: 'Telegram Bot', link: '/telegram-bot' },
        // { text: 'Brand Assets', link: '/brand' },
        {
          text: 'GitHub',
          url: 'https://github.com/phoenix-directive',
          external: true,
        },
      ],
    },
    {
      title: 'Community',
      links: [
        {
          text: (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" role="img" viewBox="0 0 24 24" fill="currentColor">
                <path d={siX.path} />
              </svg>
              X
            </span>
          ),
          url: 'https://x.com/phoenix_dir',
          external: true,
        },
        {
          text: (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Telegram
            </span>
          ),
          url: 'https://t.me/TerraNetworkLobby',
          external: true,
        },
        {
          text: (
            <span className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Forum
            </span>
          ),
          url: 'https://forum.phoenix.money',
          external: true,
        },
      ],
    },
  ],
  copyright = `© ${new Date().getFullYear()} Phoenix Foundation. All rights reserved.`,
  bottomLinks = [
    { text: 'Disclaimer', link: '/legal#disclaimer' },
    { text: 'Terms and Conditions', link: '/legal#terms' },
    { text: 'Privacy Policy', link: '/legal#privacy' },
  ],
}: FooterProps) {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-screen-2xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          <div className="col-span-4 mb-8 lg:mb-0">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-10 w-10 grayscale" />
              <span className="text-xl font-bold">DAO</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">{tagline}</p>
          </div>
          {menuItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <h3 className="mb-4 text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li
                    key={linkIdx}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.url && link.external ? (
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.text}
                      </a>
                    ) : link.url ? (
                      <a href={link.url}>{link.text}</a>
                    ) : (
                      <Link to={link.link || '#'}>{link.text}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>{copyright}</p>
          <ul className="flex gap-6">
            {bottomLinks.map((link, linkIdx) => (
              <li key={linkIdx} className="hover:text-foreground transition-colors">
                {link.url && <a href={link.url}>{link.text}</a>}
                {link.link && <Link to={link.link}>{link.text}</Link>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
