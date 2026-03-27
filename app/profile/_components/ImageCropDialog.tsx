"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Upload, ZoomIn } from "lucide-react";
import { useConfirm } from "@/lib/confirm-provider";

interface ImageCropDialogProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onClose: () => void;
}

/**
 * Helper function to create image from cropped area
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

/**
 * Helper function to get cropped image as blob
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to match the crop
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg");
  });
}

export default function ImageCropDialog({
  imageSrc,
  onCropComplete,
  onClose,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { alert: customAlert } = useConfirm();

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleUpload = async () => {
    try {
      setIsProcessing(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
      customAlert({
        title: "Gagal Proses",
        message: "Terjadi kesalahan saat memproses gambar.",
        confirmText: "Oke"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-md flex flex-col rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] overflow-hidden max-h-[90vh]">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-white z-10">
          <h2 className="text-xl font-black text-slate-800">Sesuaikan Foto</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"
          >
            <X className="h-5 w-5 stroke-3" />
          </button>
        </div>

        {/* --- CROPPER AREA --- */}
        <div className="relative flex-1 min-h-[300px] bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round" // Agar user tahu hasilnya bulat (untuk avatar)
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
            style={{
                containerStyle: { background: "#0f172a" },
                cropAreaStyle: { border: "2px solid #10b981" } // Border hijau saat crop
            }}
          />
        </div>

        {/* --- CONTROLS & FOOTER --- */}
        <div className="p-6 bg-white border-t-2 border-slate-100 z-10 space-y-6">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-4">
            <ZoomIn className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={isProcessing}
              className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-2xl font-bold text-slate-600 bg-white border-2 border-slate-200 border-b-4 hover:bg-slate-50 hover:text-slate-800 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-2xl font-bold text-white bg-emerald-500 border-2 border-emerald-600 border-b-4 hover:bg-emerald-400 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Proses...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 stroke-3" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}