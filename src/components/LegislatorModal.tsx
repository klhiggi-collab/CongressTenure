import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Calendar, MapPin, History, Info, Vote, ExternalLink, CheckCircle2, Clock, UserCheck, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ProcessedLegislator } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { STATES } from '../services/congressService';

interface LegislatorModalProps {
  legislator: ProcessedLegislator;
  isOpen: boolean;
  onClose: () => void;
  tenureLimit?: number;
}

type Tab = 'voter-guide' | 'career-history' | 'financial-profile';

export function LegislatorModal({ legislator, isOpen, onClose, tenureLimit = 12 }: LegislatorModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('career-history');

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };
  const houseTerms = legislator.terms.filter(t => t.type === 'rep');
  const senateTerms = legislator.terms.filter(t => t.type === 'sen');

  const houseYears = houseTerms.reduce((acc, t) => {
    const start = parseISO(t.start);
    const end = parseISO(t.end);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }, 0);

  const senateYears = senateTerms.reduce((acc, t) => {
    const start = parseISO(t.start);
    const end = parseISO(t.end);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }, 0);

  const now = new Date('2026-03-31');
  const electionDate = parseISO(legislator.nextElectionDate);
  const daysUntilElection = differenceInDays(electionDate, now);
  const isUpForElection = legislator.nextElectionYear === 2026;

  const getVoterRegUrl = (state: string) => {
    return `https://vote.gov/register/${state.toLowerCase()}`;
  };

  const getPrimaryDatesUrl = (stateCode: string) => {
    const state = STATES.find(s => s.code === stateCode);
    if (!state) return 'https://www.vote.org/election-dates/';
    const stateSlug = state.name.toLowerCase().replace(/\s+/g, '-');
    return `https://www.vote.org/state/${stateSlug}/`;
  };

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) setActiveTab('career-history');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="border-b border-slate-100 bg-white">
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{legislator.fullName}</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{legislator.title} Profile</p>
                      <span className="text-slate-300">•</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Age {legislator.age}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6">
                <button
                  onClick={() => setActiveTab('voter-guide')}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                    activeTab === 'voter-guide' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Vote size={14} />
                  Voter Guide
                  {isUpForElection && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                  )}
                  {activeTab === 'voter-guide' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('career-history')}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                    activeTab === 'career-history' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <History size={14} />
                  Career History
                  {activeTab === 'career-history' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('financial-profile')}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors",
                    activeTab === 'financial-profile' ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <DollarSign size={14} />
                  Wealth
                  {activeTab === 'financial-profile' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              <AnimatePresence mode="wait">
                {activeTab === 'voter-guide' ? (
                  <motion.div
                    key="voter-guide"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    {/* Voter Status Badge */}
                    <div className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 border",
                      isUpForElection 
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20" 
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      <div className="flex items-center gap-2">
                        <Vote size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">
                          {isUpForElection ? 'Up for Election' : 'Incumbent Member'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                        {isUpForElection ? '2026 Cycle' : `Next: ${legislator.nextElectionYear}`}
                      </span>
                    </div>

                    {/* Term Dates - Moved Up */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Term Ends</p>
                        <p className="text-sm font-black text-slate-700">{format(parseISO(legislator.currentTermEnd), 'MMMM d, yyyy')}</p>
                      </div>
                      <div className={cn(
                        "rounded-xl border p-4",
                        isUpForElection ? "bg-blue-600 text-white border-blue-500 shadow-md" : "bg-slate-50 border-slate-100 text-slate-700"
                      )}>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mb-1",
                          isUpForElection ? "text-blue-100" : "text-slate-400"
                        )}>Next Election Date</p>
                        <p className="text-sm font-black">{format(parseISO(legislator.nextElectionDate), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>

                    {/* Voter Action Center */}
                    <div className={cn(
                      "rounded-2xl border p-6 transition-all",
                      isUpForElection 
                        ? "border-blue-200 bg-blue-50/50 ring-8 ring-blue-500/5 shadow-sm" 
                        : "border-slate-100 bg-slate-50/30"
                    )}>
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full",
                              isUpForElection ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                            )}>
                              <Vote size={18} />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-tight text-slate-900">Voter Action Center</h3>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
                            {isUpForElection 
                              ? `This seat is contested in the current 2026 cycle. Your participation is critical for representation in ${legislator.state}.`
                              : `This seat is not currently up for election. Use this time to research the member's record and prepare for ${legislator.nextElectionYear}.`}
                          </p>
                        </div>

                        {isUpForElection && (
                          <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-blue-100 p-5 shadow-sm min-w-[160px]">
                            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                              <Clock size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Election Countdown</span>
                            </div>
                            <div className="text-4xl font-black text-slate-900 leading-none tracking-tighter">{daysUntilElection}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Days Remaining</div>
                          </div>
                        )}
                      </div>

                      {/* Voter Checklist */}
                      <div className="mt-8 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Voter Checklist</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                              <CheckCircle2 size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">Verify your registration status</span>
                            <a href={getVoterRegUrl(legislator.state)} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] font-black uppercase text-blue-600 hover:underline">Start Now</a>
                          </div>
                          <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-100 p-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <Calendar size={14} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">Check primary election dates</span>
                            <a href={getPrimaryDatesUrl(legislator.state)} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] font-black uppercase text-blue-600 hover:underline">View Dates</a>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <a 
                          href={getVoterRegUrl(legislator.state)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
                        >
                          Register to Vote
                          <ExternalLink size={18} />
                        </a>
                        <a 
                          href={getPrimaryDatesUrl(legislator.state)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                        >
                          Election Dates
                          <ExternalLink size={18} />
                        </a>
                      </div>

                      {legislator.branch === 'Senate' && (
                        <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-100/50 p-4 text-xs text-slate-600 italic leading-relaxed border border-slate-200/50">
                          <Info size={18} className="shrink-0 text-slate-400" />
                          <span>
                            Senate seats are divided into three classes (I, II, III). Only one-third of the Senate is up for election every two years. 
                            This ensures legislative stability while remaining responsive to voters.
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : activeTab === 'financial-profile' ? (
                  <motion.div
                    key="financial-profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {/* Net Worth Summary */}
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Estimated Net Worth</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Based on 2024 Financial Disclosures</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                          <DollarSign size={24} />
                        </div>
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-black tracking-tighter text-slate-900">
                          {legislator.netWorth ? formatCurrency(legislator.netWorth) : 'Data Unavailable'}
                        </span>
                        {legislator.netWorth && legislator.baselineNetWorth && (
                          <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">
                            <TrendingUp size={12} />
                            {((legislator.netWorth / legislator.baselineNetWorth - 1) * 100).toFixed(0)}% Growth
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comparison Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-white p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Baseline Wealth ({legislator.baselineYear || 'Entry'})</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-700">
                            {legislator.baselineNetWorth ? formatCurrency(legislator.baselineNetWorth) : '—'}
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                          Estimated net worth at the earliest digitized disclosure record.
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-white p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Current Wealth (2024)</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900">
                            {legislator.netWorth ? formatCurrency(legislator.netWorth) : '—'}
                          </span>
                          <ArrowUpRight size={20} className="text-emerald-500" />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
                          Median estimate based on the most recent public financial disclosure ranges.
                        </p>
                      </div>
                    </div>

                    {/* Tenure Insight */}
                    <div className="rounded-xl bg-slate-900 p-6 text-white shadow-xl">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Info size={16} className="text-blue-400" />
                          <h4 className="text-xs font-black uppercase tracking-widest">Tenure Wealth Insight</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wealth per Year of Service</p>
                            <p className="text-xl font-black">
                              {legislator.netWorth && legislator.totalYears > 0 
                                ? formatCurrency(legislator.netWorth / legislator.totalYears) 
                                : '—'}
                              <span className="text-xs font-bold text-slate-500 ml-1">/ year</span>
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wealth Multiplier</p>
                            <p className="text-xl font-black">
                              {legislator.netWorth && legislator.baselineNetWorth 
                                ? `${(legislator.netWorth / legislator.baselineNetWorth).toFixed(1)}x` 
                                : '—'}
                              <span className="text-xs font-bold text-slate-500 ml-1">increase</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                      <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                      <p>
                        <strong>Data Methodology:</strong> Net worth figures are median estimates derived from Personal Financial Disclosure (PFD) forms. 
                        Members of Congress report assets and liabilities in broad ranges (e.g., $1,001 - $15,000). 
                        Baseline figures represent the earliest digitized records available (typically post-2004). 
                        Data sourced from OpenSecrets and ProPublica.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="career-history"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {/* Tenure Progress Visualization */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Tenure Benchmark</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress toward {tenureLimit}-year mark</p>
                        </div>
                        <div className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                          legislator.totalYears >= tenureLimit ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {legislator.totalYears >= tenureLimit ? 'Benchmark Exceeded' : 'Active Term'}
                        </div>
                      </div>
                      
                      <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-100">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((legislator.totalYears / tenureLimit) * 100, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full transition-all",
                            legislator.totalYears >= tenureLimit ? "bg-red-600" : "bg-blue-600"
                          )}
                        />
                        {/* benchmark marker */}
                        <div className="absolute left-[100%] top-0 h-full w-0.5 bg-red-400/50" />
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span>0 Years</span>
                        <span className="text-slate-900">{tenureLimit} Year Benchmark</span>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {houseTerms.length > 0 && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                          <div className="flex items-center gap-2 text-slate-900 mb-3">
                            <Building2 size={18} className="text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-tight">House of Representatives</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">{houseTerms.length}</span>
                            <span className="text-xs font-bold text-slate-500 uppercase">Terms</span>
                            <span className="ml-auto text-base font-black text-slate-600">{houseYears.toFixed(1)}y</span>
                          </div>
                        </div>
                      )}
                      {senateTerms.length > 0 && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                          <div className="flex items-center gap-2 text-slate-900 mb-3">
                            <Building2 size={18} className="text-purple-600" />
                            <span className="text-xs font-black uppercase tracking-tight">U.S. Senate</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900">{senateTerms.length}</span>
                            <span className="text-xs font-bold text-slate-500 uppercase">Terms</span>
                            <span className="ml-auto text-base font-black text-slate-600">{senateYears.toFixed(1)}y</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-slate-900 p-6 text-white shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Cumulative Tenure</p>
                          <h4 className="text-3xl font-black tracking-tighter">{legislator.totalYears} <span className="text-lg font-bold text-slate-500">Years</span></h4>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                          <History size={24} />
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Full Timeline</h3>
                      <div className="relative space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {[...legislator.terms].reverse().map((term, idx) => (
                          <div key={idx} className="relative pl-8">
                            <div className={cn(
                              "absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 border-white shadow-sm",
                              term.type === 'rep' ? "bg-blue-500" : "bg-purple-500"
                            )} />
                            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-tight text-slate-900">
                                  {term.type === 'rep' ? 'House Representative' : 'Senator'}
                                </span>
                                <span className={cn(
                                  "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                                  term.party === 'Democrat' ? "bg-blue-50 text-blue-600" : 
                                  term.party === 'Republican' ? "bg-red-50 text-red-600" : 
                                  "bg-slate-50 text-slate-600"
                                )}>
                                  {term.party}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-slate-400" />
                                  {format(parseISO(term.start), 'MMM yyyy')} — {format(parseISO(term.end), 'MMM yyyy')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-slate-400" />
                                  {term.state} {term.district ? `(District ${term.district})` : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer removed from here, moved into tabs */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
