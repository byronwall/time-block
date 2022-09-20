import { CSSProperties, useState } from "react";

import { TimeBlockEntry } from "../model/model";
import { useTaskStore } from "../model/TaskStore";
import { getTextColor } from "./helpers";
import { TaskUnitDetailsPopover } from "./TaskUnitDetailsPopover";
import { TaskUnitEditOrDisplay } from "./TaskUnitEditOrDisplay";
import { DragLoc } from "./TimeBlockDay";

export interface TimeBlockUnitProps {
  onStartDrag?: (id: string, location: DragLoc, clientY: number) => void;

  hourScale?: d3.ScaleTime<number, number>;

  block: TimeBlockEntry;

  column?: number;

  shouldColorDefault?: boolean;
}

export function TimeBlockUnit(props: TimeBlockUnitProps) {
  const { onStartDrag, block, hourScale, column, shouldColorDefault } = props;

  const isLiveSearch = useTaskStore(
    (searchContext) => searchContext.isSearchOpen && searchContext.searchText
  );

  const isSearchMatch = useTaskStore((state) =>
    block.description.includes(state.searchText)
  );

  const zeroPx = hourScale?.(0) ?? 0;

  const height =
    hourScale === undefined
      ? undefined
      : Math.max(hourScale(new Date(block.duration * 1000)) - zeroPx, 0);

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
        maxHeight: height,
        minHeight: height,
      }
    : { position: "relative" };

  const isScheduled = block.start !== undefined;

  const isColoredByPriority = useTaskStore(
    (store) => store.isColoredByPriority
  );
  const getColorFromPriority = useTaskStore(
    (store) => store.getColorFromPriority
  );

  let backgroundColor =
    shouldColorDefault || !isColoredByPriority
      ? block.isComplete
        ? "#f5f5f5"
        : "#C0DFF7"
      : getColorFromPriority(block.priority ?? 5);

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

  // this is tightly scope to avoid re-renders
  const isDetailsOpen = useTaskStore(
    (state) => state.detailOptions.isOpen && state.detailOptions.id === block.id
  );
  const setMouseOverId = useTaskStore((state) => state.setMouseOverId);

  const onChangePartial = useTaskStore(
    (store) => store.updateTimeBlockEntryPartial
  );

  return (
    <div
      className="time-block-unit"
      style={{
        ...style,
        height: height,
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
