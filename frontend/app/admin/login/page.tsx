import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { BrandMark } from "@/components/layout/BrandMark";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <main className="premium-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-white/40 bg-card/88 backdrop-blur-xl">
        <CardContent className="p-6">
          <BrandMark href="/" />
          <h1 className="mt-6 font-display text-3xl font-bold">Connexion admin</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Utilisez un compte ADMIN_PRINCIPAL ou ADMIN_OPERATIONNEL actif.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
