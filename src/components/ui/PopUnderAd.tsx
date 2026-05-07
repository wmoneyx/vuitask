import { useEffect } from 'react';

export function PopUnderAd() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://socialconventcontext.com/e4/f7/75/e4f7759d92f684ee31c3179f8525d4b2.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null;
}
