import {
  CSSProperties,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { TimeBlockEntry } from "../model/model";
import { useTaskStore } from "../model/TaskStore";
import { getTextColor } from "./helpers";
import { SearchContext } from "./SearchContext";
import { TaskColorContext } from "./TaskColorContext";
import { TaskUnitDetailsPopover } from "./TaskUnitDetailsPopover";
import { TaskUnitEditOrDisplay } from "./TaskUnitEditOrDisplay";
import { DragLoc } from "./TimeBlockDay";

export interface TimeBlockUnitProps {
  onStartDrag?: (id: string, location: DragLoc, clientY: number) => void;

  // onDelete?(): void;

  hourScale?: d3.ScaleTime<number, number>;
  // blockAtom: PrimitiveAtom<TimeBlockEntry>;
  block: TimeBlockEntry;

  column?: number;

  shouldColorDefault?: boolean;
}

export function TimeBlockUnit(props: TimeBlockUnitProps) {
  const { onStartDrag, block, hourScale, column, shouldColorDefault } = props;

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
    onChangePartial(block.id, {
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

  const detailOptions = useTaskStore((state) => state.detailOptions);
  const setMouseOverId = useTaskStore((state) => state.setMouseOverId);

  const isDetailsOpen = detailOptions.isOpen && detailOptions.id === block.id;

  const onChangePartial = useTaskStore(
    (store) => store.updateTimeBlockEntryPartial
  );

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
      onMouseOver={() => setMouseOverId(block.id)}
      onMouseOut={() => setMouseOverId(undefined)}
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
        <TaskUnitDetailsPopover block={block} isDetailsOpen={isDetailsOpen} />
      </div>
    </div>
  );
}
