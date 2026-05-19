import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { BrandMark } from "@/components/layout/BrandMark";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <main data-no-translate className="premium-gradient flex min-h-screen items-center justify-center px-4 py-10">
      <RevealOnScroll className="w-full max-w-md" distance={46} duration={0.72}>
        <Card className="public-motion-card w-full border-white/40 bg-card/88 backdrop-blur-xl">
          <CardContent className="p-6">
            <BrandMark href="/" />
            <h1 className="mt-6 font-display text-3xl font-bold">Connexion</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Utilisez votre email et votre mot de passe. Le systeme ouvrira automatiquement l&apos;espace admin ou mentor.
            </p>
            <div className="mt-6">
              <Suspense fallback={null}>
                <AdminLoginForm />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </RevealOnScroll>
    </main>
  );
}
