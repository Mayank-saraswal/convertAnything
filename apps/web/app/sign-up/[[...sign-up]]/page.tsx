import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
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
