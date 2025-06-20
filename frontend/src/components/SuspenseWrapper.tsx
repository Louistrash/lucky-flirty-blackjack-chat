import { type ReactNode, Suspense } from "react";

// Loading fallback component voor Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-400 mx-auto mb-4"></div>
      <p className="text-xl text-slate-300">Loading...</p>
    </div>
  </div>
);

export const MainSuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}; 