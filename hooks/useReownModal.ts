'use client';

import { useEffect, useState } from 'react';

export function useReownModal() {
  const [appKit, setAppKit] = useState<any>(null);

  useEffect(() => {
    // Try to get appKit from window if it exists
    const getAppKit = async () => {
      try {
        if ((window as any).reownAppKit) {
          setAppKit((window as any).reownAppKit);
        }
      } catch (error) {
        console.error('Error getting appKit:', error);
      }
    };

    // Wait a bit for appKit to initialize
    const timer = setTimeout(getAppKit, 100);

    return () => clearTimeout(timer);
  }, []);

  const openModal = () => {
    if (appKit?.open) {
      appKit.open();
    } else if ((window as any).reownAppKit?.open) {
      (window as any).reownAppKit.open();
    }
  };

  return { openModal };
}
