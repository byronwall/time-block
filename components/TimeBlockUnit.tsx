import { DragLoc, TimeBlockEntry } from "./TimeBlockDay";

interface TimeBlockUnitProps {
  onStartDrag: (id: string, location: DragLoc, clientY: number) => void;

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
          props.hourScale(
            new Date(props.block.start.getTime() + props.block.duration * 1000)
          ) - props.hourScale(props.block.start),
        width: 200,
        border: "1px solid black",
        background: "red",
        opacity: 0.2,
      }}
    >
      <div
        className="body-drag"
        onMouseDown={(evt) =>
          props.onStartDrag(props.block.id, "all", evt.clientY)
        }
      />

      <div
        className="top-drag"
        onMouseDown={(evt) =>
          props.onStartDrag(props.block.id, "top", evt.clientY)
        }
      />
      <div
        className="bottom-drag"
        onMouseDown={(evt) =>
          props.onStartDrag(props.block.id, "bottom", evt.clientY)
        }
      />
      {props.block.description}
    </div>
  );
}
