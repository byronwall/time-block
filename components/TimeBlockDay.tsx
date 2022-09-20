import { useHotkeys } from "@blueprintjs/core";
import {
  scaleTime,
  timeFormat,
  timeHour,
  timeMinute,
  utcFormat,
  utcParse,
} from "d3";
import React, { useMemo, useRef, useState } from "react";
import { TimeBlockEntry } from "../model/model";

import { useTaskStore } from "../model/TaskStore";
import { TimeBlockSidebarTicks } from "./TimeBlockSidebarTicks";
import { TimeBlockUnit } from "./TimeBlockUnit";

interface TimeBlockDayProps {
  day: number;
}

export type DragLoc = "top" | "bottom" | "all";

export function TimeBlockDay(props: TimeBlockDayProps) {
  // store array of time blocks in state

  // des props
  const { day } = props;

  const timeBlocks = useTaskStore(
    (state) => state.taskList.timeBlockEntries
  ).filter((c) => c.day === day);
  const setTimeBlock = useTaskStore((state) => state.updateTimeBlockEntry);
  const dateStart = useTaskStore((state) => state.dateStart)();
  const dateEnd = useTaskStore((state) => state.dateEnd)();

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

  // use a ref to track div

  const blockDivRef = useRef(null);

  const maxHeight = 600;

  const parser = utcParse("%H:%M");

  const hourScale = scaleTime()
    .domain([dateStart, dateEnd])
    .range([0, maxHeight]);

  const hours = hourScale.ticks(timeHour);

  const formatter = utcFormat("%H:%M");
  const localFormatter = timeFormat("%H:%M");

  // const tracked number of items in each slot
  const sortedBlocks = [...scheduledTasks];
  sortedBlocks.sort((a, b) => a.start - b.start);

  // TODO: move this column code to a better place
  const colHash = {};
  sortedBlocks.reduce<TimeBlockEntry[][]>((hash, block) => {
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

    const ogBlock = timeBlocks.find((block) => block.id === dragId);
    if (ogBlock === undefined) return;

    const newBLock = { ...ogBlock };

    let bounds = parent.getBoundingClientRect();

    const dynamicDragStartTime = hourScale.invert(dragStart);

    let y = evt.clientY - bounds.top;

    const deltaTimeMs =
      hourScale.invert(evt.clientY).getTime() - dynamicDragStartTime.getTime();

    const newTime = timeMinute.every(30).round(hourScale.invert(y));

    if (dragLocation === "top") {
      // change the start and reduce duration
      newBLock.start = newTime.getTime();
      newBLock.duration =
        newBLock.duration - (newTime.getTime() - ogBlock.start) / 1000;
    }
    if (dragLocation === "bottom") {
      // get duration in seconds
      const duration = (newTime.getTime() - ogBlock.start) / 1000;
      newBLock.duration = duration;
    }

    if (dragLocation === "all") {
      // just move the start - same duration
      const newTimeWithOffset = new Date(dragStartTime + deltaTimeMs);

      newBLock.start = timeMinute.every(30).round(newTimeWithOffset).getTime();
    }
    setTimeBlock(newBLock);
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

  // this is messy - the start/end are UTC but we want to display local time
  const nowFormatted = localFormatter(new Date());
  const nowParsed = parser(nowFormatted);
  const curTimeTop = hourScale(nowParsed);

  const onRebalance = useTaskStore((state) => state.onRebalanceTasks);

  const hotkeys = useMemo(() => {
    return [
      {
        combo: "shift+r",
        label: "rebalance",
        global: true,
        group: "time block view",
        onKeyDown: () => onRebalance(),
      },
    ];
  }, [onRebalance]);

  useHotkeys(hotkeys);

  return (
    <div style={{ marginBottom: 100, display: "flex", marginTop: 20 }}>
      <div
        className="time-block-day"
        ref={blockDivRef}
        style={{
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
            key={block.id}
            hourScale={hourScale}
            block={block}
            column={colHash[block.id]}
            onStartDrag={handleStartDrag}
            shouldColorDefault
          />
        ))}
      </div>
    </div>
  );
}
