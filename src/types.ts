export interface Term {
  type: 'rep' | 'sen';
  start: string;
  end: string;
  state: string;
  district?: number;
  party: string;
  class?: number;
  state_rank?: string;
}

export interface Legislator {
  id: {
    bioguide: string;
    govtrack: number;
    opensecrets?: string;
    votesmart?: number;
    fec?: string[];
    cspan?: number;
    wikipedia?: string;
    wikidata?: string;
    google_entity_id?: string;
  };
  name: {
    first: string;
    last: string;
    official_full: string;
    middle?: string;
    suffix?: string;
    nickname?: string;
  };
  bio: {
    birthday: string;
    gender: string;
  };
  terms: Term[];
}

export interface ProcessedLegislator {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  branch: 'House' | 'Senate';
  totalYears: number;
  currentTermStart: string;
  currentTermEnd: string;
  nextElectionYear: number;
  nextElectionDate: string;
  district?: number;
  termCount: number;
  terms: Term[];
  tenureStatus: 'normal' | 'approaching' | 'exceeded';
  isVotingMember: boolean;
  title: string;
  age: number;
  netWorth?: number;
  baselineNetWorth?: number;
  baselineYear?: number;
}

export interface VacantSeat {
  id: string;
  state: string;
  branch: 'House' | 'Senate';
  district?: number;
  isVotingMember: boolean;
  title: string;
}
