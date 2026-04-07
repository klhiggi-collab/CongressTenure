import { differenceInDays, differenceInYears, parseISO, getYear, getMonth } from 'date-fns';
import { Legislator, ProcessedLegislator } from '../types';
import netWorthData from '../data/netWorth.json';

const LEGISLATORS_URL = '/api/congress/legislators';
const CONGRESS_DATA_URL = 'https://unitedstates.github.io/congress-legislators/legislators-current.json';

/**
 * Calculates the next election date based on the term end date.
 * Federal elections are held on the first Tuesday after the first Monday in November.
 */
function calculateNextElection(termEnd: string): { year: number; date: string } {
  const endDate = parseISO(termEnd);
  const endYear = getYear(endDate);
  const endMonth = getMonth(endDate); // 0-indexed, Jan is 0

  // If the term ends in January, the election was the preceding November.
  const electionYear = endMonth === 0 ? endYear - 1 : endYear;

  // Specific dates for upcoming federal elections
  const electionDates: Record<number, string> = {
    2024: '2024-11-05',
    2026: '2026-11-03',
    2028: '2028-11-07',
    2030: '2030-11-05',
    2032: '2032-11-02',
    2034: '2034-11-07',
    2036: '2036-11-03',
  };

  return {
    year: electionYear,
    date: electionDates[electionYear] || `${electionYear}-11-01`, // Fallback
  };
}

export async function fetchLegislators(): Promise<ProcessedLegislator[]> {
  try {
    let response: Response;
    try {
      response = await fetch(LEGISLATORS_URL);
      if (!response.ok) throw new Error();
    } catch {
      console.log('Local API not found or failed, falling back to direct data fetch...');
      response = await fetch(CONGRESS_DATA_URL);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const data: Legislator[] = await response.json();
    const now = new Date('2026-04-06'); // Updated to current date from context

    return data.map((leg) => {
      let totalDays = 0;
      leg.terms.forEach((term) => {
        const start = parseISO(term.start);
        const end = parseISO(term.end);
        
        // Use the earlier of 'now' or 'term.end' for the calculation
        const effectiveEnd = end < now ? end : now;
        
        if (effectiveEnd > start) {
          totalDays += differenceInDays(effectiveEnd, start);
        }
      });

      const totalYears = totalDays / 365.25;
      const age = differenceInYears(now, parseISO(leg.bio.birthday));
      const lastTerm = leg.terms[leg.terms.length - 1];
      const election = calculateNextElection(lastTerm.end);
      const isVotingMember = STATES.some(s => s.code === lastTerm.state);

      let title = lastTerm.type === 'rep' ? 'Representative' : 'Senator';
      if (!isVotingMember) {
        title = lastTerm.state === 'PR' ? 'Resident Commissioner' : 'Delegate';
      }

      const tenureStatus = totalYears >= 12 ? 'exceeded' : totalYears >= 11 ? 'approaching' : 'normal';
      const netWorthInfo = (netWorthData as Record<string, any>)[leg.id.bioguide];

      return {
        id: leg.id.bioguide,
        fullName: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
        firstName: leg.name.first,
        lastName: leg.name.last,
        party: lastTerm.party,
        state: lastTerm.state,
        branch: lastTerm.type === 'rep' ? 'House' : 'Senate',
        totalYears: parseFloat(totalYears.toFixed(1)),
        currentTermStart: lastTerm.start,
        currentTermEnd: lastTerm.end,
        nextElectionYear: election.year,
        nextElectionDate: election.date,
        district: lastTerm.district,
        termCount: leg.terms.length,
        terms: leg.terms,
        tenureStatus,
        isVotingMember,
        title,
        age,
        netWorth: netWorthInfo?.current,
        baselineNetWorth: netWorthInfo?.baseline,
        baselineYear: netWorthInfo?.baselineYear,
      };
    });
  } catch (error) {
    console.error('Error fetching legislators:', error);
    throw error;
  }
}

export const STATES = [
  { code: 'AL', name: 'Alabama', districts: 7 }, { code: 'AK', name: 'Alaska', districts: 1 }, { code: 'AZ', name: 'Arizona', districts: 9 },
  { code: 'AR', name: 'Arkansas', districts: 4 }, { code: 'CA', name: 'California', districts: 52 }, { code: 'CO', name: 'Colorado', districts: 8 },
  { code: 'CT', name: 'Connecticut', districts: 5 }, { code: 'DE', name: 'Delaware', districts: 1 }, { code: 'FL', name: 'Florida', districts: 28 },
  { code: 'GA', name: 'Georgia', districts: 14 }, { code: 'HI', name: 'Hawaii', districts: 2 }, { code: 'ID', name: 'Idaho', districts: 2 },
  { code: 'IL', name: 'Illinois', districts: 17 }, { code: 'IN', name: 'Indiana', districts: 9 }, { code: 'IA', name: 'Iowa', districts: 4 },
  { code: 'KS', name: 'Kansas', districts: 4 }, { code: 'KY', name: 'Kentucky', districts: 6 }, { code: 'LA', name: 'Louisiana', districts: 6 },
  { code: 'ME', name: 'Maine', districts: 2 }, { code: 'MD', name: 'Maryland', districts: 8 }, { code: 'MA', name: 'Massachusetts', districts: 9 },
  { code: 'MI', name: 'Michigan', districts: 13 }, { code: 'MN', name: 'Minnesota', districts: 8 }, { code: 'MS', name: 'Mississippi', districts: 4 },
  { code: 'MO', name: 'Missouri', districts: 8 }, { code: 'MT', name: 'Montana', districts: 2 }, { code: 'NE', name: 'Nebraska', districts: 3 },
  { code: 'NV', name: 'Nevada', districts: 4 }, { code: 'NH', name: 'New Hampshire', districts: 2 }, { code: 'NJ', name: 'New Jersey', districts: 12 },
  { code: 'NM', name: 'New Mexico', districts: 3 }, { code: 'NY', name: 'New York', districts: 26 }, { code: 'NC', name: 'North Carolina', districts: 14 },
  { code: 'ND', name: 'North Dakota', districts: 1 }, { code: 'OH', name: 'Ohio', districts: 15 }, { code: 'OK', name: 'Oklahoma', districts: 5 },
  { code: 'OR', name: 'Oregon', districts: 6 }, { code: 'PA', name: 'Pennsylvania', districts: 17 }, { code: 'RI', name: 'Rhode Island', districts: 2 },
  { code: 'SC', name: 'South Carolina', districts: 7 }, { code: 'SD', name: 'South Dakota', districts: 1 }, { code: 'TN', name: 'Tennessee', districts: 9 },
  { code: 'TX', name: 'Texas', districts: 38 }, { code: 'UT', name: 'Utah', districts: 4 }, { code: 'VT', name: 'Vermont', districts: 1 },
  { code: 'VA', name: 'Virginia', districts: 11 }, { code: 'WA', name: 'Washington', districts: 10 }, { code: 'WV', name: 'West Virginia', districts: 2 },
  { code: 'WI', name: 'Wisconsin', districts: 8 }, { code: 'WY', name: 'Wyoming', districts: 1 }
];

export const TERRITORIES = [
  { code: 'DC', name: 'District of Columbia' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'GU', name: 'Guam' },
  { code: 'AS', name: 'American Samoa' },
  { code: 'VI', name: 'Virgin Islands' },
  { code: 'MP', name: 'Northern Mariana Islands' }
];

export function findVacancies(legislators: ProcessedLegislator[]): any[] {
  const vacancies: any[] = [];

  // Check Senate (2 per state)
  STATES.forEach(state => {
    const senators = legislators.filter(l => l.state === state.code && l.branch === 'Senate');
    if (senators.length < 2) {
      for (let i = 0; i < (2 - senators.length); i++) {
        vacancies.push({
          id: `${state.code}-SEN-${i}`,
          state: state.code,
          branch: 'Senate',
          isVotingMember: true,
          title: 'Senator'
        });
      }
    }
  });

  // Check House (by district count)
  STATES.forEach(state => {
    const reps = legislators.filter(l => l.state === state.code && l.branch === 'House');
    
    if (state.districts === 1) {
      // For At-Large states, any House member from that state fills the seat.
      // Data might use district 0, 1, or undefined.
      if (reps.length === 0) {
        vacancies.push({
          id: `${state.code}-REP-AL`,
          state: state.code,
          branch: 'House',
          district: 1,
          isVotingMember: true,
          title: 'Representative'
        });
      }
    } else {
      for (let d = 1; d <= state.districts; d++) {
        const exists = reps.some(r => r.district === d);
        if (!exists) {
          vacancies.push({
            id: `${state.code}-REP-${d}`,
            state: state.code,
            branch: 'House',
            district: d,
            isVotingMember: true,
            title: 'Representative'
          });
        }
      }
    }
  });

  // Check Delegates
  TERRITORIES.forEach(territory => {
    const exists = legislators.some(l => l.state === territory.code);
    if (!exists) {
      vacancies.push({
        id: `${territory.code}-DEL`,
        state: territory.code,
        branch: 'House',
        isVotingMember: false,
        title: territory.code === 'PR' ? 'Resident Commissioner' : 'Delegate'
      });
    }
  });

  return vacancies;
}
