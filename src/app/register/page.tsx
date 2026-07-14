import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-display">Social AI</p>
          <p className="mt-2 text-caption">
            Create your account
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
