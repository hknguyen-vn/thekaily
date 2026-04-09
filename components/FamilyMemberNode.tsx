import React, { memo } from 'react';
import Image from 'next/image';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, UserRound, Calendar, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FamilyMemberNode = memo(({ data, selected }: NodeProps) => {
  const { name, gender, dateOfBirth, avatar } = data as any;

  const isMale = gender === 'male';
  const isFemale = gender === 'female';

  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-xl border-2 transition-all duration-200 w-[220px] bg-white shadow-sm',
        selected ? 'border-primary ring-4 ring-primary/10' : 'border-stone-200 hover:border-stone-300',
        isMale && 'bg-blue-50/30',
        isFemale && 'bg-rose-50/30'
      )}
    >
      {/* Handles for connections */}
      {/* Top handle for parents */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-stone-400 border-2 border-white"
      />
      
      {/* Bottom handle for children */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-stone-400 border-2 border-white"
      />

      {/* Side handles for spouses */}
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-left"
        className="w-2 h-2 bg-stone-300 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        className="w-2 h-2 bg-stone-300 border-2 border-white"
      />

      <div className="flex items-center gap-3">
        <div className={cn(
          'relative w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0 flex items-center justify-center',
          isMale ? 'border-blue-200 bg-blue-100' : 'border-rose-200 bg-rose-100',
          !isMale && !isFemale && 'border-stone-200 bg-stone-100'
        )}>
          {avatar ? (
            <Image src={avatar} alt={name} fill className="object-cover" referrerPolicy="no-referrer" unoptimized />
          ) : (
            isMale ? <User className="text-blue-600" size={24} /> : <UserRound className="text-rose-600" size={24} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-800 text-sm truncate">{name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
              isMale ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
            )}>
              {isMale ? 'Nam' : isFemale ? 'Nữ' : 'Khác'}
            </span>
          </div>
        </div>
      </div>

      {dateOfBirth && (
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-1.5 text-stone-500">
          <Calendar size={12} />
          <span className="text-[10px]">{dateOfBirth}</span>
        </div>
      )}

      {selected && (
        <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg animate-bounce">
          <span className="text-[8px]">i</span>
        </div>
      )}
    </div>
  );
});

FamilyMemberNode.displayName = 'FamilyMemberNode';
