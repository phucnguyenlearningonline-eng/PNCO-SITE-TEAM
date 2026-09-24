import React, { useState, useRef, useEffect } from 'react';
import { Camera, Clipboard, Upload, X, Check, Image as ImageIcon, RefreshCw, Scissors, Sparkles } from 'lucide-react';

interface SnapToolModalProps {
  materialCode: string;
  materialName?: string;
  currentImage?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyImage: (imageDataUrl: string) => void;
}

export const SnapToolModal: React.FC<SnapToolModalProps> = ({
  materialCode,
  materialName,
  currentImage,
  isOpen,
  onClose,
  onApplyImage,
}) => {
  const [activeMode, setActiveMode] = useState<'clipboard' | 'camera' | 'upload'>('clipboard');
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lắng nghe sự kiện Paste (Ctrl+V) toàn cục khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setPreviewImage(event.target.result as string);
                setActiveMode('clipboard');
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  // Bật/tắt camera khi chuyển sang tab camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeMode, isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Không thể mở camera (chưa cấp quyền hoặc thiết bị không hỗ trợ). Hãy dùng chức năng Dán (Ctrl+V) hoặc Tải ảnh lên.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Thêm watermark nhận dạng mã vật tư
    ctx.fillStyle = 'rgba(16, 39, 66, 0.85)';
    ctx.fillRect(10, 10, 180, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${materialCode}`, 20, 35);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SNAP TOOL VERIFIED', 100, 35);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (previewImage) {
      onApplyImage(previewImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#102742] text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Snap Tool — Nhận Dạng Hình Ảnh Vật Tư</span>
                <span className="bg-sky-500 text-white font-mono text-xs px-2 py-0.5 rounded font-extrabold">
                  {materialCode}
                </span>
              </h3>
              {materialName && <p className="text-xs text-slate-300 truncate max-w-sm">{materialName}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveMode('clipboard')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'clipboard'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Clipboard className="w-4 h-4 text-sky-600" />
            <span>Dán Ảnh (Ctrl + V / Snap Tool)</span>
          </button>

          <button
            onClick={() => setActiveMode('camera')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'camera'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Chụp Camera Site</span>
          </button>

          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'upload'
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Tải Ảnh Lên</span>
          </button>
        </div>

        {/* Body content based on active mode */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeMode === 'clipboard' && (
            <div className="space-y-3">
              <div
                tabIndex={0}
                className="border-2 border-dashed border-sky-400 bg-sky-50/50 hover:bg-sky-50 p-6 rounded-xl text-center cursor-pointer focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all group"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-600 mb-2 group-hover:scale-105 transition-transform">
                  <Scissors className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Dán ảnh chụp màn hình từ Snap Tool / Snipping Tool
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  1. Dùng phím tắt <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-2xs font-mono font-bold text-slate-700">Win + Shift + S</kbd> trên máy tính để cắt ảnh vật tư.<br/>
                  2. Bấm vào đây và nhấn tổ hợp phím <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-2xs font-mono font-bold text-slate-700">Ctrl + V</kbd>.
                </p>
                <span className="inline-block mt-3 text-[11px] font-semibold text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
                  Đang sẵn sàng nhận ảnh dán...
                </span>
              </div>
            </div>
          )}

          {activeMode === 'camera' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-300">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {cameraActive && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Chụp Ảnh Ngay (Snap)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeMode === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/30 p-8 rounded-xl text-center cursor-pointer transition-all"
              >
                <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Chọn file ảnh vật tư từ thiết bị</h4>
                <p className="text-xs text-slate-500 mt-1">Hỗ trợ JPG, PNG, WEBP dung lượng tối đa 10MB</p>
                <button
                  type="button"
                  className="mt-3 px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-500"
                >
                  Chọn tập tin
                </button>
              </div>
            </div>
          )}

          {/* Current / Snapped Preview */}
          {previewImage && (
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2 pb-1.5 border-b border-slate-800">
                <span className="font-bold flex items-center gap-1.5 text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ảnh nhận dạng vừa chụp/dán ({materialCode}):
                </span>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-slate-400 hover:text-rose-400 text-[11px]"
                >
                  Xóa bỏ ảnh này
                </button>
              </div>
              <div className="relative rounded-lg overflow-hidden max-h-56 flex items-center justify-center bg-black/40">
                <img
                  src={previewImage}
                  alt={materialCode}
                  className="max-h-56 object-contain rounded"
                />
                <div className="absolute top-2 left-2 bg-[#102742]/90 border border-sky-400 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow">
                  {materialCode}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={!previewImage}
            onClick={handleConfirm}
            className={`px-5 py-2 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all ${
              previewImage
                ? 'bg-sky-600 hover:bg-sky-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Lưu Ảnh Nhận Dạng Cho {materialCode}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
