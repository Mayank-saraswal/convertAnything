import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            formButtonPrimary: {
              background: "#000000",
              borderRadius: "9999px",
              fontFamily: "Inter, sans-serif",
            },
            card: {
              boxShadow: "none",
              border: "0.5px solid #E8E8E8",
              borderRadius: "16px",
            },
          },
        }}
      />
    </div>
  );
}
