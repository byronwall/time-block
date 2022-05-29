import { Button, InputGroup } from "@blueprintjs/core";
import { CSSProperties, useState } from "react";
import { DragLoc, TimeBlockEntry } from "./TimeBlockDay";

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
  const zeroPx = props.hourScale?.(0) ?? 0;
  const durationPx =
    props.hourScale?.(new Date(props.block.duration * 1000)) ?? 50;

  const height = Math.max(durationPx - zeroPx, 0);

  // track isEdit via state
  const [isEdit, setIsEdit] = useState(false);

  // track edit text in state
  const [editText, setEditText] = useState(props.block.description);

  const acceptEditText = () => {
    setIsEdit(false);
    props.onChange(props.block.id, {
      ...props.block,
      description: editText,
    });
  };

  const style: CSSProperties = props.hourScale
    ? {
        position: "absolute",
        top: props.hourScale(props.block.start),
        left: props.column * 200,
      }
    : { position: "relative" };

  const isScheduled = props.block.start !== undefined;

  return (
    <div
      style={{
        ...style,
        height: height,
        width: 200,
        border: "1px solid black",
      }}
    >
      {isScheduled && (
        <>
          <div
            className="body-drag"
            onMouseDown={(evt) => {
              evt.stopPropagation();
              props.onStartDrag(props.block.id, "all", evt.clientY);
            }}
          />

          <div
            className="top-drag"
            onMouseDown={(evt) => {
              evt.stopPropagation();
              props.onStartDrag(props.block.id, "top", evt.clientY);
            }}
          />
          <div
            className="bottom-drag"
            onMouseDown={(evt) => {
              evt.stopPropagation();
              props.onStartDrag(props.block.id, "bottom", evt.clientY);
            }}
          />
        </>
      )}

      <div className="header-buttons">
        <Button icon="edit" minimal onClick={() => setIsEdit(true)} />
        <Button
          icon="delete"
          minimal
          onClick={() => props.onDelete(props.block.id)}
        />
        <Button
          text={isScheduled ? "u" : "s"}
          onClick={() =>
            isScheduled
              ? props.onUnschedule(props.block.id)
              : props.onSchedule(props.block.id)
          }
        />
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
        <div>{props.block.description}</div>
      )}
    </div>
  );
}
