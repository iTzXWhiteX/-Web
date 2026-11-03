import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, X, Check, Loader2, Sparkles } from 'lucide-react';

interface ImageUploadInputProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
  maxDimension?: number;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  sublabel,
  value,
  onChange,
  placeholder = 'https://... أو ارفع صورة مباشرة من جهازك',
  aspectRatio = 'square',
  maxDimension = 1400,
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and compress image using client-side canvas to optimize performance & storage
  const processImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If SVG or GIF, preserve raw data URL to preserve vector/animation
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Try webp first, fallback to jpeg
          try {
            const webpData = canvas.toDataURL('image/webp', 0.88);
            if (webpData.startsWith('data:image/webp')) {
              resolve(webpData);
              return;
            }
          } catch (_) {}

          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const dataUrl = await processImageFile(file);

      // Attempt server-side upload to persist into /uploads directory
      const token = localStorage.getItem('wk_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dataUrl,
          filename: file.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
          return;
        }
      }

      // Extract clear server error (e.g., missing Cloudinary credentials or upload failure)
      const errData = await res.json().catch(() => null);
      const serverMsg = errData?.error || 'فشل رفع الصورة إلى خدمة التخزين السحابي Cloudinary.';
      setUploadError(serverMsg);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'حدث خطأ أثناء الاتصال بالسيرفر لرفع الصورة.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const previewAspectClasses = {
    square: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl',
    video: 'w-36 h-20 sm:w-44 sm:h-24 rounded-2xl',
    banner: 'w-full h-32 sm:h-40 rounded-2xl',
  }[aspectRatio];

  return (
    <div className="space-y-2 text-right">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 uppercase">
            {label}
          </label>
          {sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'upload'
                ? 'bg-cyan-500 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>رفع من الجهاز</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              mode === 'url'
                ? 'bg-cyan-500 text-black shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>رابط خارجي</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Content depending on mode */}
      {mode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,229,255,0.2)]'
              : 'border-slate-700 hover:border-cyan-500/60 bg-slate-900/60 hover:bg-slate-900/90'
          }`}
        >
          {/* Preview or Upload Icon */}
          {value ? (
            <div className={`relative ${previewAspectClasses} bg-black/60 border border-cyan-500/40 overflow-hidden flex-shrink-0 group`}>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-1 left-1 p-1 rounded-lg bg-black/80 text-red-400 hover:text-red-300 hover:bg-red-950/80 transition-all cursor-pointer shadow-md"
                title="حذف الصورة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
              {isUploading ? (
                <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>
          )}

          {/* Upload Text Info */}
          <div className="flex-1 text-center sm:text-right min-w-0">
            {isUploading ? (
              <div className="space-y-1">
                <div className="text-sm font-bold text-cyan-300 flex items-center justify-center sm:justify-start gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري رفع ومعالجة الصورة من جهازك...</span>
                </div>
                <div className="text-xs text-slate-400">يتم ضغط الصورة وتحسينها تلقائياً</div>
              </div>
            ) : value ? (
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>تم تعيين الصورة بنجاح!</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  اضغط هنا لاختيار صورة أخرى من جهازك أو سحب ملف جديد.
                </p>
                <div className="text-[10px] font-mono text-cyan-300/80 truncate max-w-xs mt-0.5" dir="ltr">
                  {value.includes('cloudinary.com') ? (
                    <span className="text-cyan-400 font-semibold flex items-center gap-1">
                      <span>☁️ Cloudinary:</span>
                      <span className="truncate">{value}</span>
                    </span>
                  ) : value.startsWith('data:') ? (
                    <span className="text-amber-400">صورة محلية (Base64)</span>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm font-bold text-white group-hover:text-cyan-300 flex items-center justify-center sm:justify-start gap-2">
                  <span>اضغط لاختيار صورة من جهازك</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">تصفح الملفات</span>
                </div>
                <p className="text-xs text-slate-400">
                  أو اسحب وأفلت ملف الصورة هنا (PNG, JPG, WEBP, GIF, SVG)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual URL Mode */
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono text-left focus:border-cyan-400 focus:outline-none"
                dir="ltr"
              />
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute left-2.5 top-2.5 p-1 text-slate-400 hover:text-white"
                  title="مسح الرابط"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {value && (
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0">
                <img src={value} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            يمكنك لصق رابط مباشر من Discord CDN أو Unsplash أو Imgur.
          </p>
        </div>
      )}

      {/* Error / Success Feedback */}
      {uploadError && (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
          {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-3.5 h-3.5 flex-shrink-0" />
          <span>تم رفع الصورة وتعيينها بنجاح!</span>
        </div>
      )}
    </div>
  );
};
