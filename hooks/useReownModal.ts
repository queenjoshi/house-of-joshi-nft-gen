'use client';

import { useEffect, useState, useCallback } from 'react';

export function useReownModal() {
  const [appKit, setAppKit] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Try to get appKit from window if it exists
    const getAppKit = async () => {
      try {
        console.log('Checking for reownAppKit...');
        if ((window as any).reownAppKit) {
          console.log('Found reownAppKit:', (window as any).reownAppKit);
          setAppKit((window as any).reownAppKit);
          setIsReady(true);
        } else {
          console.warn('reownAppKit not found on window object');
          // Retry after a delay
          setTimeout(getAppKit, 500);
        }
      } catch (error) {
        console.error('Error getting appKit:', error);
      }
    };

    // Wait a bit for appKit to initialize
    const timer = setTimeout(getAppKit, 100);

    return () => clearTimeout(timer);
  }, []);

  const openModal = useCallback(() => {
    console.log('openModal called, appKit:', appKit, 'window.reownAppKit:', (window as any).reownAppKit);
    if (appKit?.open) {
      console.log('Opening modal via appKit.open()');
      appKit.open();
    } else if ((window as any).reownAppKit?.open) {
      console.log('Opening modal via window.reownAppKit.open()');
      (window as any).reownAppKit.open();
    } else {
      console.error('Cannot open modal - appKit not available');
      alert('Wallet connection is not available. Please refresh the page and try again.');
    }
  }, [appKit]);

  const closeModal = useCallback(() => {
    if (appKit?.close) {
      appKit.close();
    } else if ((window as any).reownAppKit?.close) {
      (window as any).reownAppKit.close();
    }
  }, [appKit]);

  const disconnect = useCallback(async () => {
    try {
      if (appKit?.disconnect) {
        await appKit.disconnect();
      } else if ((window as any).reownAppKit?.disconnect) {
        await (window as any).reownAppKit.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, [appKit]);

  const getAddress = useCallback(() => {
    try {
      if (appKit?.getAddress) {
        return appKit.getAddress();
      } else if ((window as any).reownAppKit?.getAddress) {
        return (window as any).reownAppKit.getAddress();
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
    return null;
  }, [appKit]);

  const getChainId = useCallback(() => {
    try {
      if (appKit?.getChainId) {
        return appKit.getChainId();
      } else if ((window as any).reownAppKit?.getChainId) {
        return (window as any).reownAppKit.getChainId();
      }
    } catch (error) {
      console.error('Error getting chain ID:', error);
    }
    return null;
  }, [appKit]);

  return { 
    openModal, 
    closeModal, 
    disconnect,
    getAddress,
    getChainId,
    appKit,
    isReady
  };
}
