import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(202,138,4,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative text-center max-w-md mx-auto">
        <div className="relative mb-6 select-none">
          <span className="text-[9rem] sm:text-[12rem] font-bold tracking-tighter text-gray-400 leading-none block">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#CA8A04]/60 to-transparent" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-12 bg-gray-200" />
          <span className="text-[#CA8A04] text-xs font-semibold tracking-[0.2em] uppercase">Trang không tồn tại</span>
          <div className="h-px w-12 bg-gray-200" />
        </div>
        <h1 className="text-2xl text-gray-900 mb-3 font-bold tracking-tight">
          Rất tiếc, trang này không tồn tại!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Có thể đường dẫn đã thay đổi hoặc trang không còn tồn tại.<br />
          Hãy quay lại trang chủ để tiếp tục khám phá.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gray-900  text-white text-sm font-medium px-7 py-3 rounded-xl transition-colors duration-300 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Trang Chủ
        </Link>
        <p className="mt-8 text-xs text-gray-400 tracking-wide">
          TechNova &nbsp;·&nbsp; Công nghệ cao cấp
        </p>
      </div>
    </div>
  );
}