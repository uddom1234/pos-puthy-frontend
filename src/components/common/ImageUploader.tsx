import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, label }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSelect = () => inputRef.current?.click();

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setDragOver(false);
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const base = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${base}/storage/b2/upload`, { method: 'POST', body: fd });
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await resp.text();
        throw new Error(text || 'Unexpected response from server while uploading');
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Upload failed');
      onChange(data.url);
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const baseDropClass = 'rounded-xl border-2 border-dashed transition-colors overflow-hidden';
  const dropClass = dragOver
    ? `${baseDropClass} border-primary-400 bg-primary-50`
    : `${baseDropClass} border-gray-300 hover:border-primary-300 bg-gray-50`;

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {/* Preview / Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`${dropClass} aspect-square max-w-[180px] sm:max-w-none mx-auto sm:mx-0 w-full flex items-center justify-center relative`}
          title="Drag & drop or click to upload"
          onClick={handleSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }}
        >
          {value ? (
            <>
              <img src={value} alt="product" className="w-full h-full object-cover" />
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <button type="button" className="px-3 py-1.5 bg-white/90 rounded-md text-sm shadow" onClick={(e) => { e.stopPropagation(); handleSelect(); }}>Change</button>
                <button type="button" className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm shadow" onClick={(e) => { e.stopPropagation(); onChange(undefined); }}>Remove</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 text-gray-500 select-none">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 118 0m-4-4V4m6 8a6 6 0 10-12 0 6 6 0 0012 0z" />
              </svg>
              <p className="text-sm">Drop image here or click to upload</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Actions & Help */}
        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSelect} className="btn-primary">{value ? 'Change Image' : 'Upload Image'}</button>
            {value && (
              <button type="button" className="btn-outline" onClick={() => onChange(undefined)}>Remove</button>
            )}
          </div>
          <p className="text-xs text-gray-500">Recommended: square images (e.g. 800×800). JPG/PNG/WebP up to ~5MB.</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default ImageUploader;


