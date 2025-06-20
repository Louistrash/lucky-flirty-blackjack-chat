import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { userRoutes } from "./user-routes";
import { MainSuspenseWrapper } from "./components/SuspenseWrapper";
import { UserGuard } from "./app/auth/UserGuard";

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const SomethingWentWrongPage = lazy(() => import("./pages/SomethingWentWrongPage"));

export const router = createBrowserRouter([
  ...userRoutes,
  {
    path: "*",
    element: (
      <MainSuspenseWrapper>
        <NotFoundPage />
      </MainSuspenseWrapper>
    ),
    errorElement: (
      <MainSuspenseWrapper>
        <SomethingWentWrongPage />
      </MainSuspenseWrapper>
    ),
  }
]);