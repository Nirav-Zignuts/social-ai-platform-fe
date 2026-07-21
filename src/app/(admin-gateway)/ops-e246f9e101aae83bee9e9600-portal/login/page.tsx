import { LockKeyhole } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-72 left-1/2 size-136 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-32 -bottom-56 size-112 rounded-full bg-bg-surface-hover/70 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-surface/80 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-text-secondary">
            <LockKeyhole className="size-3 text-accent" />
            Restricted internal tool
          </div>
          <p className="text-display">Operations Console</p>
          <p className="mt-2 text-caption">
            Authorized personnel only. Access attempts may be audited.
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
