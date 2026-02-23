'use client';

import { ArrowRight, Sparkles, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RankUpOverlayProps = {
  open: boolean;
  rankLabel: string;
  onCloseAction: () => void;
};

export default function RankUpOverlay({ open, rankLabel, onCloseAction }: RankUpOverlayProps) {
  if (!open) return null;

  const rankCode = rankLabel.split('-')[0] || 'E';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[min(500px,92vw)] rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Trophy className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-purple-600">Congratulations!</p>
          <h2 className="mt-1 text-3xl font-bold text-gray-900">Rank Up</h2>
        </div>

        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-purple-200 bg-purple-50">
          <span className="text-5xl font-bold text-gray-900">{rankCode}</span>
        </div>

        <p className="mb-2 text-center text-sm text-gray-500">
          You&apos;ve reached <span className="font-semibold text-purple-600">{rankLabel}</span>
        </p>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-center">
            <Zap className="mx-auto mb-1 h-5 w-5 text-purple-600" />
            <p className="text-xs text-gray-500">XP Bonus</p>
            <p className="text-lg font-bold text-gray-900">+500</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-center">
            <Sparkles className="mx-auto mb-1 h-5 w-5 text-purple-600" />
            <p className="text-xs text-gray-500">New Title</p>
            <p className="text-sm font-bold text-gray-900">Elite</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-center">
            <Trophy className="mx-auto mb-1 h-5 w-5 text-purple-600" />
            <p className="text-xs text-gray-500">Gems</p>
            <p className="text-lg font-bold text-gray-900">+50</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onCloseAction}
            className="w-full bg-purple-600 text-white hover:bg-purple-500"
          >
            Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <button
            onClick={onCloseAction}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
