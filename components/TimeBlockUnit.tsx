import { Button, InputGroup, Overlay } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { TaskColorContext } from "./ColorSansHandler";
import { DragLoc, TimeBlockEntry } from "./TimeBlockDay";
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
  } = props;

  const zeroPx = hourScale?.(0) ?? 0;
  const durationPx = hourScale?.(new Date(block.duration * 1000)) ?? 50;

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

  const backgroundColor = colorContext.isColoredByPriority
    ? colorContext.getColorFromPriority(block.priority ?? 5)
    : "#C0DFF7";

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
          return;
        }

        console.log("unhandled key press", e.key);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMouseInside, onChange, block, isDetailsOpen]);

  return (
    <div
      style={{
        ...style,
        height: height,
        width: 200,
        border: "1px solid black",
        backgroundColor,
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

      <div className="header-buttons">
        <Button icon="edit" minimal onClick={() => setIsEdit(true)} />
        <Button icon="delete" minimal onClick={() => onDelete(block.id)} />
        <Button
          text={isScheduled ? "u" : "s"}
          onClick={() =>
            isScheduled ? onUnschedule(block.id) : onSchedule(block.id)
          }
        />

        <Popover2
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          content={<TimeBlockDetails block={block} onChange={onChange} />}
        >
          <Button
            icon="chevron-down"
            minimal
            onClick={() => setIsDetailsOpen(true)}
          />
        </Popover2>
      </div>
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
  );
}
