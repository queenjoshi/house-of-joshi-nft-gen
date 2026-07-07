import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Mail, Instagram } from 'lucide-react';

// Custom X (Twitter) Icon Component
function XIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.868 6.75h-3.308l7.732-8.835L2.882 2.25h6.6l4.759 6.318L17.898 2.25h.346zm-1.106 17.920h1.828L7.884 4.122H5.968l11.170 16.048z" />
    </svg>
  );
}

// Custom Discord Icon Component
function DiscordIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 127.14 96.36" fill="currentColor" className={className}>
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A99.68,99.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0A105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a77.15,77.15,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.22,77,77,0,0,0,6.89,11.1A105.98,105.98,0,0,0,126.75,80.21h0C129.78,52.84,122.34,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60.55,31,54s5-11.75,11.45-11.75S54,47.41,54,54,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60.55,73.25,54s5-11.75,11.44-11.75S96.23,47.41,96.23,54,91.09,65.69,84.69,65.69Z" />
    </svg>
  );
}

const FOOTER_LINKS = {
  product: [
    { label: 'Home', href: '/', external: false },
    { label: 'Collections', href: '/collections', external: false },
    { label: 'Launchpad', href: '/launchpad', external: false },
    { label: 'Dashboard', href: '/dashboard', external: false },
  ],
  resources: [
    { label: 'FAQ', href: '/faq', external: false },
  ],
  services: [
    { label: 'House of Joshi Swap & Bridge', href: 'https://swap.thehouseofjoshi.com/', external: true },
    { label: 'Legacy Vault', href: '/vault', external: false },
    { label: 'DreamWeaver', href: 'https://dreamweaver.thehouseofjoshi.com/', external: true },
    { label: 'Contact', href: '/contact', external: false },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms', external: false },
    { label: 'Privacy Policy', href: '/privacy', external: false },
    { label: 'Cookie Policy', href: '/cookies', external: false },
  ],
};

const FOOTER_SECTIONS = [
  { title: 'Product', links: FOOTER_LINKS.product },
  { title: 'Resources', links: FOOTER_LINKS.resources },
  { title: 'Services', links: FOOTER_LINKS.services },
  { title: 'Legal', links: FOOTER_LINKS.legal },
];

export function Footer() {
  return (
    <footer className="border-t border-royal-500/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,2fr)] lg:grid-cols-[minmax(260px,1.2fr)_minmax(0,2.4fr)] lg:gap-10">
          {/* Brand Column */}
          <div className="max-w-md">
            <Link href="/" className="mb-3 flex min-h-0 min-w-0 items-center gap-2 sm:mb-4">
              <Image 
                src="/joshi-logo.png" 
                alt="Joshi Logo" 
                width={24}
                height={24}
                className="h-5 w-5 sm:h-6 sm:w-6"
              />
              <span className="gold-text font-display text-lg font-bold leading-tight sm:text-xl">
                House of Joshi
              </span>
            </Link>
            <p className="mb-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Create, launch, and mint generative NFT collections on Base.
              The premier NFT launchpad with royalty-themed aesthetics.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="mailto:support@thehouseofjoshi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-md border border-royal-500/20 text-muted-foreground transition-colors hover:border-crown/50 hover:text-crown"
                title="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/thehouseofjoshi"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-md border border-royal-500/20 text-muted-foreground transition-colors hover:border-crown/50 hover:text-crown"
                title="X (Twitter)"
              >
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href="https://discord.com/invite/uH9zVeAwDu"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-md border border-royal-500/20 text-muted-foreground transition-colors hover:border-crown/50 hover:text-crown"
                title="Discord"
              >
                <DiscordIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/thehouseofjoshi"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-md border border-royal-500/20 text-muted-foreground transition-colors hover:border-crown/50 hover:text-crown"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:gap-x-8">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="min-w-0">
                <h3 className="font-display mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:text-sm">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="group flex min-h-0 min-w-0 items-center gap-1.5 text-sm leading-5 text-muted-foreground transition-colors hover:text-crown"
                      >
                        <span className="min-w-0 break-words">{link.label}</span>
                        {link.external && (
                          <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-royal-500/20 pt-5 text-center sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-left lg:mt-12 lg:pt-6">
          <p className="text-xs leading-5 text-muted-foreground">
            &copy; {new Date().getFullYear()} The House of Joshi. All rights reserved.
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Built on Base
          </p>
        </div>
      </div>
    </footer>
  );
}
