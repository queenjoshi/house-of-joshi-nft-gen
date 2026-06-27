'use client';

import { Crown, Mail, MapPin, Phone, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

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
              Get in Touch
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="royal-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-crown/10 rounded-lg">
                  <Mail className="h-6 w-6 text-crown" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">Email</h3>
                  <a
                    href="mailto:support@thehouseofjoshi.com"
                    className="text-sm text-muted-foreground hover:text-crown transition-colors"
                  >
                    support@thehouseofjoshi.com
                  </a>
                </div>
              </div>
            </div>

            <div className="royal-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-crown/10 rounded-lg">
                  <XIcon className="h-6 w-6 text-crown" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">X (Twitter)</h3>
                  <a
                    href="https://twitter.com/thehouseofjoshi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-crown transition-colors"
                  >
                    @thehouseofjoshi
                  </a>
                </div>
              </div>
            </div>

            <div className="royal-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-crown/10 rounded-lg">
                  <DiscordIcon className="h-6 w-6 text-crown" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">Discord</h3>
                  <a
                    href="https://discord.com/invite/uH9zVeAwDu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-crown transition-colors"
                  >
                    Join the community
                  </a>
                </div>
              </div>
            </div>

            <div className="royal-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-crown/10 rounded-lg">
                  <Instagram className="h-6 w-6 text-crown" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">Instagram</h3>
                  <a
                    href="https://instagram.com/thehouseofjoshi_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-crown transition-colors"
                  >
                    @thehouseofjoshi_
                  </a>
                </div>
              </div>
            </div>

            <div className="royal-card p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-crown/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-crown" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Operating globally
                    <br />
                    Base Chain
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 royal-card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="bg-black/20 border-royal-500/30 focus:border-crown"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="bg-black/20 border-royal-500/30 focus:border-crown"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this about?"
                  required
                  className="bg-black/20 border-royal-500/30 focus:border-crown"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  required
                  rows={6}
                  className="bg-black/20 border-royal-500/30 focus:border-crown resize-none"
                />
              </div>

              <Button type="submit" className="gold-button w-full">
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>

        {/* FAQ Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="royal-card p-8 text-center"
        >
          <h2 className="text-2xl font-display font-semibold mb-4">Quick Help</h2>
          <p className="text-muted-foreground mb-6">
            Check our FAQ or documentation for instant answers.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/faq">
              <Button variant="outline">FAQ</Button>
            </a>
            <a href="/docs">
              <Button variant="outline">Documentation</Button>
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
