import Link from 'next/link';
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
    { label: 'Referral', href: '/referral', external: false },
    { label: 'Dashboard', href: '/dashboard', external: false },
  ],
  resources: [
    { label: 'FAQ', href: '/faq', external: false },
  ],
  services: [
    { label: 'House of Joshi Swap & Bridge', href: 'https://swap.thehouseofjoshi.com/', external: true },
    { label: 'Legacy Vault', href: '/vault', external: false },
    { label: 'DreamWeaver', href: '/dreamweaver', external: false },
    { label: 'Contact', href: '/contact', external: false },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms', external: false },
    { label: 'Privacy Policy', href: '/privacy', external: false },
    { label: 'Cookie Policy', href: '/cookies', external: false },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-royal-500/20 bg-background/80 backdrop-blur-xl">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img 
                src="/joshi-logo.png" 
                alt="Joshi Logo" 
                className="h-6 w-6"
              />
              <span className="font-display text-xl font-bold gold-text">
                House of Joshi
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Create, launch, and mint generative NFT collections on Base.
              The premier NFT launchpad with royalty-themed aesthetics.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:support@thehouseofjoshi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-crown transition-colors"
                title="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/thehouseofjoshi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-crown transition-colors"
                title="X (Twitter)"
              >
                <XIcon className="h-5 w-5" />
              </a>
              <a
                href="https://discord.com/invite/uH9zVeAwDu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-crown transition-colors"
                title="Discord"
              >
                <DiscordIcon className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/thehouseofjoshi_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-crown transition-colors"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              Product
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-muted-foreground hover:text-crown transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              Resources
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-crown transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              Services
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-muted-foreground hover:text-crown transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-foreground">
              Legal
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-crown transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-royal-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} The House of Joshi. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Built on Base
          </p>
        </div>
      </div>
    </footer>
  );
}
