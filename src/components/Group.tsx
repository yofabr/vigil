import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Layers, MousePointer, Info } from 'lucide-react';
import { Pane as PaneType } from '../types';
import { Pane } from './Pane';

interface GroupProps {
  pane: PaneType;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane?: (groupId: string) => void;
  onCloseGroup?: (groupId: string) => void;
  workspacePath?: string;
}

const MIN_SIZE = 150;

function VerticalPaneGroup({
  groupPane,
  groupNumber,
  sizes,
  setSizes,
  paneIndexOffset,
  activePaneIndex,
  onPaneClick,
  onClosePane,
  onAddPane,
  onCloseGroup,
  workspacePath,
}: {
  groupPane: PaneType;
  groupNumber: number;
  sizes: Record<string, number>;
  setSizes: (s: Record<string, number>) => void;
  paneIndexOffset: number;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane?: (groupId: string) => void;
  onCloseGroup?: (groupId: string) => void;
  workspacePath?: string;
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

  const panes = groupPane.children || [];
  const totalPanes = panes.length;
  
  const getPaneSize = (index: number): number => {
    if (totalPanes === 1) return 100;
    const key = `${groupPane.id}-${index}`;
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
      [`${groupPane.id}-${index}`]: newAbove,
      [`${groupPane.id}-${index + 1}`]: newBelow,
    });
  }, [sizes, setSizes, containerHeight, groupPane.id]);

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full relative">
      <div className="h-6 flex items-center justify-between px-2 bg-bg border-b border-border-inactive">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-[#666666]" />
          <span className="text-[10px] text-[#aaaaaa] font-mono">Group {groupNumber}</span>
        </div>
        <div className="flex items-center gap-1">
          {onCloseGroup && (
            <button
              onClick={() => onCloseGroup(groupPane.id)}
              className="text-[#aaaaaa] hover:text-red-400 text-xs px-1"
              title="Close group"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {onAddPane && (
            <button
              onClick={() => onAddPane(groupPane.id)}
              className="text-[#aaaaaa] hover:text-white text-xs px-1"
              title="Add pane"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        {panes.map((pane, idx) => {
        const size = getPaneSize(idx);
        const isActive = (paneIndexOffset + idx) === activePaneIndex;
        
        return (
          <div
            key={pane.id}
            className="relative border-b border-border-inactive"
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
              workspacePath={workspacePath}
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

export function Group({
  pane,
  activePaneIndex,
  onPaneClick,
  onClosePane,
  onAddPane,
  onCloseGroup,
  workspacePath,
}: GroupProps) {
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

  useEffect(() => {
    setSizes({});
  }, [pane.id, pane.children?.length]);

  const groups = pane.children || [];
  const totalGroups = groups.length;

  const getGroupSize = (index: number): number => {
    if (totalGroups === 1) return 100;
    const key = `group-${index}`;
    return sizes[key] ?? (100 / totalGroups);
  };

  const handleHorizontalResize = useCallback((index: number, deltaX: number) => {
    const groupLeft = getGroupSize(index);
    const groupRight = getGroupSize(index + 1);
    const totalWidth = containerWidth;
    
    const deltaFraction = (deltaX / totalWidth) * 100;
    let newLeft = groupLeft + deltaFraction;
    let newRight = groupRight - deltaFraction;
    
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
      [`group-${index}`]: newLeft,
      [`group-${index + 1}`]: newRight,
    });
  }, [sizes, setSizes, containerWidth]);

  if (!pane.children || pane.children.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-bg">
        <div className="text-center p-8 max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface/30 mb-4">
            <Layers className="w-8 h-8 text-[#666666]" />
          </div>
          <h3 className="text-lg text-[#aaaaaa] font-medium mb-2">No Groups Yet</h3>
          <p className="text-sm text-[#666666] mb-4">
            Create your first group to start organizing your workspace panes.
          </p>
          <div className="flex flex-col gap-2 text-xs text-[#555555] font-mono">
            <div className="flex items-center gap-2 justify-center">
              <MousePointer className="w-3 h-3" />
              <span>Click "Add Group" in the top bar</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Info className="w-3 h-3" />
              <span>Layers help you group and split panes</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let paneIndexOffset = 0;

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full relative">
      <div className="flex-1 flex relative">
        {groups.map((group, groupIdx) => {
        const size = getGroupSize(groupIdx);
        const groupPaneCount = group.children?.length || 0;
        const currentOffset = paneIndexOffset;
        
        paneIndexOffset += groupPaneCount;
        
        return (
          <div
            key={group.id}
            className="relative border-r border-border-inactive"
            style={{
              width: `${size}%`,
              minWidth: MIN_SIZE,
            }}
          >
            <VerticalPaneGroup
              groupPane={group}
              groupNumber={groupIdx + 1}
              sizes={sizes}
              setSizes={setSizes}
              paneIndexOffset={currentOffset}
              activePaneIndex={activePaneIndex}
              onPaneClick={onPaneClick}
              onClosePane={onClosePane}
              onAddPane={onAddPane}
              onCloseGroup={onCloseGroup}
              workspacePath={workspacePath}
            />
            
            {groupIdx < groups.length - 1 && (
              <div
                className="absolute top-0 bottom-0 w-[4px] bg-transparent hover:bg-white/50 cursor-col-resize z-10"
                style={{ left: '100%', transform: 'translateX(-50%)' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const startX = e.clientX;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    handleHorizontalResize(groupIdx, deltaX);
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
