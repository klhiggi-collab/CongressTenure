import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Info, ArrowRight } from 'lucide-react';
import { VacantSeat } from '../types';
import { STATES, TERRITORIES } from '../services/congressService';

interface VacantCardProps {
  seat: VacantSeat;
  onViewVoterGuide: (seat: VacantSeat) => void;
}

export const VacantCard: React.FC<VacantCardProps> = ({ seat, onViewVoterGuide }) => {
  const stateInfo = STATES.find(s => s.code === seat.state);
  const stateName = stateInfo?.name || TERRITORIES.find(t => t.code === seat.state)?.name || seat.state;
  const isAtLarge = seat.branch === 'House' && stateInfo?.districts === 1;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white/50 border-2 border-dashed border-gray-200 rounded-2xl p-6 transition-all hover:border-blue-200 hover:bg-white"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Congressional Seat
            </span>
            <h3 className="text-xl font-bold text-gray-300 uppercase tracking-tight">
              Vacant {seat.title}
            </h3>
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${
            seat.isVotingMember 
              ? 'bg-blue-50 text-blue-400 border border-blue-100' 
              : 'bg-gray-100 text-gray-400 border border-gray-200'
          }`}>
            {seat.isVotingMember ? 'Voting Member' : 'Non-Voting Delegate'}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin size={14} />
            <span className="text-sm font-medium">
              {stateName} {seat.branch === 'House' && seat.district ? `— ${isAtLarge ? 'At-Large' : `District ${seat.district}`}` : `— ${seat.branch}`}
            </span>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
            <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              This {seat.title.toLowerCase()} seat is currently unoccupied. Representation for this {seat.branch === 'House' ? 'district' : 'state'} is pending a special election or appointment.
            </p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => onViewVoterGuide(seat)}
          className="mt-auto w-full py-3 px-4 bg-white border border-gray-200 text-gray-400 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all group-hover:border-blue-500 group-hover:text-blue-600 group-hover:shadow-sm"
        >
          View Voter Guide
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-gray-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};
