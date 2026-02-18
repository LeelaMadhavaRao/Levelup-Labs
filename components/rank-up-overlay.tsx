'use client';

import { Orbitron } from 'next/font/google';
import { ArrowRight, Gem, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RankUpOverlayProps = {
  open: boolean;
  rankLabel: string;
  onCloseAction: () => void;
};

const orbitron = Orbitron({ subsets: ['latin'], weight: ['500', '700', '900'] });

export default function RankUpOverlay({ open, rankLabel, onCloseAction }: RankUpOverlayProps) {
  if (!open) return null;

  const rankCode = rankLabel.split('-')[0] || 'E';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rankup-frame relative w-[min(920px,95vw)] rounded-[28px] border border-purple-500/40 bg-[#180a26] p-6 md:p-10">
        <div className="pointer-events-none absolute left-6 top-6 h-24 w-24 border-l border-t border-purple-600/80" />
        <div className="pointer-events-none absolute bottom-6 right-6 h-24 w-24 border-b border-r border-purple-600/80" />

        <div className="mx-auto mb-5 w-fit rounded-full border border-purple-500/40 bg-purple-900/25 px-6 py-2 text-xs uppercase tracking-[0.25em] text-purple-300">
          System Notification: Limit Broken
        </div>

        <h2 className={`${orbitron.className} rankup-title text-center text-5xl font-black uppercase tracking-tight text-purple-300 md:text-7xl`}>
          Rank Up
        </h2>

        <div className="mt-8 flex justify-center">
          <div className="rankup-orb relative flex h-48 w-48 items-center justify-center rounded-full border-2 border-purple-500 bg-[#13061f] md:h-56 md:w-56">
            <div className="pointer-events-none absolute inset-0 rounded-full opacity-20" style={{ backgroundImage: 'radial-gradient(#7C3AED 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
            <span className="text-7xl font-black text-white md:text-8xl">{rankCode}</span>
            <span className="absolute bottom-9 text-[11px] uppercase tracking-[0.5em] text-purple-300">RANK</span>
          </div>
        </div>

        <div className="mx-auto mt-7 flex w-fit items-center rounded-full bg-purple-500/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Rare Drop
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rankup-card rounded-[34px] border border-white/5 bg-white/[0.03] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-900/45">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Experience</div>
            <div className="mt-1 text-4xl font-bold text-white">+500 XP</div>
          </div>

          <div className="rankup-card rankup-card-focus rounded-[34px] border border-purple-500/25 bg-white/[0.03] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-900/45">
              <Gem className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Premium Currency</div>
            <div className="mt-1 text-4xl font-bold text-white">+50 Gems</div>
          </div>

          <div className="rankup-card rounded-[34px] border border-white/5 bg-white/[0.03] p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-900/45">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">New Title</div>
            <div className="mt-1 text-3xl font-bold text-white">Elite Performer</div>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center gap-3">
          <Button onClick={onCloseAction} className="rankup-cta h-12 w-full max-w-md rounded-full border border-purple-500/40 bg-[#1a0a28] text-base font-bold uppercase tracking-[0.2em] text-white hover:bg-[#271138]">
            Continue Learning <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <button onClick={onCloseAction} className="text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300">Dismiss</button>
        </div>
      </div>
    </div>
  );
}
