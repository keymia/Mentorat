import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, className }: PageHeaderProps) {
  return (
    <section className={cn("premium-gradient relative overflow-hidden border-b border-border", className)}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.24),rgb(255_255_255_/_0))] dark:bg-[linear-gradient(180deg,rgb(255_248_237_/_0.08),rgb(0_0_0_/_0))]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {eyebrow ? <Badge variant="bronze">{eyebrow}</Badge> : null}
        <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
          <span className="font-display">{title}</span>
        </h1>
        {description ? <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p> : null}
      </div>
    </section>
  );
}
