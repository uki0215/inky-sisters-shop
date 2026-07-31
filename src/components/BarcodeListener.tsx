'use client';

import { useEffect, useRef } from 'react';

interface BarcodeListenerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeListener({ onScan }: BarcodeListenerProps) {
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Barcode scanners input characters very rapidly (< 50ms per key)
      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 6) {
          onScan(barcodeBufferRef.current);
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        if (timeDiff > 100) {
          // Reset buffer if delay is too long (human typing)
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);

  return null;
}
