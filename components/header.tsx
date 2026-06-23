'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  Compass,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Compass },
  { href: '/collections', label: 'Collections', icon: Compass },
  { href: '/launchpad', label: 'Launchpad', icon: Sparkles },
  { href: '/referral', label: 'Referral', icon: Users },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();

  return (
    <header className="z-50 w-full border-b border-royal-500/20 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-center gap-2 px-4 md:gap-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 absolute left-4"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-royal-500/20"
          >
            <nav className="container px-4 py-3 flex flex-col gap-2 justify-center">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => useUIStore.getState().setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-royal-500/10 transition-colors text-sm"
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
