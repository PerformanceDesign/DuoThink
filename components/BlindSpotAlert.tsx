
import React from 'react';
import { BlindSpot } from '../types';

interface BlindSpotAlertProps {
  blindSpot: BlindSpot;
}

const BlindSpotAlert: React.FC<BlindSpotAlertProps> = ({ blindSpot }) => {
  return (
    <div className="flex justify-center w-full my-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-md w-full bg-amber-900/20 border border-amber-alert/40 rounded-md p-4 flex gap-4 backdrop-blur-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]">
        <div className="shrink-0 pt-0.5">
          <span className="material-symbols-outlined text-amber-alert text-xl">warning</span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-amber-alert font-bold text-sm uppercase tracking-wide flex items-center gap-2">
            Logical Fallacy: {blindSpot.type}
          </h3>
          <p className="text-amber-100/90 text-sm leading-snug font-light">
            {blindSpot.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlindSpotAlert;
