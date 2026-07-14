import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-display">Social AI</p>
          <p className="mt-2 text-caption">
            AI social media operating system
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-80 rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
