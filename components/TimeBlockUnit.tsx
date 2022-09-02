import { HotkeyConfig, useHotkeys } from "@blueprintjs/core";
import { Atom, PrimitiveAtom, useAtom } from "jotai";
import {
  CSSProperties,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { TimeBlockEntry } from "../model/model";
import { timeBlockEntriesAtom } from "../pages/blocks/[id]";
import { getTextColor } from "./helpers";
import { SearchContext } from "./SearchContext";
import { TaskColorContext } from "./TaskColorContext";
import { TaskUnitDetailsPopover } from "./TaskUnitDetailsPopover";
import { TaskUnitEditOrDisplay } from "./TaskUnitEditOrDisplay";
import { DragLoc } from "./TimeBlockDay";

export interface TimeBlockUnitProps {
  onStartDrag?: (id: string, location: DragLoc, clientY: number) => void;

  onChange(id: string, newEntry: TimeBlockEntry): void;

  // onDelete?(): void;

  hourScale?: d3.ScaleTime<number, number>;
  // blockAtom: PrimitiveAtom<TimeBlockEntry>;
  block: TimeBlockEntry;

  column?: number;

  shouldColorDefault?: boolean;
  startTime: Date;
}

export function TimeBlockUnit(props: TimeBlockUnitProps) {
  const {
    onStartDrag,
    // onDelete,
    onChange,
    // blockAtom,
    block,
    hourScale,
    column,
    shouldColorDefault,
    startTime,
  } = props;

  const [timeBlockEntries, setem] = useAtom(timeBlockEntriesAtom);

  const searchContext = useContext(SearchContext);
  const isLiveSearch = searchContext.isSearchOpen && searchContext.searchText;
  const isSearchMatch = block.description.includes(searchContext.searchText);

  const zeroPx = hourScale?.(0) ?? 0;
  const durationPx = hourScale?.(new Date(block.duration * 1000)) ?? 80;

  const height = Math.max(durationPx - zeroPx, 0);

  const [isEdit, setIsEdit] = useState(false);

  const [editText, setEditText] = useState(block.description);

  const acceptEditText = () => {
    setIsEdit(false);
    onChange(block.id, {
      ...block,
      description: editText,
    });
  };

  const style: CSSProperties = hourScale
    ? {
        position: "absolute",
        top: hourScale(block.start),
        left: column * 200,
      }
    : { position: "relative" };

  const isScheduled = block.start !== undefined;

  const colorContext = useContext(TaskColorContext);

  let backgroundColor =
    shouldColorDefault || !colorContext.isColoredByPriority
      ? block.isComplete
        ? "#f5f5f5"
        : "#C0DFF7"
      : colorContext.getColorFromPriority(block.priority ?? 5);

  // search overrides color
  if (isLiveSearch) {
    if (isSearchMatch) {
      // a nice orange color
      backgroundColor = "#ffc619";
    } else {
      backgroundColor = "#f5f5f5";
    }
  }

  const borderStyle = block.isFrozen ? "dashed" : "solid";

  const textColor = getTextColor(backgroundColor);

  const [isMouseInside, setIsMouseInside] = useState(false);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const onChangePartial = useCallback(
    (newEntry: Partial<TimeBlockEntry>) => {
      onChange(block.id, {
        ...block,
        ...newEntry,
      });
    },
    [block, onChange]
  );

  const handleDelete = useCallback(() => {
    setem(timeBlockEntries.filter((e) => e.id !== block.id));
  }, [timeBlockEntries, block.id, setem]);

  const getFirstStartTime = useCallback(
    (entriesFirstDay: TimeBlockEntry[] = []) => {
      const maxEndTime = entriesFirstDay.reduce((max, block) => {
        if (block.start === undefined) {
          return max;
        }

        return Math.max(max, block.start + block.duration * 1000);
      }, startTime.getTime());

      return maxEndTime;
    },
    [startTime]
  );

  const handleBlockSchedule = useCallback(() => {
    // remove from unscheduled
    const taskToSched = timeBlockEntries.find((t) => t.id === block.id);

    if (!taskToSched) {
      return;
    }

    taskToSched.start = getFirstStartTime(timeBlockEntries);

    setem([...timeBlockEntries]);
  }, [block.id, getFirstStartTime, setem, timeBlockEntries]);

  const handleBlockUnschedule = useCallback(() => {
    // remove from unscheduled
    const taskToSched = timeBlockEntries.find((t) => t.id === block.id);

    if (!taskToSched) {
      return;
    }

    taskToSched.start = undefined;

    setem([...timeBlockEntries]);
  }, [block.id, setem, timeBlockEntries]);

  // set up keyboard shortcuts
  const hotkeys = useMemo<HotkeyConfig[]>(
    () => [
      {
        combo: "d",
        label: "details",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => setIsDetailsOpen(!isDetailsOpen),
      },
      {
        combo: "e",
        label: "edit",
        preventDefault: true,
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => setIsEdit(!isEdit),
      },
      {
        combo: "x",
        label: "delete",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => handleDelete(),
      },
      {
        combo: "s",
        label: "schedule",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () =>
          isScheduled ? handleBlockUnschedule() : handleBlockSchedule(),
      },
      {
        combo: "1",
        label: "set priority 1",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ priority: 1 }),
      },
      {
        combo: "2",
        label: "set priority 2",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ priority: 2 }),
      },
      {
        combo: "3",
        label: "set priority 3",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ priority: 3 }),
      },

      {
        combo: "4",
        label: "set priority 4",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ priority: 4 }),
      },
      {
        combo: "5",
        label: "set priority 5",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ priority: 5 }),
      },
      {
        combo: "c",
        label: "complete",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ isComplete: !block.isComplete }),
      },
      {
        combo: "f",
        label: "freeze",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () => onChangePartial({ isFrozen: !block.isFrozen }),
      },
    ],
    [
      isDetailsOpen,
      isMouseInside,
      isEdit,
      isScheduled,
      block.isComplete,
      block.isFrozen,
      onChangePartial,
      handleDelete,
      handleBlockSchedule,
      handleBlockUnschedule,
    ]
  );

  useHotkeys(hotkeys);

  return (
    <div
      style={{
        ...style,
        height: height,
        width: 200,
        border: "1px solid black",
        borderStyle,
        backgroundColor,
        color: textColor,
        padding: 3,
      }}
      onMouseEnter={() => setIsMouseInside(true)}
      onMouseLeave={() => setIsMouseInside(false)}
    >
      {isScheduled && (
        <>
          <div
            className="body-drag"
            onMouseDown={(evt) => {
              evt.stopPropagation();
              onStartDrag(block.id, "all", evt.clientY);
            }}
          />

          <div
            className="top-drag"
            onMouseDown={(evt) => {
              evt.stopPropagation();
              onStartDrag(block.id, "top", evt.clientY);
            }}
          />
          <div
            className="bottom-drag"
            onMouseDown={(evt) => {
              evt.stopPropagation();
              onStartDrag(block.id, "bottom", evt.clientY);
            }}
          />
        </>
      )}

      <div style={{ display: "flex" }}>
        <TaskUnitEditOrDisplay
          description={block.description}
          searchText={searchContext.searchText}
          isLiveSearch={isLiveSearch}
          isEdit={isEdit}
          setIsEdit={setIsEdit}
          editText={editText}
          setEditText={setEditText}
          acceptEditText={acceptEditText}
        />
        <TaskUnitDetailsPopover
          onChange={onChange}
          block={block}
          isDetailsOpen={isDetailsOpen}
          setIsDetailsOpen={setIsDetailsOpen}
        />
      </div>
    </div>
  );
}
