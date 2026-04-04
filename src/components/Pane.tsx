interface PaneProps {
  index: number;
  isActive: boolean;
  totalPanes: number;
  onClick: () => void;
}

export function Pane({ 
  index, 
  isActive, 
  totalPanes, 
  onClick,
}: PaneProps) {
  const label = `PANE ${index + 1}`;
  const borderColor = isActive ? '#ffffff' : '#1a1a1a';
  
  return (
    <div 
      onClick={onClick}
      className="h-full flex flex-col bg-surface cursor-pointer"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <div 
        className="h-6 flex items-center justify-between px-2 bg-bg"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <span className="text-[10px] text-[#555555] uppercase tracking-wider font-mono">
          {label}
        </span>
        <span className="text-[10px] text-[#555555] font-mono">
          {index + 1}/{totalPanes}
        </span>
      </div>
      
      <div className="flex-1 bg-[#0d0d0d] overflow-hidden">
      </div>
    </div>
  );
}