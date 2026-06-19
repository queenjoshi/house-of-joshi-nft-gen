'use client';

import { Crown, Mail, MessageSquare, Phone, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message and we\'ll get back to you within 24 hours.',
    action: 'support@royalmint.app',
    link: 'mailto:support@royalmint.app',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Get instant answers from our support team during business hours.',
    action: 'Chat Now',
    link: '#',
  },
  {
    icon: Phone,
    title: 'Discord Community',
    description: 'Connect with other creators and get community support.',
    action: 'Join Discord',
    link: 'https://discord.gg/royalmint',
  },
];

const RESOURCES = [
  { title: 'Documentation', href: '/docs', icon: 'book' },
  { title: 'API Reference', href: '/api', icon: 'code' },
  { title: 'FAQ', href: '/faq', icon: 'help' },
  { title: 'Blog', href: '#', icon: 'news' },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-crown" />
            <h1 className="text-4xl md:text-5xl font-display font-bold gold-text">
              Help Center
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help. Choose how you'd like to reach us.
          </p>
        </motion.div>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {SUPPORT_CHANNELS.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <motion.a
                key={channel.title}
                href={channel.link}
                target={channel.link.startsWith('http') ? '_blank' : undefined}
                rel={channel.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="royal-card group hover:border-crown/50 transition-all cursor-pointer"
              >
                <div className="p-3 bg-crown/10 rounded-lg mb-4 w-fit group-hover:bg-crown/20 transition-colors">
                  <Icon className="h-6 w-6 text-crown" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  {channel.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {channel.description}
                </p>
                <div className="flex items-center gap-2 text-crown text-sm font-medium group-hover:gap-3 transition-all">
                  {channel.action}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* Status & Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="royal-card mb-16 p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h3 className="font-display font-semibold">Support Status</h3>
              </div>
              <p className="text-muted-foreground">
                All systems operational. Our team is ready to assist you.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-crown" />
                <h3 className="font-display font-semibold">Business Hours</h3>
              </div>
              <p className="text-muted-foreground">
                Monday - Friday: 9 AM - 6 PM EST
                <br />
                Saturday - Sunday: Community Support Available
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-2xl font-display font-semibold mb-8">Quick Resources</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RESOURCES.map((resource) => (
              <Link key={resource.href} href={resource.href}>
                <Button
                  variant="outline"
                  className="w-full hover:border-crown/50 hover:text-crown transition-colors"
                >
                  {resource.title}
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
