'use client';

import { Crown, ChevronDown, Layers, SlidersHorizontal, Sparkles, ShieldCheck, Rocket, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const HOW_IT_WORKS = [
  {
    icon: Wallet,
    title: '1. Connect your wallet',
    description: 'Connect an EVM wallet and switch to Base. This wallet becomes the owner of the NFT collection you deploy.',
  },
  {
    icon: Layers,
    title: '2. Build your artwork layers',
    description: 'Upload transparent PNG traits in back-to-front order, such as Background, Body, Outfit, Face, and Headwear.',
  },
  {
    icon: SlidersHorizontal,
    title: '3. Set rarity and collection details',
    description: 'Name each trait, adjust its generation weight, then choose your collection name, symbol, supply, mint price, and royalty.',
  },
  {
    icon: Sparkles,
    title: '4. Generate and review',
    description: 'The generator combines weighted traits into unique DNA records. Preview the output and fix supply or layer warnings before launch.',
  },
  {
    icon: ShieldCheck,
    title: '5. Publish metadata',
    description: 'Collection information and NFT metadata are pinned to IPFS so marketplaces and wallets can read decentralized asset data.',
  },
  {
    icon: Rocket,
    title: '6. Deploy and share',
    description: 'Approve the transaction in your wallet. HOJNFTGen creates a separate ERC-721 contract and transfers its ownership to you.',
  },
];

const FAQS = [
  {
    question: 'What is House of Joshi Launchpad?',
    answer: 'House of Joshi Launchpad is a premier NFT launchpad platform on the Base blockchain that allows creators to easily create, launch, and mint generative NFT collections with royalty-themed aesthetics.',
  },
  {
    question: 'How do I get started?',
    answer: 'Prepare transparent PNG files for each trait, connect your wallet, open Launchpad, enter the collection details, upload and order your layers, set rarity weights, generate a preview, and deploy on Base.',
  },
  {
    question: 'How should I prepare layered NFT artwork?',
    answer: 'Use artwork with identical canvas dimensions and transparent backgrounds. Each folder or layer should represent one category, such as Background, Body, Clothing, Eyes, or Headwear. Align every trait to the same canvas before uploading and place layers in back-to-front drawing order.',
  },
  {
    question: 'How does trait rarity work?',
    answer: 'A trait weight controls how often it is selected relative to other traits in the same layer. A higher weight makes a trait more common; a lower weight makes it rarer. The preview audit estimates collection utilization before deployment.',
  },
  {
    question: 'Will every generated NFT be unique?',
    answer: 'The generator creates deterministic DNA from the selected traits and rejects duplicate combinations. Your maximum supply cannot exceed the combinations available from your layers, and restrictive rules can reduce the valid total.',
  },
  {
    question: 'What blockchain does House of Joshi Launchpad use?',
    answer: 'House of Joshi Launchpad operates on the Base blockchain, which provides fast transactions, low fees, and high security for NFT deployments.',
  },
  {
    question: 'Can I set custom royalty rates?',
    answer: 'Yes. You can configure ERC-2981 royalty information up to 10%. Royalty payment depends on whether the marketplace honors the ERC-2981 standard; the contract cannot force every marketplace to pay it.',
  },
  {
    question: 'Is there a fee to launch a collection?',
    answer: 'The current HOJNFTGen factory fee is 0.0001 ETH per collection, plus the Base network gas fee shown by your wallet. The launchpad reads the platform fee directly from the factory contract before deployment.',
  },
  {
    question: 'Who owns the deployed NFT contract?',
    answer: 'The connected creator wallet owns the newly created collection contract. The House factory creates it and immediately transfers ownership to the creator; House of Joshi does not own the creator’s collection.',
  },
  {
    question: 'What can I manage after deployment?',
    answer: 'The collection owner can update the mint price, mint window, base metadata URI, collection metadata URI, and allowlist root, as well as withdraw available mint proceeds. Maximum supply and per-wallet limits are fixed when the collection is created.',
  },
  {
    question: 'What is IPFS, and why is it used?',
    answer: 'IPFS is decentralized content-addressed storage. The launchpad uses IPFS URIs for collection and token metadata so the NFT contract points to durable content rather than files tied to one web server. Creators should keep their content pinned.',
  },
  {
    question: 'Does deployment automatically verify my collection on BaseScan?',
    answer: 'Deployment creates a working onchain ERC-721 contract immediately. Source-code verification is a separate BaseScan step handled after deployment and can require an Etherscan API key. A collection still exists onchain even if its source is awaiting verification.',
  },
  {
    question: 'What happens if deployment fails?',
    answer: 'Read the wallet or launchpad error before retrying. Common causes include the wrong Base network, insufficient ETH for the platform fee and gas, an unconfigured factory address, invalid collection settings, or rejected wallet approval. A reverted transaction does not create a collection.',
  },
  {
    question: 'How do I track my collection performance?',
    answer: 'Open Dashboard with the creator wallet to view collections saved by the launchpad and access their mint pages. Blockchain explorers remain the source of truth for contract ownership and transaction history.',
  },
  {
    question: 'What support options are available?',
    answer: 'Use this guide first, then visit the Contact page if you need help with artwork preparation, wallet connection, IPFS, contract deployment, or verification.',
  },
  {
    question: 'Can I modify my collection after launch?',
    answer: 'Yes, but only owner-controlled settings exposed by the contract can change. The collection name, symbol, maximum supply, and maximum mint-per-wallet are fixed. Mint price, mint window, metadata URIs, and allowlist root can be updated by the owner.',
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
            Learn how to turn layered artwork into a unique NFT collection, deploy it on Base, and manage the mint.
          </p>
        </motion.div>

        <section className="mx-auto mb-20 max-w-6xl" aria-labelledby="how-it-works-title">
          <div className="mb-8 text-center">
            <h2 id="how-it-works-title" className="font-display text-3xl font-bold md:text-4xl">
              How NFT generation works
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
              Your uploaded traits are combined into unique artwork and metadata. The factory then deploys an independent ERC-721 collection owned by your wallet.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  className="royal-card p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gold-500/30 bg-gold-500/10">
                    <Icon className="h-5 w-5 text-crown" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="gold-button">
              <Link href="/launchpad">Start your collection</Link>
            </Button>
            <Button asChild variant="outline" className="royal-border">
              <Link href="/dashboard">Open creator dashboard</Link>
            </Button>
          </div>
        </section>

        {/* FAQ Items */}
        <section className="max-w-3xl mx-auto" aria-labelledby="faq-title">
          <h2 id="faq-title" className="mb-8 text-center font-display text-3xl font-bold">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
          </div>
        </section>

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
            Contact the House of Joshi team for launch, metadata, or contract support.
          </p>
          <Button asChild className="gold-button">
            <Link href="/contact">Contact support</Link>
          </Button>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
