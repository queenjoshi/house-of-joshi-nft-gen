'use client';

import { Crown, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useState } from 'react';

const FAQS = [
  {
    question: 'What is House of Joshi Launchpad?',
    answer: 'House of Joshi Launchpad is a premier NFT launchpad platform on the Base blockchain that allows creators to easily create, launch, and mint generative NFT collections with royalty-themed aesthetics.',
  },
  {
    question: 'How do I get started?',
    answer: 'Simply connect your wallet, navigate to the Launchpad section, set up your collection parameters, and deploy. Our step-by-step guide will walk you through the entire process.',
  },
  {
    question: 'What blockchain does House of Joshi Launchpad use?',
    answer: 'House of Joshi Launchpad operates on the Base blockchain, which provides fast transactions, low fees, and high security for NFT deployments.',
  },
  {
    question: 'Can I set custom royalty rates?',
    answer: 'Yes! House of Joshi Launchpad allows you to set custom royalty percentages for your collections. Your royalties are automatically distributed when your NFTs are resold.',
  },
  {
    question: 'Is there a fee to launch a collection?',
    answer: 'House of Joshi Launchpad charges competitive fees. Check our pricing page or dashboard for the most current fee structure.',
  },
  {
    question: 'How do I track my collection performance?',
    answer: 'Use our comprehensive Dashboard to monitor sales, view analytics, track royalties, and manage your collections in real-time.',
  },
  {
    question: 'What support options are available?',
    answer: 'We offer multiple support channels including documentation, FAQ, help center, and direct support contact. Visit our Help Center for detailed assistance.',
  },
  {
    question: 'Can I modify my collection after launch?',
    answer: 'Certain collection parameters can be adjusted post-launch. Visit the Documentation for specific details about what can be modified.',
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
}

function FAQItem({ question, answer, index }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="royal-card overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-royal-500/5 transition-colors"
      >
        <h3 className="font-display font-semibold text-left text-foreground">
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown className="h-5 w-5 text-crown" />
        </motion.div>
      </button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 text-muted-foreground">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FAQPage() {
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
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about House of Joshi Launchpad, launching collections, and using our platform.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, index) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 royal-card text-center py-12"
        >
          <h2 className="text-2xl font-display font-semibold mb-4">
            Didn&apos;t find your answer?
          </h2>
          <p className="text-muted-foreground mb-6">
            Visit our Help Center or contact our support team directly.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
