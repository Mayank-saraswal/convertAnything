import { HeroSection } from "~/components/landing/hero-section";
import { ToolsGrid } from "~/components/landing/tools-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDFvault — Merge, Split, Compress PDF Free Online",
  description:
    "The complete PDF toolkit. Merge, split, compress, convert PDF files for free. No signup required. Privacy first — files deleted in 1 hour.",
  alternates: { canonical: "https://pdfvault.io" },
};

export default function HomePage() {
  return (
    <main className="bg-white">
      <HeroSection />
      <ToolsGrid />
      
      <section className="border-t border-gray-100 py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-normal text-black" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(32px, 4vw, 52px)' }}>
              Why ConvertAnything?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl text-black">
                ⚡
              </div>
              <h3 className="mb-2 text-lg font-semibold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>Lightning Fast</h3>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Optimized processing with BullMQ workers. Your files are ready in seconds,
                not minutes.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl text-black">
                🔒
              </div>
              <h3 className="mb-2 text-lg font-semibold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>Privacy First</h3>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                All files are encrypted in transit. Automatically deleted from our servers
                after 1 hour. GDPR compliant.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl text-black">
                💰
              </div>
              <h3 className="mb-2 text-lg font-semibold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>100% Free</h3>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                No hidden fees, no watermarks, no ads. Use every tool as many times as
                you need without paying.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
