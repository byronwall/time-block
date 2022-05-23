import {
  scaleBand,
  scaleTime,
  timeFormat,
  timeHour,
  timeMinute,
  timeParse,
} from "d3";
import React, { useRef, useState } from "react";
import { createUuid } from "../util/helpers";
import { TimeBlockUnit } from "./TimeBlockUnit";
// render from a start time

// render a block of items

// add a grid

// allow dragging items on that grid

// allow dragging the bottom/top edges

interface TimeBlockDayProps {
  start: string;
  end: string;
  majorUnit: number;
}

export interface TimeBlockEntry {
  start: Date;
  end: Date;
  description: string;
  id: string;
}

export type DragLoc = "top" | "bottom" | "all";

export const TimeBlockDay = (props: TimeBlockDayProps) => {
  // store array of time blocks in state
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockEntry[]>([]);

  // store new task text in state
  const [newTaskText, setNewTaskText] = useState("");

  // track the id which is dragging in state
  const [dragId, setDragId] = useState("");

  // track the drag location - top/bototm
  const [dragLocation, setDragLocation] = useState<DragLoc>("bottom");

  // use a ref to track div

  const blockDivRef = useRef(null);

  const maxHeight = 600;

  const parser = timeParse("%H:%M");

  const start = parser(props.start);
  const end = parser(props.end);

  const hourScale = scaleTime().domain([start, end]).range([0, maxHeight]);

  const hours = hourScale.ticks(timeHour);

  const formatter = timeFormat("%H:%M");

  const handleCreateTaskClick = async () => {
    // add new task to state
    const task: TimeBlockEntry = {
      id: createUuid(),
      description: newTaskText,
      end: end,
      start: start,
    };

    setTimeBlocks([...timeBlocks, task]);
  };

  const handleMouseMove = (evt: React.MouseEvent) => {
    if (!dragId) return;

    // update the dragging item

    // get new time from inverted position

    const parent = blockDivRef.current;
    if (!parent) return;

    let bounds = parent.getBoundingClientRect();
    let x = evt.clientX - bounds.left;
    let y = evt.clientY - bounds.top;

    const newTime = timeMinute.every(30).round(hourScale.invert(y));

    // update based on location
    // update start time
    const newTimeBlocks = timeBlocks.map((block) => {
      const newBLock = { ...block };
      if (newBLock.id === dragId) {
        if (dragLocation === "top") {
          newBLock.start = newTime;
        }
        if (dragLocation === "bottom") {
          newBLock.end = newTime;
        }
      }

      return newBLock;
    });

    setTimeBlocks(newTimeBlocks);
  };
  // map out the width and position of each item based on overlaps

  const handleStartDrag = (id: string, location: DragLoc) => {
    setDragId(id);
    setDragLocation(location);
  };

  return (
    <div>
      <div style={{ margin: 30 }}>
        <input
          type="text"
          value={newTaskText}
          onChange={(evt) => setNewTaskText(evt.target.value)}
        />
        <button onClick={handleCreateTaskClick}>add</button>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ position: "relative", width: 100 }}>
          {hours.map((hour, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: hourScale(hour),
                borderTop: "1px solid black",
              }}
            >
              {formatter(hour)}
            </div>
          ))}
        </div>
        <div
          ref={blockDivRef}
          style={{
            width: 400,
            minHeight: maxHeight,
            border: "1px solid black",
            position: "relative",
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragId("")}
        >
          {timeBlocks.map((block) => (
            <TimeBlockUnit
              key={block.id}
              hourScale={hourScale}
              block={block}
              onStartDrag={handleStartDrag}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function range(size, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt);
}
