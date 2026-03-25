import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

type NavigationLandingPageProps = {
  badge: string;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
  stats: Array<{
    label: string;
    value: string;
  }>;
  highlights: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
  }>;
};

export function NavigationLandingPage({
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  stats,
  highlights,
}: NavigationLandingPageProps) {
  return (
    <main className="min-h-screen bg-stone-50 pt-36 text-slate-900">
      <section className="border-b border-stone-200 bg-[radial-gradient(circle_at_top,_rgba(202,138,4,0.16),_transparent_40%),linear-gradient(180deg,_#fffef7_0%,_#f8f5ef_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:items-end">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                {badge}
              </span>
              <h1 className="mt-5 font-heading text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                {description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#CA8A04] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B47B04]"
                >
                  {primaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-stone-400 hover:text-slate-950"
                >
                  {secondaryAction.label}
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-stone-200 bg-white/90 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Điểm nổi bật
              </p>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4"
                  >
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <article
                key={highlight.title}
                className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.45)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-heading text-2xl font-semibold text-slate-950">
                  {highlight.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {highlight.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-900/10 bg-slate-950 px-6 py-10 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)] sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            TechNova cam kết
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Trải nghiệm đồng nhất trên mọi điểm chạm của cửa hàng.',
              'Thông tin rõ ràng để khách hàng không phải đoán hoặc hỏi lại.',
              'Điều hướng trực quan để truy cập đúng nội dung chỉ với một lần nhấp.',
              'Mọi liên kết trên thanh điều hướng đều dẫn tới trang thật.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" />
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
