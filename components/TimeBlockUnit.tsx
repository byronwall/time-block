import {
  Button,
  Hotkey,
  HotkeyConfig,
  InputGroup,
  Overlay,
  useHotkeys,
} from "@blueprintjs/core";

import Highlighter from "react-highlight-words";
import { Popover2 } from "@blueprintjs/popover2";
import {
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TimeBlockEntry } from "../model/model";
import { getTextColor } from "./helpers";
import { SearchContext } from "./SearchContext";
import { TaskColorContext } from "./TaskColorContext";
import { DragLoc } from "./TimeBlockDay";
import { TimeBlockDetails } from "./TimeBlockDetails";

interface TimeBlockUnitProps {
  onStartDrag?: (id: string, location: DragLoc, clientY: number) => void;

  onDelete(id: string): void;
  onUnschedule?(id: string): void;
  onSchedule?(id: string): void;
  onChange(id: string, newEntry: TimeBlockEntry): void;

  hourScale?: d3.ScaleTime<number, number>;
  block: TimeBlockEntry;

  column?: number;

  shouldColorDefault?: boolean;
}

export function TimeBlockUnit(props: TimeBlockUnitProps) {
  const {
    onStartDrag,
    onDelete,
    onUnschedule,
    onSchedule,
    onChange,
    block,
    hourScale,
    column,
    shouldColorDefault,
  } = props;

  const searchContext = useContext(SearchContext);
  const isLiveSearch = searchContext.isSearchOpen && searchContext.searchText;
  const isSearchMatch = block.description.includes(searchContext.searchText);

  const zeroPx = hourScale?.(0) ?? 0;
  const durationPx = hourScale?.(new Date(block.duration * 1000)) ?? 80;

  const height = Math.max(durationPx - zeroPx, 0);

  // track isEdit via state
  const [isEdit, setIsEdit] = useState(false);

  // track edit text in state
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

  // track isDetailsOpen via state
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
        onKeyDown: () => onDelete(block.id),
      },
      {
        combo: "s",
        label: "schedule",
        global: true,
        group: "hover on block",
        disabled: !isMouseInside,
        onKeyDown: () =>
          isScheduled ? onUnschedule(block.id) : onSchedule(block.id),
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
      block.id,
      onDelete,
      onSchedule,
      onUnschedule,
      isScheduled,
      onChangePartial,
      block.isComplete,
      block.isFrozen,
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
        <div>
          {isEdit ? (
            <div>
              <InputGroup
                value={editText}
                onChange={(evt) => setEditText(evt.target.value)}
                onKeyDown={(evt) => {
                  if (evt.key === "Enter") {
                    acceptEditText();
                  }
                  if (evt.key === "Escape") {
                    setIsEdit(false);
                  }
                }}
                autoFocus
                rightElement={
                  <Button minimal icon="tick" onClick={acceptEditText} />
                }
              />
            </div>
          ) : (
            <Highlighter
              highlightClassName="highlight"
              searchWords={isLiveSearch ? [searchContext.searchText] : []}
              autoEscape={true}
              textToHighlight={block.description}
            />
          )}
        </div>
        <div>
          <Popover2
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            content={<TimeBlockDetails block={block} onChange={onChange} />}
            position="right"
          >
            <Button
              icon="chevron-down"
              minimal
              onClick={() => setIsDetailsOpen(true)}
            />
          </Popover2>
        </div>
      </div>
    </div>
  );
}
