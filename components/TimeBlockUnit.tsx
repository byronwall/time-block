import { Button, InputGroup, Overlay } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { TimeBlockEntry } from "../model/model";
import { getTextColor } from "./helpers";
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

  const backgroundColor =
    shouldColorDefault || !colorContext.isColoredByPriority
      ? block.isComplete
        ? "#f5f5f5"
        : "#C0DFF7"
      : colorContext.getColorFromPriority(block.priority ?? 5);

  const borderStyle = block.isFrozen ? "dashed" : "solid";

  const textColor = getTextColor(backgroundColor);

  const [isMouseInside, setIsMouseInside] = useState(false);

  // track isDetailsOpen via state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    // bind a key press handler to the document to detect key press without focus
    function handleKeyDown(e: KeyboardEvent) {
      // check if target is an input or textarea
      const isTargetInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      if (isTargetInput) {
        return;
      }

      if (isMouseInside) {
        const possibleNum = +e.key;

        if (possibleNum >= 1 && possibleNum <= 5) {
          onChange(block.id, {
            ...block,
            priority: possibleNum,
          });

          return;
        }

        if (e.key === "d") {
          setIsDetailsOpen(!isDetailsOpen);
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (e.key === "e") {
          setIsEdit(!isEdit);
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (e.key === "x") {
          onDelete(block.id);
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (e.key === "s") {
          isScheduled ? onUnschedule(block.id) : onSchedule(block.id);

          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (e.key === "c") {
          // complete the task
          onChange(block.id, { ...block, isComplete: !block.isComplete });

          e.preventDefault();
          e.stopPropagation();
          return;
        }

        if (e.key === "f") {
          // freeze the task
          onChange(block.id, { ...block, isFrozen: !block.isFrozen });

          e.preventDefault();
          e.stopPropagation();
          return;
        }

        console.log("unhandled key press", e.key);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isMouseInside,
    onChange,
    block,
    isDetailsOpen,
    isEdit,
    onDelete,
    onSchedule,
    onUnschedule,
    isScheduled,
  ]);

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
            <div>{block.description}</div>
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
