import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Building2, Users, Info, AlertTriangle, ShieldAlert, Loader2, LayoutGrid, Columns2, UserX } from 'lucide-react';
import { fetchLegislators, findVacancies, STATES, TERRITORIES } from './services/congressService';
import { ProcessedLegislator, VacantSeat } from './types';
import { LegislatorCard } from './components/LegislatorCard';
import { VacantCard } from './components/VacantCard';
import { LegislatorModal } from './components/LegislatorModal';
import { cn } from './lib/utils';

export default function App() {
  const [legislators, setLegislators] = useState<ProcessedLegislator[]>([]);
  const [vacancies, setVacancies] = useState<VacantSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLegislator, setSelectedLegislator] = useState<ProcessedLegislator | null>(null);
  const [tenureLimit, setTenureLimit] = useState(12);
  const [isSticky, setIsSticky] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState<'ALL' | 'House' | 'Senate'>('ALL');
  const [tenureFilter, setTenureFilter] = useState<'ALL' | 'LONG' | 'APPROACHING'>('ALL');
  const [showOnlyVoting, setShowOnlyVoting] = useState(false);
  const [showVacanciesOnly, setShowVacanciesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'PARTY'>('GRID');

  // Handle sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchLegislators();
        setLegislators(data);
        const vacancyData = findVacancies(data);
        setVacancies(vacancyData);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load congressional data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Recalculate tenure status based on dynamic limit
  const processedLegislators = useMemo(() => {
    return legislators.map(leg => {
      let tenureStatus: 'normal' | 'approaching' | 'exceeded' = 'normal';
      if (leg.totalYears >= tenureLimit) {
        tenureStatus = 'exceeded';
      } else if (leg.totalYears >= tenureLimit - 1) {
        tenureStatus = 'approaching';
      }
      return { ...leg, tenureStatus };
    });
  }, [legislators, tenureLimit]);

  const filteredLegislators = useMemo(() => {
    if (showVacanciesOnly) return [];
    const filtered = processedLegislators.filter((leg) => {
      const stateName = [...STATES, ...TERRITORIES].find(s => s.code === leg.state)?.name || '';
      const matchesSearch = leg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          leg.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          stateName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = selectedState === 'ALL' || leg.state === selectedState;
      const matchesBranch = selectedBranch === 'ALL' || leg.branch === selectedBranch;
      const matchesTenure = tenureFilter === 'ALL' || 
                           (tenureFilter === 'LONG' && leg.tenureStatus === 'exceeded') ||
                           (tenureFilter === 'APPROACHING' && leg.tenureStatus === 'approaching');
      const matchesVoting = !showOnlyVoting || leg.isVotingMember;
      
      return matchesSearch && matchesState && matchesBranch && matchesTenure && matchesVoting;
    });

    // Sort by tenure (longest to shortest)
    return [...filtered].sort((a, b) => b.totalYears - a.totalYears);
  }, [processedLegislators, searchTerm, selectedState, selectedBranch, tenureFilter, showOnlyVoting, showVacanciesOnly]);

  const filteredVacancies = useMemo(() => {
    if (!showVacanciesOnly) return [];
    return vacancies.filter(v => {
      const stateName = [...STATES, ...TERRITORIES].find(s => s.code === v.state)?.name || '';
      const matchesSearch = v.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          stateName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = selectedState === 'ALL' || v.state === selectedState;
      const matchesBranch = selectedBranch === 'ALL' || v.branch === selectedBranch;
      const matchesVoting = !showOnlyVoting || v.isVotingMember;
      return matchesSearch && matchesState && matchesBranch && matchesVoting;
    });
  }, [vacancies, selectedState, selectedBranch, showOnlyVoting, showVacanciesOnly]);

  const partyGroups = useMemo(() => {
    if (showVacanciesOnly) return { Democrats: [], Republicans: [], Others: [] };
    return {
      Democrats: filteredLegislators.filter(l => l.party === 'Democrat'),
      Republicans: filteredLegislators.filter(l => l.party === 'Republican'),
      Others: filteredLegislators.filter(l => l.party !== 'Democrat' && l.party !== 'Republican')
    };
  }, [filteredLegislators, showVacanciesOnly]);

  const stats = useMemo(() => {
    const currentList = showVacanciesOnly ? filteredVacancies : filteredLegislators;
    const total = currentList.length;
    const votingCount = currentList.filter(l => l.isVotingMember).length;
    const delegateCount = currentList.filter(l => !l.isVotingMember).length;
    const longServing = showVacanciesOnly ? 0 : processedLegislators.filter(l => l.tenureStatus === 'exceeded').length;
    const approaching = showVacanciesOnly ? 0 : processedLegislators.filter(l => l.tenureStatus === 'approaching').length;
    const vacancyTotal = vacancies.length;
    const withWealth = processedLegislators.filter(l => l.netWorth !== undefined).length;
    const wealthCoverage = total > 0 ? Math.round((withWealth / total) * 100) : 0;
    return { total, votingCount, delegateCount, longServing, approaching, vacancyTotal, withWealth, wealthCoverage };
  }, [filteredLegislators, filteredVacancies, processedLegislators, showVacanciesOnly, vacancies]);

  const handleViewVoterGuide = (seat: VacantSeat) => {
    // In a future update, this could open a specific modal for the vacant seat
    alert(`Voter Guide for ${seat.state} ${seat.branch === 'House' ? `District ${seat.district}` : 'Senate'} is coming soon!`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-600">Fetching latest congressional records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl border border-red-100">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Data Connection Error</h2>
          <p className="mt-2 text-slate-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Sticky Logic Bar */}
      <AnimatePresence>
        {isSticky && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[60] border-b border-slate-800 bg-slate-900 py-3 text-white shadow-xl"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-500" />
                    <span className="text-sm font-black uppercase tracking-tight">
                      Benchmark: <span className="text-red-400">{tenureLimit} Years</span>
                    </span>
                  </div>
                  <div className="hidden h-4 w-px bg-slate-700 sm:block" />
                  <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
                    <span>{stats.longServing} Members Exceeded</span>
                  </div>
                </div>
                <button
                  onClick={() => setTenureLimit(12)}
                  className="rounded bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  Reset to 12y
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Title */}
      <header className="border-b border-slate-200 bg-white py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl">
                  Congress <span className="text-blue-600">Tenure</span>
                </h1>
                <p className="mt-1 text-sm font-medium leading-tight text-slate-500 italic max-w-md">
                  Since there are no term limits in Congress, this site is to help you see the length of service of all serving members.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-2 border border-blue-100">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Active Benchmark</span>
                <span className="text-xl font-black text-slate-900 leading-none">{tenureLimit} Years</span>
              </div>
              <div className="h-8 w-px bg-blue-200" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold uppercase text-blue-700">{Math.floor(tenureLimit / 6)} Senate Terms</span>
                <span className="text-[9px] font-bold uppercase text-red-700">{Math.floor(tenureLimit / 2)} House Terms</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar (Sticky) */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {/* View Switcher */}
              <div className="flex shrink-0 rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                    viewMode === 'GRID' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  <LayoutGrid size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('PARTY')}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                    viewMode === 'PARTY' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  <Columns2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tight">Party</span>
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700 border border-red-100">
                  <ShieldAlert size={12} />
                  {stats.longServing} <span className="hidden sm:inline">Exceeded</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 border border-amber-100">
                  <AlertTriangle size={12} />
                  {stats.approaching} <span className="hidden sm:inline">Approaching</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTenureLimit(12)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                  tenureLimit === 12 
                    ? "bg-slate-100 text-slate-400 cursor-default" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95"
                )}
              >
                Reset to 12y
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters Section */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search Members</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name or State..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* State/Territory Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter by State or Territory</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500"
              >
                <option value="ALL">All States & Territories</option>
                <optgroup label="States">
                  {STATES.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Territories">
                  {TERRITORIES.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Branch Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Legislative Branch</label>
              <div className="flex rounded-lg bg-slate-100 p-1">
                {(['ALL', 'House', 'Senate'] as const).map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setSelectedBranch(branch)}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                      selectedBranch === branch 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tenure Status</label>
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setTenureFilter('ALL')}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                    tenureFilter === 'ALL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setTenureFilter('APPROACHING')}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                    tenureFilter === 'APPROACHING' ? "bg-amber-500 text-white shadow-sm" : "text-slate-500"
                  )}
                >
                  {tenureLimit - 1}y+
                </button>
                <button
                  onClick={() => setTenureFilter('LONG')}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                    tenureFilter === 'LONG' ? "bg-red-600 text-white shadow-sm" : "text-slate-500"
                  )}
                >
                  {tenureLimit}y+
                </button>
              </div>
            </div>

            {/* Voting Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Representation Type</label>
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  onClick={() => setShowOnlyVoting(false)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                    !showOnlyVoting ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  )}
                >
                  All Seats
                </button>
                <button
                  onClick={() => setShowOnlyVoting(true)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-bold transition-all",
                    showOnlyVoting ? "bg-blue-600 text-white shadow-sm" : "text-slate-500"
                  )}
                >
                  Voting Only
                </button>
              </div>
            </div>

            {/* Vacancy Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Vacancy Audit</label>
              <button
                onClick={() => setShowVacanciesOnly(!showVacanciesOnly)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all border",
                  showVacanciesOnly 
                    ? "bg-orange-600 text-white border-orange-500 shadow-sm" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-orange-200 hover:text-orange-600"
                )}
              >
                <UserX size={14} />
                {showVacanciesOnly ? 'Showing Vacancies' : 'Show Vacant Seats'}
              </button>
            </div>

            {/* Simulator Slider - MOVED & STYLED */}
            <div className="md:col-span-2 lg:col-span-2 rounded-xl bg-blue-50/50 p-4 border border-blue-100 shadow-inner-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-blue-600" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600">Tenure Simulator</label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{tenureLimit}y Limit</span>
                  <div className="h-3 w-px bg-blue-200" />
                  <span className="text-[9px] font-bold text-blue-700 uppercase">{Math.floor(tenureLimit / 6)} Sen / {Math.floor(tenureLimit / 2)} House</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="2"
                  max="36"
                  step="2"
                  value={tenureLimit}
                  onChange={(e) => setTenureLimit(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 accent-blue-600"
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  <span>2 Years</span>
                  <span>36 Years</span>
                </div>
              </div>
            </div>
          </div>
        </section>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-slate-100 p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 text-slate-600 shrink-0" />
              <div className="text-xs text-slate-800">
                <p className="font-bold">Initial view set to 12 years (2 Senate / 6 House terms).</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${stats.wealthCoverage}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
                    Wealth Data Coverage: {stats.wealthCoverage}% ({stats.withWealth}/{stats.total})
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 sm:text-right">
            Data sourced from <a href="https://theunitedstates.io/" target="_blank" rel="noopener noreferrer" className="underline font-bold">United States Project</a>
          </div>
        </div>

        {/* Grid or Party View */}
        {viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {showVacanciesOnly ? (
                filteredVacancies.map((seat) => (
                  <VacantCard 
                    key={seat.id} 
                    seat={seat} 
                    onViewVoterGuide={handleViewVoterGuide} 
                  />
                ))
              ) : (
                filteredLegislators.map((leg) => (
                  <LegislatorCard 
                    key={leg.id} 
                    legislator={leg} 
                    tenureLimit={tenureLimit}
                    onSelect={() => setSelectedLegislator(leg)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8 items-start">
            {/* Democrats */}
            <div className="space-y-4 sm:space-y-6">
              <div className="sticky top-[73px] z-30 flex items-center justify-between border-b-2 border-blue-500 bg-[#F8FAFC]/90 py-2 backdrop-blur-sm">
                <h2 className="text-[10px] font-black uppercase tracking-tight text-blue-700 sm:text-lg">Dems</h2>
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 sm:px-2 sm:text-xs">{partyGroups.Democrats.length}</span>
              </div>
              <div className="flex flex-col gap-2 sm:gap-4">
                <AnimatePresence>
                  {partyGroups.Democrats.map((leg) => (
                    <LegislatorCard 
                      key={leg.id} 
                      legislator={leg} 
                      variant="responsive" 
                      tenureLimit={tenureLimit}
                      onSelect={() => setSelectedLegislator(leg)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Republicans */}
            <div className="space-y-4 sm:space-y-6">
              <div className="sticky top-[73px] z-30 flex items-center justify-between border-b-2 border-red-500 bg-[#F8FAFC]/90 py-2 backdrop-blur-sm">
                <h2 className="text-[10px] font-black uppercase tracking-tight text-red-700 sm:text-lg">GOP</h2>
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700 sm:px-2 sm:text-xs">{partyGroups.Republicans.length}</span>
              </div>
              <div className="flex flex-col gap-2 sm:gap-4">
                <AnimatePresence>
                  {partyGroups.Republicans.map((leg) => (
                    <LegislatorCard 
                      key={leg.id} 
                      legislator={leg} 
                      variant="responsive" 
                      tenureLimit={tenureLimit}
                      onSelect={() => setSelectedLegislator(leg)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Others */}
            <div className="space-y-4 sm:space-y-6">
              <div className="sticky top-[73px] z-30 flex items-center justify-between border-b-2 border-slate-400 bg-[#F8FAFC]/90 py-2 backdrop-blur-sm">
                <h2 className="text-[10px] font-black uppercase tracking-tight text-slate-600 sm:text-lg">Ind</h2>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 sm:px-2 sm:text-xs">{partyGroups.Others.length}</span>
              </div>
              <div className="flex flex-col gap-2 sm:gap-4">
                <AnimatePresence>
                  {partyGroups.Others.map((leg) => (
                    <LegislatorCard 
                      key={leg.id} 
                      legislator={leg} 
                      variant="responsive" 
                      tenureLimit={tenureLimit}
                      onSelect={() => setSelectedLegislator(leg)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {((!showVacanciesOnly && filteredLegislators.length === 0) || (showVacanciesOnly && filteredVacancies.length === 0)) && (
          <div className="mt-20 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">No {showVacanciesOnly ? 'vacancies' : 'members'} found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </main>

      {/* Shared Modal */}
      {selectedLegislator && (
        <LegislatorModal
          legislator={selectedLegislator}
          isOpen={!!selectedLegislator}
          tenureLimit={tenureLimit}
          onClose={() => setSelectedLegislator(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Congress Tenure Tracker. For informational purposes only.
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-300">
            Last Updated: March 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
