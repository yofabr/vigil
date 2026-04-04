import { useState, useRef, useEffect, useCallback } from 'react';
import { Pane as PaneType } from '../types';
import { Pane } from './Pane';

interface PaneContainerProps {
  pane: PaneType;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane?: (pcId: string) => void;
  onAddPC?: () => void;
  canClosePane?: boolean;
}

const MIN_SIZE = 150;

function VerticalPaneGroup({
  pcPane,
  sizes,
  setSizes,
  paneIndexOffset,
  activePaneIndex,
  onPaneClick,
  onClosePane,
  onAddPane,
  canClosePane,
}: {
  pcPane: PaneType;
  sizes: Record<string, number>;
  setSizes: (s: Record<string, number>) => void;
  paneIndexOffset: number;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane?: (pcId: string) => void;
  canClosePane?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const panes = pcPane.children || [];
  const totalPanes = panes.length;
  
  const getPaneSize = (index: number): number => {
    if (totalPanes === 1) return 100;
    const key = `${pcPane.id}-${index}`;
    return sizes[key] ?? (100 / totalPanes);
  };

  const handleVerticalResize = useCallback((index: number, deltaY: number) => {
    const paneAbove = getPaneSize(index);
    const paneBelow = getPaneSize(index + 1);
    const totalHeight = containerHeight;
    
    const deltaFraction = (deltaY / totalHeight) * 100;
    let newAbove = paneAbove + deltaFraction;
    let newBelow = paneBelow - deltaFraction;
    
    const minFraction = (MIN_SIZE / totalHeight) * 100;
    
    if (newAbove < minFraction) {
      newAbove = minFraction;
      newBelow = 100 - minFraction;
    } else if (newBelow < minFraction) {
      newBelow = minFraction;
      newAbove = 100 - minFraction;
    }
    
    setSizes({
      ...sizes,
      [`${pcPane.id}-${index}`]: newAbove,
      [`${pcPane.id}-${index + 1}`]: newBelow,
    });
  }, [sizes, setSizes, containerHeight, pcPane.id]);

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full relative">
      <div className="h-6 flex items-center justify-end px-2 bg-bg border-b border-[#1a1a1a]">
        {onAddPane && (
          <button
            onClick={() => onAddPane(pcPane.id)}
            className="text-[#555555] hover:text-white text-xs px-1"
          >
            +
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        {panes.map((pane, idx) => {
        const size = getPaneSize(idx);
        const isActive = (paneIndexOffset + idx) === activePaneIndex;
        
        return (
          <div
            key={pane.id}
            className="relative border-b border-[#1a1a1a]"
            style={{
              height: `${size}%`,
              minHeight: MIN_SIZE,
            }}
          >
            <Pane
              index={paneIndexOffset + idx}
              isActive={isActive}
              totalPanes={totalPanes}
              onClick={() => onPaneClick(paneIndexOffset + idx)}
              onClose={onClosePane ? () => onClosePane(pane.id) : undefined}
              canClose={canClosePane}
            />
            
            {idx < panes.length - 1 && (
              <div
                className="absolute left-0 right-0 h-[4px] bg-transparent hover:bg-white/50 cursor-row-resize z-10"
                style={{ top: '100%', transform: 'translateY(-50%)' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const startY = e.clientY;
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaY = moveEvent.clientY - startY;
                    handleVerticalResize(idx, deltaY);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = 'default';
                    document.body.style.userSelect = 'auto';
                  };
                  
                  document.body.style.cursor = 'row-resize';
                  document.body.style.userSelect = 'none';
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}

export function PaneContainer({
  pane,
  activePaneIndex,
  onPaneClick,
  onClosePane,
  onAddPane,
  onAddPC,
  canClosePane,
}: PaneContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [sizes, setSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pcs = pane.children || [];
  const totalPCs = pcs.length;

  const getPCSize = (index: number): number => {
    if (totalPCs === 1) return 100;
    const key = `pc-${index}`;
    return sizes[key] ?? (100 / totalPCs);
  };

  const handleHorizontalResize = useCallback((index: number, deltaX: number) => {
    const pcLeft = getPCSize(index);
    const pcRight = getPCSize(index + 1);
    const totalWidth = containerWidth;
    
    const deltaFraction = (deltaX / totalWidth) * 100;
    let newLeft = pcLeft + deltaFraction;
    let newRight = pcRight - deltaFraction;
    
    const minFraction = (MIN_SIZE / totalWidth) * 100;
    
    if (newLeft < minFraction) {
      newLeft = minFraction;
      newRight = 100 - minFraction;
    } else if (newRight < minFraction) {
      newRight = minFraction;
      newLeft = 100 - minFraction;
    }
    
    setSizes({
      ...sizes,
      [`pc-${index}`]: newLeft,
      [`pc-${index + 1}`]: newRight,
    });
  }, [sizes, setSizes, containerWidth]);

  if (!pane.children || pane.children.length === 0) {
    return (
      <div className="h-full w-full">
        <Pane
          index={0}
          isActive={activePaneIndex === 0}
          totalPanes={1}
          onClick={() => onPaneClick(0)}
        />
      </div>
    );
  }

  let paneIndexOffset = 0;

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full relative">
      {onAddPC && (
        <div className="h-8 flex items-center justify-end px-2 border-b border-[#1a1a1a]">
          <button
            onClick={onAddPC}
            className="text-[#555555] hover:text-white text-xs px-2 py-1 hover:bg-white/10 transition-colors font-mono"
          >
            + Add PC
          </button>
        </div>
      )}
      <div className="flex-1 flex relative">
        {pcs.map((pc, pcIdx) => {
        const size = getPCSize(pcIdx);
        const pcPaneCount = pc.children?.length || 0;
        const currentOffset = paneIndexOffset;
        
        paneIndexOffset += pcPaneCount;
        
        return (
          <div
            key={pc.id}
            className="relative border-r border-[#1a1a1a]"
            style={{
              width: `${size}%`,
              minWidth: MIN_SIZE,
            }}
          >
            <VerticalPaneGroup
              pcPane={pc}
              sizes={sizes}
              setSizes={setSizes}
              paneIndexOffset={currentOffset}
              activePaneIndex={activePaneIndex}
              onPaneClick={onPaneClick}
              onClosePane={onClosePane}
              onAddPane={onAddPane}
              canClosePane={canClosePane}
            />
            
            {pcIdx < pcs.length - 1 && (
              <div
                className="absolute top-0 bottom-0 w-[4px] bg-transparent hover:bg-white/50 cursor-col-resize z-10"
                style={{ left: '100%', transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const startX = e.clientX;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    handleHorizontalResize(pcIdx, deltaX);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = 'default';
                    document.body.style.userSelect = 'auto';
                  };
                  
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
