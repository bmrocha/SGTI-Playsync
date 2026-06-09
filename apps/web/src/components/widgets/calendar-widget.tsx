'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBrazilianHolidays } from '@/lib/holidays';

export interface CalendarWidgetConfig {
  theme?: 'light' | 'dark' | 'transparent';
  showHeader?: boolean;
  highlightToday?: boolean;
  customEvents?: { date: string; name: string }[];
  carouselEnabled?: boolean;
  carouselInterval?: number;
}

interface CalendarWidgetProps {
  config?: CalendarWidgetConfig;
  className?: string;
}

export function CalendarWidget({ config = {}, className }: CalendarWidgetProps) {
  const [now, setNow] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();

  const allHolidays = [...getBrazilianHolidays(year), ...(config.customEvents || [])]
    .filter((h) => h.date !== '')
    .sort((a, b) => a.date.localeCompare(b.date));

  // Dedup and filter current month
  const monthHighlights = Array.from(
    new Map(
      allHolidays
        .filter((h) => {
          const d = new Date(h.date + 'T12:00:00');
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .map((item) => [`${item.date}-${item.name}`, item]),
    ).values(),
  );

  useEffect(() => {
    if (!config.carouselEnabled || monthHighlights.length <= 1) return;
    const ms = (config.carouselInterval || 20) * 1_000;
    const t = setInterval(() => setActiveIndex((prev) => (prev + 1) % monthHighlights.length), ms);
    return () => clearInterval(t);
  }, [config.carouselEnabled, config.carouselInterval, monthHighlights.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [monthHighlights.length]);

  const _currentItem = monthHighlights[activeIndex];
  const isLight = (config.theme || 'dark') === 'light';

  return (
    <div
      className={cn('w-full h-full overflow-hidden', className)}
      style={{ display: 'grid', gridTemplateRows: '40% 60%' }}
    >
      {/* ══ TOPO: DATA ATUAL — 40% ══ */}
      <div className="overflow-hidden flex flex-col justify-center px-6 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-1.5 rounded-full bg-brand-main flex-shrink-0" />
          <span className="text-[10px] laptop:text-xs font-black uppercase tracking-[0.4em] text-brand-main">
            DATA ATUAL
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'text-5xl laptop:text-7xl font-black tracking-tighter leading-none shrink-0',
              isLight ? 'text-slate-900' : 'text-white',
            )}
          >
            {format(now, 'dd')}
          </span>
          <div className="flex flex-col border-l-4 border-brand-main/40 pl-4 py-1 min-w-0">
            <span className="text-xl laptop:text-3xl font-black uppercase italic leading-tight tracking-tighter text-brand-main break-words">
              {format(now, 'EEEE', { locale: ptBR })}
            </span>
            <span
              className={cn(
                'text-[10px] laptop:text-xs font-bold uppercase tracking-[0.2em] mt-1 opacity-50',
                isLight ? 'text-slate-700' : 'text-white',
              )}
            >
              {format(now, 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>

      {/* ══ BAIXO: DESTAQUES — ocupa 55% do card ══ */}
      <div className="overflow-hidden flex flex-col border-t-2 border-slate-200/60 dark:border-white/10 px-6 pt-1 pb-2">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-brand-main opacity-60" />
            <span
              className={cn(
                'text-[10px] laptop:text-xs font-black uppercase tracking-[0.2em] italic',
                isLight ? 'text-slate-500' : 'text-white/50',
              )}
            >
              Destaques deste Mês
            </span>
          </div>
          {!config.carouselEnabled && <CalendarIcon className="w-4 h-4 text-brand-main/40" />}
        </div>

        {/* MODO CARROSSEL: 2 itens por slide se existirem */}
        {config.carouselEnabled ? (
          <div className="flex-1 overflow-hidden flex flex-col items-center justify-between pt-1 pb-2">
            {/* Container para centralizar os cards no meio do espaço disponível */}
            <div className="flex-1 w-full flex flex-col justify-center">
              {monthHighlights.length > 0 ? (
                <div className="w-full flex flex-col gap-2 transition-all duration-700">
                  {[
                    monthHighlights[activeIndex],
                    // Somente mostra o próximo se houver mais de 2 itens, para evitar loop confuso de [A,B] -> [B,A]
                    monthHighlights.length > 2
                      ? monthHighlights[(activeIndex + 1) % monthHighlights.length]
                      : null,
                  ]
                    .filter((item): item is { date: string; name: string } => item !== null)
                    .map((item, _subIdx) => (
                      <div
                        key={`${item.date}-${item.name}`}
                        className="flex items-stretch gap-0 w-full rounded-2xl bg-brand-main/10 dark:bg-brand-main/25 border-2 border-brand-main/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500"
                      >
                        {/* Lado Esquerdo: Data */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-brand-main/15 px-4 py-2.5 border-r-2 border-brand-main/10 min-w-[75px]">
                          <span className="text-[10px] laptop:text-xs font-black uppercase leading-none mb-1 text-brand-main opacity-80">
                            {format(new Date(item.date + 'T12:00:00'), 'MMM', {
                              locale: ptBR,
                            }).replace('.', '')}
                          </span>
                          <span className="text-2xl laptop:text-3xl font-black leading-none text-brand-main">
                            {format(new Date(item.date + 'T12:00:00'), 'dd')}
                          </span>
                        </div>

                        {/* Lado Direito: Nome + dia da semana */}
                        <div className="flex flex-col justify-center min-w-0 flex-1 px-4 py-2.5">
                          <span
                            className={cn(
                              'font-black uppercase italic tracking-tighter leading-tight truncate',
                              'text-lg laptop:text-xl',
                              isLight ? 'text-slate-900' : 'text-white',
                            )}
                          >
                            {item.name}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] laptop:text-[10px] font-bold uppercase tracking-widest opacity-50 mt-0.5',
                              isLight ? 'text-slate-600' : 'text-white',
                            )}
                          >
                            {format(new Date(item.date + 'T12:00:00'), 'EEEE', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <CalendarIcon className="w-6 h-6 text-brand-main" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-main text-center">
                    Nenhum destaque
                  </span>
                </div>
              )}
            </div>

            {/* Dots indicadores — BEM EM BAIXO */}
            {monthHighlights.length > 1 && (
              <div className="flex gap-2 mt-auto mb-1 flex-shrink-0">
                {monthHighlights.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-500',
                      i === activeIndex
                        ? 'w-6 bg-brand-main'
                        : 'w-1.5 bg-slate-300 dark:bg-white/10',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MODO LISTA: todos os itens */
          <div className="flex-1 overflow-y-auto space-y-2">
            {monthHighlights.length > 0 ? (
              monthHighlights.map((h, i) => {
                const hDate = new Date(h.date + 'T12:00:00');
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-brand-main/5 dark:bg-white/5"
                  >
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 laptop:w-16 laptop:h-16 rounded-xl bg-brand-main/10 text-brand-main">
                      <span className="text-[8px] laptop:text-[10px] font-black uppercase leading-none">
                        {format(hDate, 'MMM', { locale: ptBR }).replace('.', '')}
                      </span>
                      <span className="text-xl laptop:text-2xl font-black leading-none">
                        {format(hDate, 'dd')}
                      </span>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span
                        className={cn(
                          'font-black uppercase italic tracking-tighter leading-tight truncate text-lg laptop:text-xl',
                          isLight ? 'text-slate-900' : 'text-white',
                        )}
                      >
                        {h.name}
                      </span>
                      <span className="text-[10px] laptop:text-xs font-bold uppercase tracking-widest opacity-40 text-slate-500">
                        {format(hDate, 'EEEE', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                <CalendarIcon className="w-8 h-8 text-brand-main" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-main text-center">
                  Nenhum destaque
                  <br />
                  cadastrado
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
