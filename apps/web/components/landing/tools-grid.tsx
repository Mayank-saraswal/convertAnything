import Link from 'next/link';
import { TOOLS, IconMap } from '~/lib/seo';

export function ToolsGrid() {
  return (
    <section className="px-8 py-24 max-w-7xl mx-auto" id="tools">
      <h2 className="mb-4 text-center" style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: 'clamp(32px, 4vw, 52px)',
        fontWeight: 400,
        color: '#000000',
      }}>
        Everything PDF, in one place.
      </h2>
      <p className="mb-16 text-center max-w-xl mx-auto" style={{
        fontFamily: 'Inter, sans-serif',
        color: '#6F6F6F',
        fontSize: '16px',
      }}>
        Ten powerful tools. All free. No signup required for basic operations.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-gray-100 border border-gray-100">
        {TOOLS.map((tool) => {
          const Icon = IconMap[tool.icon];
          return (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              className="group bg-white p-6 transition-colors hover:bg-gray-50 flex flex-col gap-3">
              <span className="text-black">
                {Icon && <Icon className="h-6 w-6" strokeWidth={1.5} />}
              </span>
            <div>
              <div style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: '16px',
                color: '#000000',
              }}>{tool.h1}</div>
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#6F6F6F',
                marginTop: '4px',
              }}>{tool.description.substring(0, 40)}...</div>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
