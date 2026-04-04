import { useState, useRef } from 'react';
import { Pane as PaneType } from '../types';
import { Pane } from './Pane';

interface PaneContainerProps {
  pane: PaneType;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
}

function flattenPanesWithIndex(pane: PaneType, parentSplit: 'horizontal' | 'vertical' | null): Array<{ pane: PaneType; split: 'horizontal' | 'vertical' | null }> {
  if (!pane.children || pane.children.length === 0) {
    return [{ pane, split: parentSplit }];
  }
  return pane.children.flatMap(child => flattenPanesWithIndex(child, pane.split ?? parentSplit));
}

const MIN_SIZE = 150;

interface ResizeState {
  parentRef: HTMLDivElement;
  split: 'horizontal' | 'vertical';
  siblingSizes: [number, number];
}

function ResizeHandle({ 
  split, 
  sizes, 
  setSizes, 
  sizeKey1, 
  sizeKey2 
}: { 
  split: 'horizontal' | 'vertical';
  sizes: Record<string, number>;
  setSizes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sizeKey1: string;
  sizeKey2: string;
}) {
  const resizeRef = useRef<ResizeState | null>(null);
  const isHorizontal = split === 'horizontal';
  
  return (
    <div
      className="w-1 bg-[#0f0f0f] hover:bg-white transition-colors duration-100 cursor-col-resize flex-shrink-0"
      style={{ cursor: isHorizontal ? 'col-resize' : 'row-resize' }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const parent = e.currentTarget.parentElement as HTMLDivElement;
        if (!parent) return;
        
        const size1 = sizes[sizeKey1] ?? 0.5;
        const size2 = sizes[sizeKey2] ?? 0.5;
        
        resizeRef.current = {
          parentRef: parent,
          split,
          siblingSizes: [size1, size2],
        };
        
        const startPos = isHorizontal ? e.clientX : e.clientY;
        const parentSize = isHorizontal ? parent.offsetWidth : parent.offsetHeight;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!resizeRef.current) return;
          
          const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
          const delta = currentPos - startPos;
          const deltaFraction = delta / parentSize;
          
          const [s1, s2] = resizeRef.current.siblingSizes;
          let newS1 = s1 + deltaFraction;
          let newS2 = s2 - deltaFraction;
          
          const minFraction = MIN_SIZE / parentSize;
          
          if (newS1 < minFraction) {
            newS1 = minFraction;
            newS2 = 1 - minFraction;
          } else if (newS2 < minFraction) {
            newS2 = minFraction;
            newS1 = 1 - minFraction;
          }
          
          setSizes(prev => ({
            ...prev,
            [sizeKey1]: newS1,
            [sizeKey2]: newS2,
          }));
          
          resizeRef.current.siblingSizes = [newS1, newS2];
        };
        
        const handleMouseUp = () => {
          resizeRef.current = null;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = 'default';
          document.body.style.userSelect = 'auto';
        };
        
        document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
    />
  );
}

export function PaneContainer({
  pane,
  activePaneIndex,
  onPaneClick,
}: PaneContainerProps) {
  const [sizes, setSizes] = useState<Record<string, number>>({});
  
  const flatPanes = flattenPanesWithIndex(pane, null);
  const totalPanes = flatPanes.length;

  const renderPaneRecursive = (
    p: PaneType, 
    index: number,
    path: string[] = []
  ): React.ReactNode => {
    const isActive = index === activePaneIndex;

    if (p.children && p.children.length > 0) {
      const childCount = p.children.length;
      
      return (
        <div
          key={p.id}
          className={`flex h-full w-full ${p.split === 'horizontal' ? 'flex-row' : 'flex-col'}`}
        >
          {p.children.map((child, idx) => {
            const childPath = [...path, String(idx)];
            const sizeKey = childPath.join('-');
            
            const otherIdx = idx === 0 ? 1 : 0;
            const otherPath = [...path, String(otherIdx)];
            const otherSizeKey = otherPath.join('-');
            
            const flexValue = sizes[sizeKey] ?? (1 / childCount);
            
            return (
              <div 
                key={child.id} 
                style={{ flex: flexValue, minWidth: MIN_SIZE + 'px', minHeight: MIN_SIZE + 'px' }}
              >
                {renderPaneRecursive(child, index, childPath)}
                {idx < childCount - 1 && (
                  <ResizeHandle
                    split={p.split!}
                    sizes={sizes}
                    setSizes={setSizes}
                    sizeKey1={sizeKey}
                    sizeKey2={otherSizeKey}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    return (
      <Pane
        key={p.id}
        index={index}
        isActive={isActive}
        totalPanes={totalPanes}
        onClick={() => onPaneClick(index)}
      />
    );
  };

  if (!pane.children || pane.children.length === 0) {
    return (
      <Pane
        index={0}
        isActive={activePaneIndex === 0}
        totalPanes={1}
        onClick={() => onPaneClick(0)}
      />
    );
  }

  return (
    <div className="flex h-full w-full">
      {renderPaneRecursive(pane, activePaneIndex, ['0'])}
    </div>
  );
}