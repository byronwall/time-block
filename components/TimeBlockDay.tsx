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

import { useWhatChanged } from "@simbathesailor/use-what-changed";

import { TimeBlockEntry } from "../model/model";
import { useTaskStore } from "../model/TaskStore";
import { getTImeBlocksWithoutOverlap } from "./helpers";
import { TimeBlockSidebarTicks } from "./TimeBlockSidebarTicks";
import { TimeBlockUnit } from "./TimeBlockUnit";

interface TimeBlockDayProps {
  dateStart: Date;
  dateEnd: Date;

  shouldScheduleAfterCurrent: boolean;
  nowInRightUnits: Date;

  shouldShowLeftSidebar: boolean;
}

export type DragLoc = "top" | "bottom" | "all";

export function TimeBlockDay(props: TimeBlockDayProps) {
  // store array of time blocks in state

  // des props
  const {
    dateStart,
    dateEnd,
    nowInRightUnits,
    shouldScheduleAfterCurrent,
    shouldShowLeftSidebar,
  } = props;

  const timeBlocks = useTaskStore((state) => state.taskList.timeBlockEntries);
  const setTimeBlock = useTaskStore((state) => state.updateTimeBlockEntry);

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

  const colHash = {};

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

  const bulkUpdate = useTaskStore(
    (state) => state.updateTimeBlockEntryPartialBulk
  );

  const hotkeys = useMemo(
    () => [
      {
        combo: "shift+r",
        label: "rebalance",
        global: true,
        group: "time block view",

        onKeyDown: () => {
          const schedStartTime = shouldScheduleAfterCurrent
            ? +nowInRightUnits
            : +dateStart;

          const newEntries = getTImeBlocksWithoutOverlap(
            timeBlocks,
            schedStartTime
          );

          bulkUpdate(newEntries);
        },
      },
    ],
    [
      timeBlocks,
      shouldScheduleAfterCurrent,
      nowInRightUnits,
      dateStart,
      bulkUpdate,
    ]
  );

  useHotkeys(hotkeys);

  return (
    <div style={{ marginBottom: 100 }}>
      <div style={{ display: "flex", marginTop: 20 }}>
        {shouldShowLeftSidebar && (
          <TimeBlockSidebarTicks
            hourScale={hourScale}
            hours={hours}
            formatter={formatter}
          />
        )}
        <div
          ref={blockDivRef}
          style={{
            width: 250,
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
    </div>
  );
}
