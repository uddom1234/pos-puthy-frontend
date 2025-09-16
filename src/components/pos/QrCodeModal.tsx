import React, { useEffect, useRef } from 'react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

// Lightweight QR generator using canvas (no external dep)
// For production-grade QR, consider a library. Here we keep it minimal.
// This implementation uses a tiny fallback to an external API if canvas QR fails.

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try to dynamically import a small QR implementation if available
    const generate = async () => {
      try {
        // @ts-ignore optional local util if present
        const QR = (await import('qrcode')).default; // if qrcode dep exists
        await QR.toCanvas(canvas, url, { width: 256, margin: 2, color: { dark: '#111111', light: '#FFFFFF' } });
      } catch {
        // Fallback to remote API (quick and dependency-free). Cached by browser.
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
      }
    };
    generate();
  }, [isOpen, url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = downloadRef.current;
    if (!link) return;
    const data = canvas.toDataURL('image/png');
    link.href = data;
    link.download = 'smach-cafe-order-preview-qr.png';
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">QR ការកម្មង់</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>
        <div className="p-5 flex flex-col items-center">
          <canvas ref={canvasRef} className="rounded-lg ring-1 ring-gray-200 dark:ring-gray-700" />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 break-all text-center max-w-full">{url}</div>
          <button onClick={handleDownload} className="btn-primary mt-4 px-5 py-2 rounded-xl text-white bg-primary-600">
            ទាញយក QR
          </button>
          <a ref={downloadRef} className="hidden" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;


