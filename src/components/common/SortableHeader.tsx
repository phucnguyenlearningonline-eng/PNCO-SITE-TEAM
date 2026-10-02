import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SortDirection } from '../../utils/sortUtils';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
  title?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  align = 'left',
  className = '',
  title,
}) => {
  const isActive = currentSortKey === sortKey;

  const getAlignClasses = () => {
    switch (align) {
      case 'center':
        return 'justify-center text-center';
      case 'right':
        return 'justify-end text-right';
      default:
        return 'justify-start text-left';
    }
  };

  return (
    <th
      className={`py-3 px-3 select-none transition-colors cursor-pointer group hover:bg-[#153457] ${className}`}
      onClick={() => onSort(sortKey)}
      title={title || `Bấm để đổi thứ tự sắp xếp theo ${label} (Tăng dần / Giảm dần)`}
    >
      <div className={`flex items-center gap-1.5 ${getAlignClasses()}`}>
        <span className={`transition-colors font-bold text-[11px] ${isActive ? 'text-amber-300 font-black' : 'text-white group-hover:text-slate-200'}`}>
          {label}
        </span>
        <span className="inline-flex items-center justify-center shrink-0">
          {isActive ? (
            currentDirection === 'asc' ? (
              <span className="p-0.5 rounded bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40" title="Đang sắp xếp: Từ dưới lên (Tăng dần ▲)">
                <ChevronUp className="w-3.5 h-3.5 stroke-[2.8]" />
              </span>
            ) : (
              <span className="p-0.5 rounded bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40" title="Đang sắp xếp: Từ trên xuống (Giảm dần ▼)">
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.8]" />
              </span>
            )
          ) : (
            <ChevronsUpDown className="w-3 h-3 text-white/35 group-hover:text-white/80 transition-colors" />
          )}
        </span>
      </div>
    </th>
  );
};
