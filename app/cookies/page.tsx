'use client';

import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-crown" />
            <h1 className="text-4xl md:text-5xl font-display font-bold gold-text">
              Cookie Policy
            </h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto prose prose-invert"
        >
          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                What Are Cookies?
              </h2>
              <p>
                Cookies are small pieces of data stored on your browser or device. They are widely used by website owners to make their websites work or work more efficiently, as well as to provide reporting information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                How We Use Cookies
              </h2>
              <p>
                Royal Mint uses cookies and similar tracking technologies to track activity on our service and hold certain information. We use this information to:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>Remember your preferences and settings</li>
                <li>Understand how you interact with our service</li>
                <li>Improve the performance of our website</li>
                <li>Provide personalized content and advertisements</li>
                <li>Analyze traffic and user behavior</li>
                <li>Maintain security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Types of Cookies We Use
              </h2>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                Essential Cookies
              </h3>
              <p>
                These cookies are necessary for the website to function properly. They enable core functionality such as security, user authentication, and basic site navigation.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                Analytics Cookies
              </h3>
              <p>
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                Preference Cookies
              </h3>
              <p>
                These cookies remember your choices to provide a personalized experience, such as language preferences or theme settings.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                Marketing Cookies
              </h3>
              <p>
                These cookies track your activity to show you relevant advertisements and marketing content tailored to your interests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Managing Cookies
              </h2>
              <p>
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work as intended.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                Browser Settings
              </h3>
              <p>
                Most web browsers allow some level of control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit www.allaboutcookies.org.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Third-Party Cookies
              </h2>
              <p>
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and off the website, and so on.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Changes to This Policy
              </h2>
              <p>
                Royal Mint may update this Cookie Policy at any time. We will notify you of any changes by posting the new Cookie Policy on this page.
              </p>
            </section>

            <section className="pt-8 border-t border-royal-500/20">
              <p className="text-sm">
                For any questions about this Cookie Policy, please contact us at cookies@royalmint.app
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
