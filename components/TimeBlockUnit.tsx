import { DragLoc, TimeBlockEntry } from "./TimeBlockDay";

interface TimeBlockUnitProps {
  onStartDrag: (id: string, location: DragLoc) => void;
  onEndDrag: (id: string) => void;
  hourScale: any;
  block: TimeBlockEntry;
}

export function TimeBlockUnit(props: TimeBlockUnitProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: props.hourScale(props.block.start),
        height:
          props.hourScale(props.block.end) - props.hourScale(props.block.start),
        width: 200,
        border: "1px solid black",
        background: "red",
        opacity: 0.2,
      }}
    >
      <div
        className="top-drag"
        onMouseDown={() => props.onStartDrag(props.block.id, "top")}
        onMouseUp={() => props.onEndDrag(props.block.id)}
      />
      <div
        className="bottom-drag"
        onMouseDown={() => props.onStartDrag(props.block.id, "bottom")}
        onMouseUp={() => props.onEndDrag(props.block.id)}
      />
      {props.block.description}
    </div>
  );
}
