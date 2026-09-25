import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Scissors,
  Upload,
  Clipboard,
  RotateCw,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';

interface InlineImageCropperProps {
  imageUrl: string;
  materialCode: string;
  onChange: (url: string) => void;
  isModalOpen?: boolean;
}

export const InlineImageCropper: React.FC<InlineImageCropperProps> = ({
  imageUrl,
  materialCode,
  onChange,
  isModalOpen = true,
}) => {
  const [rawImage, setRawImage] = useState<string | null>(imageUrl || null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3'>('free');

  // Crop box normalized [0..1]
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when imageUrl changes externally
  useEffect(() => {
    if (imageUrl && !rawImage) {
      setRawImage(imageUrl);
    }
  }, [imageUrl, rawImage]);

  // Lắng nghe sự kiện Paste (Ctrl+V) trực tiếp khi cửa sổ đang mở
  useEffect(() => {
    if (!isModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Tránh cướp paste nếu người dùng đang nhập vào ô text (trừ khi họ paste hình)
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                const dataUrl = event.target.result as string;
                setRawImage(dataUrl);
                setRotation(0);
                setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
                setIsCropping(true);
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isModalOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setRawImage(dataUrl);
        setRotation(0);
        setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
        setIsCropping(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  // Mouse & Touch events for drawing / adjusting crop box
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setIsDragging(true);
    setDragStart({ x, y });
    setCropBox({ x, y, w: 0.05, h: 0.05 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const currentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    let minX = Math.min(dragStart.x, currentX);
    let minY = Math.min(dragStart.y, currentY);
    let width = Math.abs(currentX - dragStart.x);
    let height = Math.abs(currentY - dragStart.y);

    if (aspectRatio === '1:1') {
      const containerRatio = rect.width / rect.height;
      const size = Math.max(width, height * (1 / containerRatio));
      width = Math.min(size, 1 - minX);
      height = Math.min(size * containerRatio, 1 - minY);
    } else if (aspectRatio === '4:3') {
      const containerRatio = rect.width / rect.height;
      const targetRatio = 4 / 3;
      height = Math.min(width * (1 / targetRatio) * containerRatio, 1 - minY);
    }

    // Minimum size threshold
    if (width > 0.02 && height > 0.02) {
      setCropBox({
        x: Math.max(0, Math.min(minX, 1 - width)),
        y: Math.max(0, Math.min(minY, 1 - height)),
        w: width,
        h: height,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Perform canvas crop
  const executeCrop = useCallback(() => {
    if (!rawImage) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Xử lý góc xoay
      const isRotated90or270 = rotation === 90 || rotation === 270;
      const imgWidth = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      const imgHeight = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      // Tọa độ cắt thực tế theo pixel của ảnh
      const sx = Math.round(cropBox.x * imgWidth);
      const sy = Math.round(cropBox.y * imgHeight);
      const sw = Math.round(cropBox.w * imgWidth);
      const sh = Math.round(cropBox.h * imgHeight);

      if (sw <= 5 || sh <= 5) return;

      // Giới hạn max dimension để tối ưu lưu trữ & tốc độ
      const maxDim = 800;
      let targetW = sw;
      let targetH = sh;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Tạo canvas trung gian nếu có xoay
      if (rotation !== 0) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgWidth;
        tempCanvas.height = imgHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.translate(imgWidth / 2, imgHeight / 2);
          tempCtx.rotate((rotation * Math.PI) / 180);
          tempCtx.drawImage(
            img,
            -img.naturalWidth / 2,
            -img.naturalHeight / 2,
            img.naturalWidth,
            img.naturalHeight
          );
          ctx.drawImage(tempCanvas, sx, sy, sw, sh, 0, 0, targetW, targetH);
        }
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      }

      // Thêm nhãn nhỏ nhận dạng mã vật tư ở góc dưới (tùy chọn)
      ctx.fillStyle = 'rgba(16, 39, 66, 0.75)';
      ctx.fillRect(8, targetH - 26, 120, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(materialCode || 'VT-ITEM', 14, targetH - 12);

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
      onChange(croppedUrl);
      setIsCropping(false);
    };
    img.src = rawImage;
  }, [rawImage, rotation, cropBox, materialCode, onChange]);

  const handleUseWholeImage = () => {
    if (rawImage) {
      onChange(rawImage);
      setIsCropping(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleClearImage = () => {
    setRawImage(null);
    onChange('');
    setIsCropping(false);
  };

  return (
    <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* HEADER KHU VỰC HÌNH ẢNH */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 uppercase flex items-center gap-1.5 text-xs">
          <Scissors className="w-3.5 h-3.5 text-sky-600" />
          <span>Hình Ảnh Nhận Dạng &amp; Cắt Cúp Tại Cửa Sổ</span>
        </label>
        <span className="text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          Hỗ trợ Paste (Ctrl+V) &amp; Cắt trực tiếp
        </span>
      </div>

      {/* NẾU ĐANG TRONG CHẾ ĐỘ CẮT HÌNH TRỰC TIẾP (CROP MODE) */}
      {isCropping && rawImage ? (
        <div className="space-y-2 p-2 bg-slate-900 rounded-lg text-white border border-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-bold text-sky-400 flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5" />
              <span>Kéo chuột trên ảnh để chọn vùng cần cắt</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAspectRatio('free')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  aspectRatio === 'free' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Tự do
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  aspectRatio === '1:1' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                1:1 Vuông
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-0.5 cursor-pointer"
                title="Xoay 90 độ"
              >
                <RotateCw className="w-3 h-3" />
                <span>Xoay</span>
              </button>
            </div>
          </div>

          {/* VÙNG CHỨA ẢNH & KHUNG CẮT TƯƠNG TÁC */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative max-h-56 min-h-[160px] bg-slate-950 flex items-center justify-center overflow-hidden select-none cursor-crosshair rounded border border-slate-800 touch-none"
          >
            <img
              ref={imgRef}
              src={rawImage}
              alt="Source"
              style={{
                transform: `rotate(${rotation}deg)`,
                maxHeight: '220px',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
              className="pointer-events-none"
            />

            {/* Khung cắt (Crop Box Overlay) */}
            <div
              style={{
                position: 'absolute',
                left: `${cropBox.x * 100}%`,
                top: `${cropBox.y * 100}%`,
                width: `${cropBox.w * 100}%`,
                height: `${cropBox.h * 100}%`,
              }}
              className="border-2 border-sky-400 border-dashed bg-sky-500/20 shadow-2xl pointer-events-none ring-1 ring-white/60"
            >
              <div className="absolute top-0 left-0 bg-sky-600 text-white font-mono text-[9px] px-1 font-bold">
                VÙNG CẮT
              </div>
              <div className="absolute top-0 left-0 w-2 h-2 bg-white border border-sky-600" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-white border border-sky-600" />
              <div className="absolute bottom-0 left-0 w-2 h-2 bg-white border border-sky-600" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-white border border-sky-600" />
            </div>
          </div>

          {/* NÚT THAO TÁC CẮT TẠI CỬA SỔ */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsCropping(false)}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              Hủy cắt
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUseWholeImage}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                Dùng nguyên ảnh
              </button>

              <button
                type="button"
                onClick={executeCrop}
                className="px-3.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cắt Vùng Đã Chọn</span>
              </button>
            </div>
          </div>
        </div>
      ) : imageUrl ? (
        /* KHI ĐÃ CÓ HÌNH ẢNH (PREVIEW GỌN GÀNG) */
        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="relative w-12 h-12 rounded-lg border border-slate-300 overflow-hidden bg-slate-900 shrink-0 shadow-2xs group">
              <img src={imageUrl} alt={materialCode} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span>Hình ảnh nhận dạng</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                  Đã cắt sẵn
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Nhấn "Cắt Lại" để điều chỉnh góc hoặc vùng cần lấy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setRawImage(imageUrl);
                setRotation(0);
                setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
                setIsCropping(true);
              }}
              className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Cắt lại hình ảnh này"
            >
              <Scissors className="w-3.5 h-3.5 text-sky-600" />
              <span>Cắt Lại</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Chọn ảnh khác từ máy"
            >
              Đổi ảnh
            </button>

            <button
              type="button"
              onClick={handleClearImage}
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Xóa hình ảnh"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* KHI CHƯA CÓ HÌNH ẢNH (HƯỚNG DẪN DÁN HOẶC TẢI ẢNH) */
        <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-white text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
              <Clipboard className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Upload className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Scissors className="w-4 h-4" />
            </div>
          </div>

          <div className="text-xs">
            <span className="font-bold text-slate-700 block">
              Dán ảnh chụp màn hình (Ctrl + V) hoặc tải ảnh lên để cắt
            </span>
            <span className="text-[11px] text-slate-500">
              Sau khi dán, bạn có thể kéo chuột để cắt đúng chi tiết vật tư ngay tại đây
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải ảnh từ máy / Chụp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
