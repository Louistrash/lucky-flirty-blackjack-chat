import type { User } from "firebase/auth";
import * as React from "react";
import { createContext, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "./useCurrentUser";

type UserGuardContextType = {
  user: User | null; // User can be null initially or if not logged in
  loading: boolean;
};

const UserGuardContext = createContext<UserGuardContextType | null>( // Allow null for initial state before loading completes
  null,
);

/**
 * Hook to access the logged in user from within a <UserGuard> component.
 */
export const useUserGuardContext = () => {
  const context = useContext(UserGuardContext);

  if (context === undefined) {
    throw new Error("useUserGuardContext must be used within a <UserGuardProvider> (which UserGuard component renders)");
  }

  return context;
};

/**
 * All protected routes are wrapped in a UserGuard component.
 */
export const UserGuard = (props: {
  children: React.ReactNode;
}) => {
  const { user, loading } = useCurrentUser();
  const { pathname } = useLocation();

  // The UserGuard component itself handles the loading and redirect logic.
  // The context will provide the user and loading state for consumers.

  if (!user && !loading) {
    const queryParams = new URLSearchParams(window.location.search);

    // Don't set the next param if the user is logging out
    // to avoid ending up in an infinite redirect loop
    if (pathname !== "/logout" && pathname !== "/sign-out") {
      queryParams.set("next", pathname);
    }

    const queryString = queryParams.toString();

    return <Navigate to={`/login?${queryString}`} replace={true} />;
  }

  // If still loading, user might be null temporarily. If not loading and no user, redirect is handled above.
  // If user exists, or if loading (user might be null but will update), provide context.
  return (
    <UserGuardContext.Provider value={{ user, loading }}>
      {props.children}
    </UserGuardContext.Provider>
  );
}
