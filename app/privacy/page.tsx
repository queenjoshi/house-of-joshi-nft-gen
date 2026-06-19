'use client';

import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function PrivacyPage() {
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
              Privacy Policy
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
                Introduction
              </h2>
              <p>
                House of Joshi Launchpad ("we," "our," or "us") operates the House of Joshi Launchpad website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                1. Information Collection and Use
              </h2>
              <p>
                We collect several different types of information for various purposes to provide and improve our service to you.
              </p>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">
                Types of Data Collected:
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Personal Data:</strong> Email address, wallet address, and other information you voluntarily provide</li>
                <li><strong>Usage Data:</strong> Information about how you access and use the service</li>
                <li><strong>Transaction Data:</strong> Information related to NFT transactions and blockchain interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                2. Use of Data
              </h2>
              <p>
                House of Joshi Launchpad uses the collected data for various purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To allow you to participate in interactive features</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent, and address technical and security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                3. Security of Data
              </h2>
              <p>
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                4. Changes to This Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                5. Blockchain Data
              </h2>
              <p>
                Please note that all blockchain transactions are permanent and publicly visible on the blockchain. Any information you submit through blockchain transactions cannot be deleted or modified.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                6. Third-Party Links
              </h2>
              <p>
                Our service may contain links to other sites that are not operated by us. This Privacy Policy does not apply to third-party websites, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                7. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-4">
                <strong>Email:</strong> support@thehouseofjoshi.com
                <br />
                <strong>Address:</strong> House of Joshi Legal Department
              </p>
            </section>

            <section className="pt-8 border-t border-royal-500/20">
              <p className="text-sm">
                By using House of Joshi Launchpad, you consent to our Privacy Policy.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
