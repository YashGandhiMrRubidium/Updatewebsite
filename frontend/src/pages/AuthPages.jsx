import { Outlet } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider";

export const ClerkShell = () => (
  <ClerkAuthProvider>
    <Outlet />
  </ClerkAuthProvider>
);

const Wrap = ({ children, testId }) => (
  <div className="flex min-h-screen items-center justify-center px-4 pb-24 pt-24" data-testid={testId}>{children}</div>
);

export const SignInPage = () => (
  <Wrap testId="sign-in-page">
    <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp fallbackRedirectUrl="/admin" />
  </Wrap>
);

export const SignUpPage = () => (
  <Wrap testId="sign-up-page">
    <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/admin" />
  </Wrap>
);
