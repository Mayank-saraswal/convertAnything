import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({
  documentUrl,
  signatureBlob,
  placements,
  onPlacementsChange,
}: {
  documentUrl: string;
  signatureBlob: string | null;
  placements: any[];
  onPlacementsChange: (p: any[]) => void;
}) {
  const [numPages, setNumPages] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePageClick = (e: React.MouseEvent, pageIndex: number) => {
    if (!signatureBlob) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Fixed signature size for demo purposes
    const sigW = 25;
    const sigH = 8;
    
    // Center the signature on click
    const adjustedX = Math.max(0, Math.min(xPct - (sigW / 2), 100 - sigW));
    const adjustedY = Math.max(0, Math.min(yPct - (sigH / 2), 100 - sigH));

    onPlacementsChange([
      {
        pageIndex,
        x: adjustedX,
        y: adjustedY,
        width: sigW,
        height: sigH,
        rotation: 0,
      }
    ]);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-8 pb-32">
      <Document
        file={documentUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        className="flex flex-col gap-8"
        loading={<div className="text-gray-400">Loading document...</div>}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div 
            key={`page_${index + 1}`} 
            className="relative bg-white shadow-xl rounded-sm cursor-crosshair hover:ring-2 ring-black/10 transition-all overflow-hidden"
            onClick={(e) => handlePageClick(e, index)}
          >
            <Page
              pageNumber={index + 1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={800} 
            />
            {placements.filter(p => p.pageIndex === index).map((p, i) => (
              <div
                key={i}
                className="absolute border-2 border-black border-dashed bg-white/50 backdrop-blur-[2px] pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.width}%`,
                  height: `${p.height}%`,
                }}
              >
                {signatureBlob && (
                  <img src={signatureBlob} className="w-full h-full object-contain pointer-events-none" alt="sig" />
                )}
              </div>
            ))}
          </div>
        ))}
      </Document>
    </div>
  );
}
