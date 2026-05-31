import { useEffect, useRef } from "react";
import SignaturePadLibrary from "signature_pad";

export function SignaturePad({ onEnd }: { onEnd: (data: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLibrary | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Setup high DPI canvas
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);

      padRef.current = new SignaturePadLibrary(canvas, {
        minWidth: 1.5,
        maxWidth: 4,
        penColor: "black",
      });

      padRef.current.addEventListener("endStroke", () => {
        if (!padRef.current?.isEmpty()) {
          onEnd(padRef.current!.toDataURL("image/png"));
        }
      });
    }

    return () => {
      padRef.current?.off();
    };
  }, [onEnd]);

  return (
    <div className="relative w-full h-[200px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="absolute inset-x-8 bottom-6 border-b-2 border-dashed border-gray-200 pointer-events-none" />
      <button
        onClick={() => {
          padRef.current?.clear();
          onEnd("");
        }}
        className="absolute top-3 right-3 text-xs font-medium text-gray-400 hover:text-black bg-white rounded-md px-2 py-1 shadow-sm border border-gray-100"
      >
        Clear
      </button>
    </div>
  );
}
