import { FormGroup, InputGroup } from "@blueprintjs/core";
import {
  scaleTime,
  timeFormat,
  timeHour,
  timeMinute,
  utcFormat,
  utcParse,
} from "d3";
import React, { useRef, useState } from "react";

import { TimeBlockEntry } from "../model/model";
import { createUuid } from "../util/helpers";
import { TimeBlockSidebarTicks } from "./TimeBlockSidebarTicks";
import { TimeBlockUnit } from "./TimeBlockUnit";

interface TimeBlockDayProps {
  start: string;
  end: string;
  majorUnit: number;

  defaultEntries?: TimeBlockEntry[];

  onEntryChange(entries: TimeBlockEntry[]): void;
}

export type DragLoc = "top" | "bottom" | "all";

export function TimeBlockDay(props: TimeBlockDayProps) {
  // store array of time blocks in state

  // des props
  const { start, end, defaultEntries, onEntryChange } = props;

  const timeBlocks = defaultEntries ?? [];
  const setTimeBlocks = onEntryChange;

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
  const unscheduledTasks = timeBlocks
    .filter((block) => block.start === undefined)
    .sort((a, b) => a.priority - b.priority);

  // use a ref to track div

  const blockDivRef = useRef(null);

  const maxHeight = 600;

  const parser = utcParse("%H:%M");

  const dateStart = parser(start);
  const dateEnd = parser(end);

  const hourScale = scaleTime()
    .domain([dateStart, dateEnd])
    .range([0, maxHeight]);

  const hours = hourScale.ticks(timeHour);

  const formatter = utcFormat("%H:%M");
  const localFormatter = timeFormat("%H:%M");

  // const tracked number of items in each slot
  const sortedBlocks = [...scheduledTasks];
  sortedBlocks.sort((a, b) => a.start - b.start);

  const colHash = {};

  function getFirstStartTime() {
    const maxEndTime = scheduledTasks.reduce((max, block) => {
      return Math.max(max, block.start + block.duration * 1000);
    }, dateStart.getTime());

    return maxEndTime;
  }

  const handleCreateTaskClick = async (isScheduled = true) => {
    const newStartTime = isScheduled ? getFirstStartTime() : undefined;

    // add new task to state
    const task: TimeBlockEntry = {
      id: createUuid(),
      description: newTaskText,
      duration: 60 * 60,
      start: newStartTime,
      priority: 5,
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

  // this is messy - the start/end are UTC but we want to display local time
  const nowFormatted = localFormatter(new Date());
  const nowParsed = parser(nowFormatted);
  const curTimeTop = hourScale(nowParsed);

  return (
    <div style={{ marginBottom: 100 }}>
      <div style={{ margin: 30 }}>
        <FormGroup inline>
          <InputGroup
            value={newTaskText}
            onChange={(evt) => setNewTaskText(evt.target.value)}
            onKeyDown={(evt) => {
              if (evt.key === "Enter") {
                handleCreateTaskClick(!evt.metaKey);
              }
            }}
            style={{ width: 400 }}
          />
        </FormGroup>
      </div>

      <div>
        <h3>unscheduled</h3>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {unscheduledTasks.map((block) => (
            <TimeBlockUnit
              {...TimeBlockCommon}
              key={block.id}
              block={block}
              onSchedule={handleBlockSchedule}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", marginTop: 20 }}>
        <TimeBlockSidebarTicks
          hourScale={hourScale}
          hours={hours}
          formatter={formatter}
        />
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
          <div
            style={{
              height: 10,
              width: "100%",
              background: "#FF9A00",
              position: "absolute",
              top: curTimeTop,
            }}
          />

          {scheduledTasks.map((block) => (
            <TimeBlockUnit
              {...TimeBlockCommon}
              key={block.id}
              hourScale={hourScale}
              block={block}
              column={colHash[block.id]}
              onStartDrag={handleStartDrag}
              onUnschedule={handleBlockUnschedule}
              shouldColorDefault
            />
          ))}
        </div>
      </div>
    </div>
  );
}
