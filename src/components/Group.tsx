import { useRef } from 'react';
import { X, Layers, MousePointer, Info } from 'lucide-react';
import { Group as GroupType, DbPane } from '../types';
import { Pane } from './Pane';

interface GroupProps {
  groups: GroupType[];
  panesByGroup: Record<string, DbPane[]>;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane?: (groupId: string) => void;
  onCloseGroup?: (groupId: string) => void;
  workspacePath?: string;
}

const MIN_SIZE = 150;

function VerticalPaneGroup({
  group,
  panes,
  groupNumber,
  paneIndexOffset,
  activePaneIndex,
  onPaneClick,
  onClosePane,
  onAddPane,
  onCloseGroup,
  workspacePath,
}: {
  group: GroupType;
  panes: DbPane[];
  groupNumber: number;
  paneIndexOffset: number;
  activePaneIndex: number;
  onPaneClick: (index: number) => void;
  onClosePane?: (paneId: string) => void;
  onAddPane?: (groupId: string) => void;
  onCloseGroup?: (groupId: string) => void;
  workspacePath?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPanes = panes.length;
  
  const getPaneSize = (index: number): number => {
    if (totalPanes === 1) return 100;
    const pane = panes[index];
    if (pane && pane.size) return pane.size;
    return 100 / totalPanes;
  };

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
              onClick={() => onCloseGroup(group.id)}
              className="text-[#aaaaaa] hover:text-red-400 text-xs px-1"
              title="Close group"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {onAddPane && (
            <button
              onClick={() => onAddPane(group.id)}
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
              mode={pane.mode}
              agentCommand={pane.agent_command}
              onClick={() => onPaneClick(paneIndexOffset + idx)}
              onClose={onClosePane ? () => onClosePane(pane.id) : undefined}
              workspacePath={workspacePath}
            />
            
            {idx < panes.length - 1 && (
              <div
                className="absolute left-0 right-0 h-[4px] bg-transparent hover:bg-white/50 cursor-row-resize z-10"
                style={{ top: '100%', transform: 'translateY(-50%)' }}
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
  groups,
  panesByGroup,
  activePaneIndex,
  onPaneClick,
  onClosePane,
  onAddPane,
  onCloseGroup,
  workspacePath,
}: GroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const totalGroups = groups.length;

  const getGroupSize = (index: number): number => {
    if (totalGroups === 1) return 100;
    const group = groups[index];
    if (group && group.size) return group.size;
    return 100 / totalGroups;
  };

  if (!groups || groups.length === 0) {
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
        const panes = panesByGroup[group.id] || [];
        const groupPaneCount = panes.length;
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
              group={group}
              panes={panes}
              groupNumber={groupIdx + 1}
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
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
