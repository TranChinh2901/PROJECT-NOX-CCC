import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import MomoReturnClient from './MomoReturnClient';

export default function MomoReturnPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 py-12 pt-32">
            <div className="mx-auto max-w-2xl px-4">
              <div className="rounded-2xl bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900">MoMo Payment Result</h1>
                <p className="mt-4 text-gray-600">Loading callback data...</p>
              </div>
            </div>
          </div>
        }
      >
        <MomoReturnClient />
      </Suspense>
      <Footer />
    </>
  );
}
