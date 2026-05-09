"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Handshake,
  Loader2,
  ShieldAlert,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStats, formatApiError, getDashboardStats } from "@/lib/api";

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getDashboardStats()
      .then((dashboardStats) => {
        if (isMounted) {
          setStats(dashboardStats);
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return <p className="notice error">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      key: "total_mentors",
      label: "Mentors",
      value: stats.total_mentors,
      icon: UsersRound,
      tone: "red" as const,
      helper: "Profils mentors et mentor+mentore actifs.",
    },
    {
      key: "total_mentores",
      label: "Mentores",
      value: stats.total_mentores,
      icon: UserRoundCheck,
      tone: "bronze" as const,
      helper: "Profils mentores suivis dans la plateforme.",
    },
    {
      key: "inscriptions_en_attente",
      label: "En attente",
      value: stats.inscriptions_en_attente,
      icon: Loader2,
      tone: "dark" as const,
      helper: "Inscriptions a valider ou refuser.",
    },
    {
      key: "jumelages_actifs",
      label: "Jumelages actifs",
      value: stats.jumelages_actifs,
      icon: Handshake,
      tone: "red" as const,
      helper: "Mentorats actuellement actifs.",
    },
    {
      key: "mentors_disponibles",
      label: "Mentors disponibles",
      value: stats.mentors_disponibles,
      icon: TrendingUp,
      tone: "bronze" as const,
      helper: "Mentors avec une capacite restante.",
    },
    {
      key: "mentors_satures",
      label: "Mentors satures",
      value: stats.mentors_satures,
      icon: ShieldAlert,
      tone: "dark" as const,
      helper: "Mentors ayant atteint leur capacite.",
    },
    {
      key: "evenements_a_venir",
      label: "Evenements a venir",
      value: stats.evenements_a_venir,
      icon: CalendarDays,
      tone: "red" as const,
      helper: "Evenements planifies dans le programme.",
    },
    {
      key: "partenaires_actifs",
      label: "Partenaires actifs",
      value: stats.partenaires_actifs,
      icon: Handshake,
      tone: "bronze" as const,
      helper: "Partenaires visibles sur le site public.",
    },
  ];

  const mentorCapacityTotal = stats.mentors_disponibles + stats.mentors_satures;
  const saturationRate = mentorCapacityTotal > 0 ? Math.round((stats.mentors_satures / mentorCapacityTotal) * 100) : 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            helper={card.helper}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Progression mentorat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Jumelages actifs</span>
                <span className="font-semibold">{stats.jumelages_actifs}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.min(stats.jumelages_actifs * 10, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mentors satures</span>
                <span className="font-semibold">{saturationRate}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${saturationRate}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[var(--brand-ink)] text-white">
          <CardHeader>
            <CardTitle className="text-white">Priorites rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-white/75">
            <p>{stats.inscriptions_en_attente} inscription(s) attendent une decision administrative.</p>
            <p>{stats.mentors_disponibles} mentor(s) peuvent encore accepter des mentores.</p>
            <p>{stats.evenements_a_venir} evenement(s) planifie(s) sont visibles ou a venir.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
