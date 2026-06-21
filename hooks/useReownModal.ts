'use client';

import { useEffect, useState, useCallback } from 'react';

export function useReownModal() {
  const [appKit, setAppKit] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Try to get appKit from window if it exists
    const getAppKit = async () => {
      try {
        if ((window as any).reownAppKit) {
          setAppKit((window as any).reownAppKit);
          setIsReady(true);
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
    if (appKit?.open) {
      appKit.open();
    } else if ((window as any).reownAppKit?.open) {
      (window as any).reownAppKit.open();
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
