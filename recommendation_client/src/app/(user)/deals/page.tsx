import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  Clock3,
  Gamepad2,
  Headphones,
  Laptop,
  ShieldCheck,
  Smartphone,
  Truck,
} from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

const dealCategories = [
  {
    title: 'Laptop hiệu năng',
    description: 'Giảm sâu cho máy phục vụ học tập, sáng tạo và làm việc dài giờ.',
    href: '/?category=laptop#catalog',
    icon: Laptop,
    badge: 'Tới 30%',
  },
  {
    title: 'Âm thanh di động',
    description: 'Tai nghe, loa và phụ kiện âm thanh đang được ưu tiên giá tốt.',
    href: '/?category=am-thanh#catalog',
    icon: Headphones,
    badge: 'Flash deal',
  },
  {
    title: 'Góc gaming',
    description: 'PC, màn hình và gear RGB dành cho setup giải trí hiện đại.',
    href: '/?category=gaming#catalog',
    icon: Gamepad2,
    badge: 'Hot nhất',
  },
  {
    title: 'Thiết bị di động',
    description: 'Điện thoại và tablet có combo quà tặng, giao nhanh trong ngày.',
    href: '/?category=dien-thoai#catalog',
    icon: Smartphone,
    badge: 'Kèm quà',
  },
];

const curatedDeals = [
  {
    title: 'Ưu đãi trọn bộ cho góc làm việc',
    description:
      'Lựa chọn phù hợp cho nhu cầu làm việc và học tập với mức giá tốt trên laptop, màn hình và phụ kiện đi kèm.',
    href: '/?category=laptop#catalog',
    imageSrc: '/hero/workspace.jpg',
    discount: 'Giảm đến 30%',
    meta: 'Laptop • Màn hình • Phụ kiện',
  },
  {
    title: 'Ưu đãi âm thanh di động',
    description:
      'Tập trung vào tai nghe, loa di động và phụ kiện âm thanh phù hợp cho nhu cầu sử dụng hằng ngày.',
    href: '/?category=am-thanh#catalog',
    imageSrc: '/hero/audio.jpg',
    discount: 'Deal ngắn hạn',
    meta: 'Tai nghe • Loa • Combo quà',
  },
  {
    title: 'Ưu đãi dành cho góc gaming',
    description:
      'Tổng hợp các sản phẩm được quan tâm nhiều gồm gear RGB, màn hình tốc độ cao và thiết bị chơi game thế hệ mới.',
    href: '/?category=gaming#catalog',
    imageSrc: '/hero/gaming.jpg',
    discount: 'Ưu đãi theo mùa',
    meta: 'Console • Gear • Màn hình',
  },
];

const shoppingSignals = [
  {
    label: 'Deal nổi bật',
    value: 'Cập nhật mỗi ngày',
    icon: Clock3,
  },
  {
    label: 'Giao hàng',
    value: 'Rõ mốc, dễ theo dõi',
    icon: Truck,
  },
  {
    label: 'Cam kết',
    value: 'Thông tin giá minh bạch',
    icon: ShieldCheck,
  },
];

export default function DealsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pb-16 pt-28 sm:pt-32">
        <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
                  Khuyến mãi hôm nay
                </p>
                <h1 className="mt-1.5 font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
                  Ưu đãi nổi bật trong ngày dành cho những danh mục được quan tâm nhiều nhất.
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 sm:text-base">
                  Theo dõi nhanh các chương trình giảm giá, quà tặng kèm và nhóm sản phẩm đáng mua
                  để đưa ra quyết định thuận tiện hơn.
                </p>
              </div>
              <Link
                href="/#catalog"
                className="hidden items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 lg:inline-flex"
              >
                Xem toàn bộ catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <Link
                href="/?category=laptop#catalog"
                className="group relative min-h-[340px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#0d1117] lg:min-h-[400px]"
              >
                <div className="absolute inset-0">
                  <Image
                    src="/hero/workspace.jpg"
                    alt="Deal workspace"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover opacity-45 transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-end p-8 lg:p-10">
                  <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/30 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                    <BadgePercent className="h-3.5 w-3.5" />
                    Deal đầu trang
                  </span>
                  <h2 className="mb-3 max-w-md font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
                    Ưu đãi nổi bật cho thiết bị làm việc và học tập.
                  </h2>
                  <p className="mb-6 max-w-lg text-sm leading-6 text-gray-300">
                    Tập trung vào laptop, màn hình và phụ kiện cần thiết cho một không gian làm
                    việc hiệu quả với mức giá ưu đãi trong ngày.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition group-hover:bg-amber-400">
                      Mua sắm ngay
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white/90">
                      Giảm đến 30% cho các thiết lập chọn lọc
                    </span>
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                {curatedDeals.slice(1).map((deal) => (
                  <Link
                    key={deal.title}
                    href={deal.href}
                    className="group relative min-h-[160px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 transition hover:opacity-95"
                  >
                    <div className="absolute inset-0">
                    <Image
                      src={deal.imageSrc}
                      alt={deal.title}
                      fill
                      loading="eager"
                      sizes="340px"
                      className="object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
                    />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    </div>
                    <div className="relative z-10 flex h-full flex-col justify-end p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                        {deal.discount}
                      </p>
                      <h3 className="mt-2 font-heading text-lg font-bold text-white">{deal.title}</h3>
                      <p className="mt-1 text-xs text-gray-300">{deal.meta}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">Ưu đãi theo danh mục</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Chọn nhanh chương trình phù hợp theo nhu cầu mua sắm của bạn.
                </p>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                Quay về trang chủ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
              {dealCategories.map((category) => {
                const Icon = category.icon;

                return (
                  <Link
                    key={category.title}
                    href={category.href}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition group-hover:bg-amber-100 group-hover:text-amber-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                        {category.badge}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-gray-900">{category.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{category.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">
                Đáng chú ý
              </p>
              <h2 className="mt-1.5 font-heading text-xl font-bold text-gray-900">
                Các chương trình ưu đãi được sắp xếp rõ ràng theo từng nhóm nhu cầu.
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {curatedDeals.map((deal) => (
                <article
                  key={deal.title}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <Image
                      src={deal.imageSrc}
                      alt={deal.title}
                      fill
                      loading="eager"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                      {deal.discount}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                      {deal.meta}
                    </p>
                    <h3 className="mt-2 font-heading text-xl font-bold text-gray-900">{deal.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-500">{deal.description}</p>
                    <Link
                      href={deal.href}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
                    >
                      Đi tới deal này
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.65)] sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                    Tín hiệu mua sắm
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-bold">
                    Thông tin ưu đãi được trình bày rõ ràng để khách hàng dễ theo dõi và so sánh.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Mỗi chương trình đều có phạm vi áp dụng, mức ưu đãi và nhóm sản phẩm liên quan
                    để quá trình lựa chọn trở nên nhanh chóng và minh bạch hơn.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  {shoppingSignals.map((signal) => {
                    const Icon = signal.icon;

                    return (
                      <div
                        key={signal.label}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {signal.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">{signal.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
