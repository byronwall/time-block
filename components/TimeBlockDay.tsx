import {
  max,
  scaleBand,
  scaleTime,
  timeFormat,
  timeHour,
  timeMinute,
  timeParse,
} from "d3";
import React, { useDebugValue, useRef, useState } from "react";
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
  duration: number;
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

  // store the drag y start in state
  const [dragStart, setDragStart] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  // track the drag location - top/bottom
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
    const maxEndTime = timeBlocks.reduce((max, block) => {
      return Math.max(max, block.start.getTime() + block.duration * 1000);
    }, start.getTime());

    const newStartTime = new Date(maxEndTime);

    console.log("maxEndTime", newStartTime, start);

    // add new task to state
    const task: TimeBlockEntry = {
      id: createUuid(),
      description: newTaskText,
      duration: 60 * 60,
      start: newStartTime,
    };

    setTimeBlocks([...timeBlocks, task]);
  };

  const handleMouseMove = (evt: React.MouseEvent) => {
    if (!dragId) return;

    // update the dragging item

    // get new time from inverted position

    const parent = blockDivRef.current;
    if (!parent) return;

    // update based on location
    // update start time
    const newTimeBlocks = timeBlocks.map((block) => {
      const newBLock = { ...block };
      if (newBLock.id === dragId) {
        let bounds = parent.getBoundingClientRect();
        let x = evt.clientX - bounds.left;

        const dynamicDragStartTime = hourScale.invert(dragStart);

        let y = evt.clientY - bounds.top;

        const deltaTimeMs =
          hourScale.invert(evt.clientY).getTime() -
          dynamicDragStartTime.getTime();

        const newTime = timeMinute.every(30).round(hourScale.invert(y));

        if (dragLocation === "top") {
          // change the start and reduce duration
          newBLock.start = newTime;
          newBLock.duration =
            newBLock.duration -
            (newTime.getTime() - block.start.getTime()) / 1000;
        }
        if (dragLocation === "bottom") {
          // get duration in seconds
          const duration = (newTime.getTime() - block.start.getTime()) / 1000;
          newBLock.duration = duration;
        }

        if (dragLocation === "all") {
          // just move the start - same duration
          const newTimeWithOffset = new Date(dragStartTime + deltaTimeMs);

          newBLock.start = timeMinute.every(30).round(newTimeWithOffset);
        }
      }

      return newBLock;
    });

    setTimeBlocks(newTimeBlocks);
  };
  // map out the width and position of each item based on overlaps

  const handleStartDrag = (
    id: string,
    location: DragLoc,
    clientYStart: number
  ) => {
    const entry = timeBlocks.find((t) => t.id === id);
    if (!entry) return;

    if (entry.start) {
      setDragStartTime(entry.start.getTime());
    }

    setDragId(id);
    setDragLocation(location);
    setDragStart(clientYStart);
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
          {timeBlocks
            .filter((c) => c.start)
            .map((block) => (
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
