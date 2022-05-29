import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { scaleTime, timeFormat, timeHour, timeMinute, timeParse } from "d3";
import React, { useRef, useState } from "react";

import { createUuid } from "../util/helpers";
import { TimeBlockUnit } from "./TimeBlockUnit";

interface TimeBlockDayProps {
  start: string;
  end: string;
  majorUnit: number;

  defaultEntries?: TimeBlockEntry[];

  onEntryChange(entries: TimeBlockEntry[]): void;
}

export interface TimeBlockEntry {
  start?: number;
  duration: number;
  description: string;
  id: string;
}

export type DragLoc = "top" | "bottom" | "all";

export const TimeBlockDay = (props: TimeBlockDayProps) => {
  // store array of time blocks in state

  const timeBlocks = props.defaultEntries ?? [];
  const setTimeBlocks = props.onEntryChange;

  // store new task text in state
  const [newTaskText, setNewTaskText] = useState("");

  // track the id which is dragging in state
  const [dragId, setDragId] = useState("");

  // store the drag y start in state
  const [dragStart, setDragStart] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  // track the drag location - top/bottom
  const [dragLocation, setDragLocation] = useState<DragLoc>("bottom");

  const scheduledTasks = timeBlocks.filter(
    (block) => block.start !== undefined
  );
  const unscheduledTasks = timeBlocks.filter(
    (block) => block.start === undefined
  );

  // use a ref to track div

  const blockDivRef = useRef(null);

  const maxHeight = 600;

  const parser = timeParse("%H:%M");

  const start = parser(props.start);
  const end = parser(props.end);

  const hourScale = scaleTime().domain([start, end]).range([0, maxHeight]);

  const hours = hourScale.ticks(timeHour);

  const formatter = timeFormat("%H:%M");

  // const tracked number of items in each slot
  const sortedBlocks = [...scheduledTasks];
  sortedBlocks.sort((a, b) => a.start - b.start);

  const colHash = {};

  const offsets = sortedBlocks.reduce<TimeBlockEntry[][]>((hash, block) => {
    if (hash.length === 0) {
      colHash[block.id] = 0;
      hash.push([block]);
      return hash;
    }

    // check if current block can be added after last item in each col array

    let didAdd = false;
    hash.forEach((col, i) => {
      if (didAdd) return;
      const lastBlock = col[col.length - 1];
      if (lastBlock.start + lastBlock.duration * 1000 <= block.start) {
        col.push(block);
        colHash[block.id] = i;
        didAdd = true;
        return;
      }
    });

    if (!didAdd) {
      hash.push([block]);
      colHash[block.id] = hash.length - 1;
    }

    return hash;
  }, []);

  function getFirstStartTime() {
    const maxEndTime = scheduledTasks.reduce((max, block) => {
      return Math.max(max, block.start + block.duration * 1000);
    }, start.getTime());

    return maxEndTime;
  }

  const handleCreateTaskClick = async () => {
    const newStartTime = getFirstStartTime();

    // add new task to state
    const task: TimeBlockEntry = {
      id: createUuid(),
      description: newTaskText,
      duration: 60 * 60,
      start: newStartTime,
    };

    setTimeBlocks([...timeBlocks, task]);
    setNewTaskText("");
  };

  const handleMouseMove = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    evt.preventDefault();

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
          newBLock.start = newTime.getTime();
          newBLock.duration =
            newBLock.duration - (newTime.getTime() - block.start) / 1000;
        }
        if (dragLocation === "bottom") {
          // get duration in seconds
          const duration = (newTime.getTime() - block.start) / 1000;
          newBLock.duration = duration;
        }

        if (dragLocation === "all") {
          // just move the start - same duration
          const newTimeWithOffset = new Date(dragStartTime + deltaTimeMs);

          newBLock.start = timeMinute
            .every(30)
            .round(newTimeWithOffset)
            .getTime();
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
      setDragStartTime(entry.start);
    }

    setDragId(id);
    setDragLocation(location);
    setDragStart(clientYStart);
  };

  const handleBlockChange = (id: string, newBLock: TimeBlockEntry) => {
    const newTimeBlocks = timeBlocks.map((block) => {
      if (block.id === id) {
        return newBLock;
      }
      return block;
    });

    setTimeBlocks(newTimeBlocks);
  };

  const handleBlockDelete = (id: string) => {
    const newTimeBlocks = timeBlocks.filter((block) => block.id !== id);
    setTimeBlocks(newTimeBlocks);
  };

  const handleBlockUnschedule = (id: string) => {
    const newTimeBlocks = [...timeBlocks];
    newTimeBlocks.forEach((block) => {
      if (block.id === id) {
        block.start = undefined;
      }
    });

    setTimeBlocks(newTimeBlocks);
  };
  const handleBlockSchedule = (id: string) => {
    const newTimeBlocks = [...timeBlocks];
    newTimeBlocks.forEach((block) => {
      if (block.id === id) {
        block.start = getFirstStartTime();
      }
    });

    setTimeBlocks(newTimeBlocks);
  };

  const TimeBlockCommon = {
    onChange: handleBlockChange,
    onDelete: handleBlockDelete,
  };

  return (
    <div>
      <div style={{ margin: 30 }}>
        <FormGroup inline>
          <InputGroup
            value={newTaskText}
            onChange={(evt) => setNewTaskText(evt.target.value)}
            onKeyDown={(evt) => {
              if (evt.key === "Enter") {
                handleCreateTaskClick();
              }
            }}
            rightElement={<Button onClick={handleCreateTaskClick} text="add" />}
          />
        </FormGroup>
      </div>

      <div>
        <h3>unscheduled</h3>
        {unscheduledTasks.map((block) => (
          <TimeBlockUnit
            {...TimeBlockCommon}
            key={block.id}
            block={block}
            onSchedule={handleBlockSchedule}
          />
        ))}
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
          {scheduledTasks.map((block) => (
            <TimeBlockUnit
              {...TimeBlockCommon}
              key={block.id}
              hourScale={hourScale}
              block={block}
              column={colHash[block.id]}
              onStartDrag={handleStartDrag}
              onUnschedule={handleBlockUnschedule}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
