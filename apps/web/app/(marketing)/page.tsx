import Link from "next/link";
import { TOOLS } from "~/lib/seo";
import { ToolCard } from "~/components/tools/tool-card";

export default function HomePage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            100% Free — No Sign Up Required
          </div>

          {/* Title */}
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Every PDF Tool You{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Need
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Merge, split, compress, convert — all your PDF operations in one
            place. Fast, secure, and completely free.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/merge-pdf"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110"
            >
              Start Converting — It&apos;s Free
            </Link>
            <Link
              href="/#all-tools"
              className="rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground transition-all hover:bg-accent"
            >
              View All Tools
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-green-500">🔒</span> SSL Encrypted
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">🗑️</span> Files deleted in 1 hour
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">⚡</span> No registration needed
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">🌍</span> Works everywhere
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section id="all-tools" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              All PDF Tools
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for your PDFs, completely free
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Why ConvertAnything?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                ⚡
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Optimized processing with BullMQ workers. Your files are ready in seconds,
                not minutes.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                🔒
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                All files are encrypted in transit. Automatically deleted from our servers
                after 1 hour. GDPR compliant.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                💰
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">100% Free</h3>
              <p className="text-sm text-muted-foreground">
                No hidden fees, no watermarks, no ads. Use every tool as many times as
                you need without paying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Ready to convert?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No sign up. No credit card. Just drop your files and go.
            </p>
            <Link
              href="/merge-pdf"
              className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-2xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
