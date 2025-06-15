import { type ReactNode, Suspense } from "react";

export const ProdSuspenseWrapper = ({ children }: { children: ReactNode }) => {
  return <Suspense>{children}</Suspense>;
};
