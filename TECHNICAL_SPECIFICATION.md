# House of Joshi NFT Launchpad - Technical Specification

## Overview
This document outlines the technical architecture and specifications of the House of Joshi NFT Launchpad, a generative NFT collection creation and deployment platform built for the Base blockchain.

---

## Technology Stack

### Frontend Framework
- **Framework**: Next.js 13.5.1 (App Router)
- **Language**: TypeScript 5.2.2
- **React Version**: 18.2.0

### Styling & UI
- **CSS Framework**: TailwindCSS 3.3.3
- **UI Components**: Radix UI primitives (v1.x - v2.x)
- **Component Library**: shadcn/ui (custom components built on Radix)
- **Animations**: Framer Motion 12.40.0
- **Icons**: Lucide React 0.446.0

### State Management
- **Global State**: Zustand 5.0.14 with persistence middleware
- **Form State**: React Hook Form 7.53.0 with Zod 3.23.8 validation

### Blockchain & Web3
- **Wallet Connection**: RainbowKit 2.2.11
- **Web3 Library**: Wagmi 2.19.5
- **Ethereum Utilities**: Viem 2.53.1
- **Alternative Library**: Ethers.js 6.17.0
- **Query Management**: TanStack Query 5.101.1

### 3D & Graphics
- **3D Engine**: Three.js 0.163.0
- **React Integration**: React Three Fiber 8.16.8
- **3D Helpers**: React Three Drei 9.105.4

### Storage & Database
- **IPFS Provider**: Pinata 2.5.6 (JWT authentication)
- **Backend Database**: Supabase (PostgreSQL)
- **Supabase SDK**: @supabase/supabase-js 2.58.0

### Additional Libraries
- **Charts**: Recharts 2.12.7
- **Date Handling**: date-fns 3.6.0
- **QR Codes**: qrcode.react 3.2.0
- **Theme**: next-themes 0.3.0

---

## Blockchain Configuration

### Supported Networks
- **Base Mainnet**: Chain ID 8453, RPC: https://mainnet.base.org
- **Base Sepolia Testnet**: Chain ID 84532, RPC: https://sepolia.base.org

### Deployed Contracts
- **Factory Contract**: 0x81B85DbfF8962EBd4CF610EaDD5398913B0405c1 (on Base)

---

## Smart Contract Architecture

### Contract Stack
- **Solidity Version**: ^0.8.20
- **OpenZeppelin Contracts**: 
  - ERC721
  - ERC721Enumerable
  - ERC721URIStorage
  - Ownable
  - ReentrancyGuard

### Factory Contract (NFTFactory)
**Purpose**: Deploys new NFT collection contracts

**Key Features**:
- Deployment fee mechanism (0.0001 ETH default)
- Creator whitelisting system
- Fee recipient management
- Automatic ownership transfer to creator
- Excess ETH refund

**Functions**:
- `createCollection(CollectionParams)` - Deploys new RoyalNFT contract
- `setDeploymentFee(uint256)` - Update deployment fee
- `setFeeRecipient(address)` - Update fee recipient
- `setCreatorWhitelist(address, bool)` - Manage creator whitelist
- `withdrawFees()` - Withdraw accumulated fees

### NFT Contract (RoyalNFT)
**Purpose**: Individual NFT collection with minting capabilities

**Key Features**:
- Max supply: 10,000 NFTs
- Time-gated minting (start/end windows)
- Configurable mint price
- Royalty support (EIP-2981 compliant)
- Referral system (5% of mint value)
- Reentrancy protection
- Owner controls for price, URI, and mint windows

**State Variables**:
- `MAX_SUPPLY`: 10,000 (constant)
- `mintPrice`: Configurable mint price in wei
- `mintStartTime`: Unix timestamp for mint start
- `mintEndTime`: Unix timestamp for mint end
- `baseTokenURI`: IPFS base URI for metadata
- `royaltyPercentage`: Royalty in basis points (max 1000 = 10%)
- `royaltyRecipient`: Address receiving royalties
- `referralMints`: Mapping tracking referral mint counts
- `referralRewards`: Mapping tracking referral rewards

**Functions**:
- `mint(uint256 quantity, address referral)` - Mint NFTs with referral
- `setBaseURI(string)` - Update metadata base URI
- `setMintPrice(uint256)` - Update mint price
- `setMintWindow(uint256, uint256)` - Update mint time window
- `withdraw()` - Withdraw contract balance to owner
- `withdrawReferralRewards(address)` - Withdraw referral rewards
- `totalMinted()` - View total minted count
- `remainingSupply()` - View remaining supply
- `royaltyInfo(uint256, uint256)` - EIP-2981 royalty info

---

## IPFS Integration

### Pinata Configuration
- **API Endpoint**: https://api.pinata.cloud
- **Authentication**: JWT Bearer token
- **Gateway**: https://gateway.pinata.cloud/ipfs/{hash}

### Upload Functions
1. **File Upload**: `uploadFileToIPFS(file)` - Upload images/assets
2. **JSON Upload**: `uploadJSONToIPFS(jsonObject, name)` - Upload metadata
3. **Collection Metadata**: `generateAndUploadCollectionMetadata()` - Full collection metadata generation

### Metadata Structure
**Contract Metadata**:
```json
{
  "name": "Collection Name",
  "description": "Description",
  "image": "ipfs://...",
  "banner_image": "ipfs://...",
  "external_link": "https://thehouseofjoshi.com",
  "seller_fee_basis_points": 500,
  "fee_recipient": "0x..."
}
```

**NFT Metadata**:
```json
{
  "name": "Collection Name #1",
  "description": "Description",
  "image": "ipfs://...",
  "attributes": [
    { "trait_type": "Edition", "value": "1/100" }
  ]
}
```

---

## Database Schema (Supabase)

### Tables
1. **users** - User profiles
   - wallet_address (primary)
   - username, bio, avatar_url, banner_url
   - social handles (twitter, farcaster, website)

2. **collections** - NFT collections
   - contract_address (primary)
   - creator_id (foreign key to users)
   - name, symbol, description
   - max_supply, mint_price_eth, mint_price_wei_wei
   - royalty_percentage, royalty_recipient
   - banner_url, cover_image_url, logo_url
   - external_url, twitter_url, discord_url
   - deployment_tx_hash, is_public, is_verified, status
   - deployed_at, created_at

3. **layers** - Generative layers
   - collection_id (foreign key)
   - name, order_index, is_required

4. **traits** - Layer traits
   - layer_id (foreign key)
   - name, image_url, rarity_weight, is_unique

5. **nfts** - Generated NFTs
   - collection_id (foreign key)
   - token_id, dna, name, description
   - image_url, attributes, rarity_score
   - is_minted

6. **analytics_events** - Event tracking
   - collection_id, event_type, event_data
   - wallet_address, referral_wallet

7. **mint_transactions** - Mint records
   - collection_id, wallet_address, quantity
   - amount_eth, amount_wei, referral_wallet
   - tx_hash, token_id, status, confirmed_at

8. **referral_stats** - Referral tracking
   - collection_id, referrer_wallet
   - total_mints, total_rewards

---

## State Management (Zustand)

### Stores
1. **Wallet Store** - Wallet connection state
   - address, chainId, isConnected, isConnecting
   - setAddress, setChainId, disconnect

2. **User Store** - User profile state
   - user, isLoading
   - setUser, setLoading

3. **Generator Store** - NFT generation state
   - collection, layers, traits, generatedNFTs
   - isGenerating, generationProgress
   - CRUD operations for layers/traits

4. **Collections Store** - Deployed collections
   - deployedCollections (persisted)
   - addDeployedCollection, getCollectionsByCreator

5. **UI Store** - UI preferences
   - isMobileMenuOpen, theme
   - setMobileMenuOpen, toggleMobileMenu, setTheme

6. **Referral Store** - Referral system
   - referralCode, referralLink, referralRewards, referralCount
   - generateReferralCode from wallet address

---

## Generative NFT System

### Layer-Based Generation
- **Layers**: Ordered components (background, body, accessories, etc.)
- **Traits**: Individual assets within each layer
- **Rarity**: Weight-based random selection
- **DNA**: Unique identifier for each generated combination

### Data Structures
```typescript
interface Layer {
  id: string;
  name: string;
  order: number;
  traits: Trait[];
  isRequired: boolean;
}

interface Trait {
  id: string;
  name: string;
  file: File | null;
  preview: string;
  rarity: number;
}
```

---

## Key Application Features

### 1. Launchpad (Collection Creation)
- Multi-step form for collection details
- Layer and trait management interface
- Image upload with preview
- IPFS metadata generation
- Smart contract deployment via factory

### 2. Dashboard
- Creator-specific collection view
- Statistics (collections, NFTs minted, volume, royalties)
- Collection management (edit metadata)
- Activity feed

### 3. Collections Page
- Public collection browsing
- Filtering and search
- Collection detail pages
- Verification status display

### 4. Mint Page
- Time-gated minting interface
- Referral code input
- Real-time supply tracking
- Wallet connection and transaction handling

### 5. 3D Model Viewer
- Three.js integration for 3D NFT preview
- Interactive model controls
- Support for GLB/GLTF formats

---

## Security Features

### Smart Contract Security
- ReentrancyGuard on all external functions
- Ownable access control
- Input validation on all parameters
- Safe payment handling with checks-effects-interactions
- Emergency withdraw functions

### Frontend Security
- Environment variable protection
- Content Security Policy headers
- X-Frame-Options: DENY
- X-XSS-Protection
- Input validation with Zod schemas

### Web3 Security
- RainbowKit for secure wallet connections
- Transaction simulation before signing
- Network validation (Base only)
- Contract verification via Basescan API

---

## Deployment Configuration

### Next.js Config
- ESLint disabled during builds
- Image optimization disabled (for IPFS compatibility)
- SWC minification enabled
- Custom webpack configuration for Node.js polyfills
- Security headers configured

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
PINATA_JWT
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
```

---

## API Routes

### Contract Verification
- **Endpoint**: `/api/verify-contract`
- **Purpose**: Verify deployed contracts on Basescan
- **Method**: POST
- **Parameters**: contract address, chain ID, constructor args

---

## Build & Development

### Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript type checking

### Build Output
- Static pages for marketing routes
- Server-side rendering for dynamic routes
- Optimized bundles with code splitting
- Image optimization for static assets

---

## Future AI Integration Considerations

For building an AI-powered generator, consider:

1. **AI Image Generation**: Replace manual trait uploads with AI-generated assets
2. **Intelligent Rarity**: Use AI to calculate optimal rarity distributions
3. **Auto-Description**: AI-generated collection and NFT descriptions
4. **Style Transfer**: AI-based layer style consistency
5. **Quality Scoring**: AI evaluation of generated NFT aesthetics
6. **Market Analysis**: AI-driven pricing recommendations
7. **Trend Prediction**: AI analysis of current NFT market trends

---

## Contact Information
- **Project**: House of Joshi Launchpad
- **URL**: https://royalmint.app
- **Email**: support@thehouseofjoshi.com
- **Twitter**: @thehouseofjoshi
- **Discord**: https://discord.com/invite/uH9zVeAwDu

---

*Document Version: 1.0*
*Last Updated: July 2026*
