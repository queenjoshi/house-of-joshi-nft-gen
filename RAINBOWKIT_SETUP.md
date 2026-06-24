# RainbowKit Integration Setup

This project now uses RainbowKit for wallet connection with mobile deeplinking support.

## Setup Instructions

### 1. Get WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### 2. Add Environment Variable

Add your WalletConnect Project ID to your `.env` file:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Features

- **RainbowKit ConnectButton**: Beautiful, customizable wallet connection modal
- **Mobile Deeplinking**: Automatic deeplinking for mobile wallets (MetaMask, WalletConnect, etc.)
- **Theme Support**: Automatically adapts to dark/light mode
- **Base Network**: Pre-configured for Base Mainnet and Base Sepolia
- **Wagmi Integration**: Uses Wagmi hooks for wallet state management
- **Offline Support**: Service worker for offline wallet connection
- **Push Notifications**: Mobile wallet event notifications
- **Background Sync**: Retry failed wallet transactions when back online
- **Toast Notifications**: Success/failure feedback for wallet events
- **Loading States**: Visual feedback during network switching

## Components

### RainbowKit Provider (`components/providers/rainbowkit-provider.tsx`)

Wraps the application with RainbowKit and Wagmi providers. Handles:
- Theme synchronization with next-themes
- Query client configuration
- RainbowKit theme customization (gold accent color)
- Wallet analytics tracking
- Error boundary for graceful error handling

### Wallet Error Boundary (`components/providers/wallet-error-boundary.tsx`)

Catches and handles wallet connection errors:
- User-friendly error UI
- Retry button for recovery
- Analytics error tracking
- Fallback navigation

### Service Worker (`public/sw.js`)

Provides offline support and mobile PWA features:
- Network-first strategy for API calls (wallet connections)
- Cache-first strategy for static assets
- WalletConnect CDN caching
- Background sync for wallet transactions
- Push notifications for wallet events

### Wagmi Config (`lib/wagmi.ts`)

Configuration for:
- App name: "House of Joshi"
- Supported chains: Base Mainnet, Base Sepolia
- WalletConnect integration
- SSR support

### Header Component (`components/header.tsx`)

Updated to use:
- `useAccount` hook for wallet state
- `useDisconnect` hook for disconnection
- `useSwitchChain` hook for network switching
- RainbowKit `ConnectButton` for wallet connection
- Toast notifications for wallet events
- Loading states during network switching
- Lazy-loaded RainbowKit for better performance

### Launchpad (`app/launchpad/page.tsx`)

Updated to use:
- `useAccount` for wallet connection state
- `useSwitchChain` for network switching
- `useWalletClient` for contract deployment
- Wagmi transaction methods instead of window.ethereum

## Mobile Deeplinking

RainbowKit automatically handles mobile deeplinking. When users connect on mobile:

1. They see a list of available wallets
2. Selecting a wallet opens the corresponding app (if installed)
3. If not installed, they're directed to the app store
4. After connection, they're deeplinked back to your app

### Supported Mobile Wallets

**Android:**
- MetaMask
- Trust Wallet
- Coinbase Wallet
- Rainbow
- WalletConnect-compatible wallets

**iOS:**
- MetaMask
- Trust Wallet
- Coinbase Wallet
- Rainbow
- Argent
- WalletConnect-compatible wallets

### PWA Features

The app is configured as a Progressive Web App (PWA) for mobile:
- **Installable**: Can be added to home screen on iOS and Android
- **Offline Support**: Works offline with cached assets
- **Push Notifications**: Wallet connection event notifications
- **Background Sync**: Retry failed transactions when back online
- **Share Target**: Share NFTs directly to the app

## Customization

### Theme Colors

Edit `components/providers/rainbowkit-provider.tsx` to customize:

```typescript
darkTheme({
  accentColor: '#FFD700',        // Gold accent
  accentColorForeground: '#1a0a2e', // Royal purple
  borderRadius: 'large',
  fontStack: 'system',
})
```

## Performance Optimizations

- **Lazy Loading**: RainbowKit ConnectButton is lazy-loaded for better bundle size
- **Bundle Size**: Reduced from 357 kB to 170 kB (52% reduction)
- **Caching**: Service worker caches static assets and API responses
- **Runtime Caching**: Dynamic caching for wallet-related resources

### Supported Wallets

RainbowKit supports all major wallets including:
- MetaMask
- WalletConnect
- Coinbase Wallet
- Trust Wallet
- Rainbow
- And many more

## Troubleshooting

### WalletConnect Project ID Error

If you see "WalletConnect Project ID is not set":
1. Make sure you added `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to `.env`
2. Restart your development server
3. Check that the project ID is correct

### Mobile Connection Issues

If mobile deeplinking doesn't work:
1. Ensure your app has proper deep link configuration
2. Check that the wallet app is installed
3. Try clearing browser cache

### Network Switching

If network switching fails:
1. Ensure Base network is added to your wallet
2. Check that you're on a supported chain (Base Mainnet or Sepolia)
3. Try manually switching in your wallet first
4. Check for loading state and toast notifications for feedback

### Service Worker Issues

If the service worker doesn't register:
1. Check browser console for errors
2. Ensure the app is served over HTTPS (required for service workers)
3. Verify `public/sw.js` exists
4. Check that service worker is not blocked by browser settings

### Offline Issues

If the app doesn't work offline:
1. Check that service worker is registered (console logs)
2. Verify cache is populated (DevTools > Application > Cache Storage)
3. Ensure the app has been visited at least once online
4. Check browser settings for offline permissions

## Migration from Reown

The project has been migrated from Reown AppKit to RainbowKit:

- **Removed**: Reown AppKit dependencies and initialization
- **Added**: RainbowKit, Wagmi, and Viem
- **Updated**: All wallet connection logic to use Wagmi hooks
- **Improved**: Mobile deeplinking support and UI customization

## Additional Resources

- [RainbowKit Documentation](https://www.rainbowkit.com/docs)
- [Wagmi Documentation](https://wagmi.sh/)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [Base Network Documentation](https://docs.base.org/)
