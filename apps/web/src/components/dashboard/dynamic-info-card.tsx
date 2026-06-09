'use client';

import { useEffect, useState } from 'react';
import { Tv, Building2, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface InfoItem {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  bgColor: string;
}

export function DynamicInfoCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    playlists: 0,
    companies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            playlists: data.playlists || 0,
            companies: data.companies || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const infoItems: InfoItem[] = [
    {
      icon: <Tv className="w-5 h-5" />,
      title: 'Playlists Ativas',
      value: `${stats.playlists}`,
      subtitle: 'playlists configuradas',
      color: 'text-brand-main',
      bgColor: 'bg-brand-main/10',
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      title: 'Empresas Cadastradas',
      value: `${stats.companies}`,
      subtitle: 'organizações ativas',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Sistema Operacional',
      value: 'Online',
      subtitle: 'todos os serviços ativos',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Última Atualização',
      value: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      subtitle: 'dados em tempo real',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Status Geral',
      value: 'Normal',
      subtitle: 'sem alertas pendentes',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % infoItems.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, infoItems.length]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-panel-bg p-6 h-24">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-border/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-border/50 rounded w-1/4" />
            <div className="h-6 bg-border/50 rounded w-1/3" />
            <div className="h-3 bg-border/50 rounded w-1/5" />
          </div>
        </div>
      </div>
    );
  }

  const currentItem = infoItems[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-panel-bg shadow-sm transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-main/5 via-transparent to-transparent opacity-50" />

      <div className="relative flex items-center gap-6 p-6">
        <div
          className={`p-3 rounded-xl ${currentItem.bgColor} ${currentItem.color} transition-all duration-500`}
        >
          {currentItem.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-widest text-text-light/70 mb-1">
            {currentItem.title}
          </div>
          <div className="text-2xl font-black text-text-dark transition-all duration-500">
            {currentItem.value}
          </div>
          <div className="text-xs text-text-light/60 mt-0.5">{currentItem.subtitle}</div>
        </div>

        <div className="flex items-center gap-1.5">
          {infoItems.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-brand-main w-6' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
