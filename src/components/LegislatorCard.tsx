import { useState } from 'react';
import { motion } from 'motion/react';
import { ProcessedLegislator } from '../types';
import { cn } from '../lib/utils';
import { Calendar, MapPin, Building2, User, Layers, ChevronRight, Info, Vote, DollarSign } from 'lucide-react';
import { LegislatorModal } from './LegislatorModal';
import { format, parseISO } from 'date-fns';

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
};

interface LegislatorCardProps {
  legislator: ProcessedLegislator;
  variant?: 'default' | 'compact' | 'responsive';
  onSelect?: () => void;
  tenureLimit?: number;
  key?: string;
}

export function LegislatorCard({ legislator, variant = 'default', onSelect, tenureLimit = 12 }: LegislatorCardProps) {
  const isExceeded = legislator.totalYears >= tenureLimit;
  const isApproaching = !isExceeded && legislator.totalYears >= tenureLimit - 1;
  const isUpForElection = legislator.nextElectionYear === 2026;

  if (variant === 'compact' || variant === 'responsive') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onSelect}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-blue-500/20 active:scale-95",
          variant === 'responsive' ? "p-2 sm:p-5" : "p-2",
          legislator.party === 'Democrat' ? "border-blue-100 bg-blue-50/50" :
          legislator.party === 'Republican' ? "border-red-100 bg-red-50/50" :
          "border-slate-200 bg-slate-50/50",
          isExceeded && "ring-1 ring-red-500/30",
          isApproaching && "ring-1 ring-amber-500/30",
          variant === 'responsive' && "sm:bg-white sm:border-slate-200 sm:ring-0"
        )}
      >
        {/* Compact View (Mobile) */}
        <div className={cn("flex flex-col items-center text-center", variant === 'responsive' && "sm:hidden")}>
          <span className={cn(
            "text-lg font-black leading-none mb-1",
            isExceeded ? "text-red-700" : isApproaching ? "text-amber-700" : "text-slate-900"
          )}>
            {legislator.totalYears}y
          </span>
          <h3 className="text-[10px] font-bold leading-tight text-slate-800 line-clamp-2">
            {legislator.lastName}
          </h3>
          <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mt-0.5">
            {legislator.state}
          </span>
        </div>

        {/* Default View (Desktop) - only if responsive */}
        {variant === 'responsive' && (
          <div className="hidden sm:block">
            {/* Status Badge */}
            {(isExceeded || isApproaching) && (
              <div className={cn(
                "absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white",
                isExceeded ? "bg-red-600" : "bg-amber-500"
              )}>
                {isExceeded ? "12+ Years Served" : "Approaching 12 Years"}
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className={cn(
                  "text-lg font-bold leading-tight",
                  isExceeded ? "text-red-900" : "text-slate-900"
                )}>
                  {legislator.fullName}
                </h3>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-[11px] uppercase",
                    legislator.party === 'Democrat' ? "bg-blue-100 text-blue-700" : 
                    legislator.party === 'Republican' ? "bg-red-100 text-red-700" : 
                    "bg-slate-100 text-slate-700"
                  )}>
                    {legislator.party}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Building2 size={14} />
                    {legislator.branch}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <User size={14} />
                    Age {legislator.age}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{legislator.state} {legislator.district ? `- D${legislator.district}` : ''}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tenure</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Calendar size={14} className={cn("shrink-0", isExceeded ? "text-red-500" : "text-slate-400")} />
                  <span className={cn(isExceeded && "text-red-700")}>{legislator.totalYears}y</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms</p>
                <div className={cn(
                  "flex items-center gap-1.5 text-sm font-bold text-slate-900"
                )}>
                  <Layers size={14} className="text-slate-400 shrink-0" />
                  <span className="border-b border-dashed border-slate-300 pb-0.5">{legislator.termCount}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Worth</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <DollarSign size={14} className="text-emerald-500 shrink-0" />
                  <span>{legislator.netWorth ? formatCurrency(legislator.netWorth) : '—'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <span>Current Term Ends:</span>
                <span className="font-mono">{format(parseISO(legislator.currentTermEnd), 'MMM d, yyyy')}</span>
              </div>
              <div className={cn(
                "flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors",
                isUpForElection ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "text-slate-500"
              )}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight">
                  <Vote size={14} className={isUpForElection ? "text-blue-600" : "text-slate-400"} />
                  Next Election:
                </div>
                <span className={cn(
                  "text-[11px] font-black uppercase tracking-tighter",
                  isUpForElection ? "text-blue-800" : "font-mono"
                )}>
                  {format(parseISO(legislator.nextElectionDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Subtle status indicator (Compact only) */}
        <div className={cn(variant === 'responsive' && "sm:hidden")}>
          {isExceeded && <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-bl-full bg-red-600" />}
          {isApproaching && <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-bl-full bg-amber-500" />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onSelect}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border p-5 transition-all hover:shadow-lg",
        isExceeded 
          ? "border-red-200 bg-red-50/30 ring-1 ring-red-100" 
          : isApproaching 
            ? "border-amber-200 bg-amber-50/30 ring-1 ring-amber-100"
            : isUpForElection
              ? "border-blue-200 bg-white ring-2 ring-blue-500/10 shadow-blue-50/50"
              : "border-slate-200 bg-white"
      )}
    >
      {/* Status Badge */}
      {(isExceeded || isApproaching) && (
        <div className={cn(
          "absolute top-0 right-0 rounded-bl-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white",
          isExceeded ? "bg-red-600" : "bg-amber-500"
        )}>
          {isExceeded ? "12+ Years Served" : "Approaching 12 Years"}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className={cn(
            "text-lg font-bold leading-tight",
            isExceeded ? "text-red-900" : "text-slate-900"
          )}>
            {legislator.fullName}
          </h3>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={cn(
              "rounded px-1.5 py-0.5 text-[11px] uppercase",
              legislator.party === 'Democrat' ? "bg-blue-100 text-blue-700" : 
              legislator.party === 'Republican' ? "bg-red-100 text-red-700" : 
              "bg-slate-100 text-slate-700"
            )}>
              {legislator.party}
            </span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <Building2 size={14} />
              {legislator.branch}
            </span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <User size={14} />
              Age {legislator.age}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</p>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{legislator.state} {legislator.district ? `- D${legislator.district}` : ''}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tenure</p>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
            <Calendar size={14} className={cn("shrink-0", isExceeded ? "text-red-500" : "text-slate-400")} />
            <span className={cn(isExceeded && "text-red-700")}>{legislator.totalYears}y</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms</p>
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-bold text-slate-900"
          )}>
            <Layers size={14} className="text-slate-400 shrink-0" />
            <span className="border-b border-dashed border-slate-300 pb-0.5">{legislator.termCount}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Worth</p>
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
            <DollarSign size={14} className="text-emerald-500 shrink-0" />
            <span>{legislator.netWorth ? formatCurrency(legislator.netWorth) : '—'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
          <span>Current Term Ends:</span>
          <span className="font-mono">{format(parseISO(legislator.currentTermEnd), 'MMM d, yyyy')}</span>
        </div>
        <div className={cn(
          "flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors",
          isUpForElection ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" : "text-slate-500"
        )}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight">
            <Vote size={14} className={isUpForElection ? "text-blue-600" : "text-slate-400"} />
            Next Election:
          </div>
          <span className={cn(
            "text-[11px] font-black uppercase tracking-tighter",
            isUpForElection ? "text-blue-800" : "font-mono"
          )}>
            {format(parseISO(legislator.nextElectionDate), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
