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
  split: 'horizontal' | 'vertical';
  siblingSizes: [number, number];
  parentSize: number;
}

function ResizeHandle({ 
  split, 
  sizes, 
  setSizes, 
  sizeKey1, 
  sizeKey2,
  parentSize 
}: { 
  split: 'horizontal' | 'vertical';
  sizes: Record<string, number>;
  setSizes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sizeKey1: string;
  sizeKey2: string;
  parentSize: number;
}) {
  const resizeRef = useRef<ResizeState | null>(null);
  const isHorizontal = split === 'horizontal';
  
  return (
    <div
      className="w-1 bg-[#0f0f0f] hover:bg-white transition-colors duration-100 flex-shrink-0"
      style={{ cursor: isHorizontal ? 'col-resize' : 'row-resize' }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const size1 = sizes[sizeKey1] ?? 0.5;
        const size2 = sizes[sizeKey2] ?? 0.5;
        
        resizeRef.current = {
          split,
          siblingSizes: [size1, size2],
          parentSize,
        };
        
        const startPos = isHorizontal ? e.clientX : e.clientY;
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!resizeRef.current) return;
          
          const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
          const delta = currentPos - startPos;
          const deltaFraction = delta / resizeRef.current.parentSize;
          
          const [s1, s2] = resizeRef.current.siblingSizes;
          let newS1 = s1 + deltaFraction;
          let newS2 = s2 - deltaFraction;
          
          const minFraction = MIN_SIZE / resizeRef.current.parentSize;
          
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  
  const flatPanes = flattenPanesWithIndex(pane, null);
  const totalPanes = flatPanes.length;

  const renderPaneRecursive = (
    p: PaneType, 
    index: number,
    path: string[] = [],
    parentEl: HTMLDivElement | null = null
  ): React.ReactNode => {
    const isActive = index === activePaneIndex;
    const isHorizontal = p.split === 'horizontal';

    if (p.children && p.children.length > 0) {
      const childCount = p.children.length;
      
      return (
        <div
          key={p.id}
          ref={(el) => {
            if (path.length === 0) {
              (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            }
          }}
          className={`flex h-full w-full ${isHorizontal ? 'flex-row' : 'flex-col'}`}
        >
          {p.children.map((child, idx) => {
            const childPath = [...path, String(idx)];
            const sizeKey = childPath.join('-');
            const flexValue = sizes[sizeKey] ?? (1 / childCount);
            
            return (
              <div 
                key={child.id} 
                className="relative"
                style={{ 
                  flex: `${flexValue} ${flexValue} 0%`,
                  minWidth: isHorizontal ? MIN_SIZE + 'px' : undefined,
                  minHeight: !isHorizontal ? MIN_SIZE + 'px' : undefined,
                }}
              >
                {renderPaneRecursive(child, index, childPath, null)}
                {idx < childCount - 1 && (
                  <ResizeHandle
                    split={p.split!}
                    sizes={sizes}
                    setSizes={setSizes}
                    sizeKey1={sizeKey}
                    sizeKey2={[...path, String(idx + 1)].join('-')}
                    parentSize={parentEl ? (isHorizontal ? parentEl.offsetWidth : parentEl.offsetHeight) : (containerRef.current ? (isHorizontal ? containerRef.current.offsetWidth : containerRef.current.offsetHeight) : window.innerWidth)}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    return (
      <div className="h-full w-full">
        <Pane
          key={p.id}
          index={index}
          isActive={isActive}
          totalPanes={totalPanes}
          onClick={() => onPaneClick(index)}
        />
      </div>
    );
  };

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

  return (
    <div ref={containerRef} className="flex h-full w-full">
      {renderPaneRecursive(pane, activePaneIndex, ['0'], null)}
    </div>
  );
}