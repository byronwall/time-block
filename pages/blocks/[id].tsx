import {
  Button,
  EditableText,
  H2,
  HotkeyConfig,
  useHotkeys,
} from "@blueprintjs/core";
import { scaleOrdinal, timeFormat, utcFormat, utcParse } from "d3";
import { isEqual } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSetState } from "react-use";
import { SearchContext } from "../../components/SearchContext";

import { SettingsPopover } from "../../components/SettingsPopover";
import {
  ColorSansHandler,
  TaskColorContext,
} from "../../components/TaskColorContext";
import { TimeBlockDay } from "../../components/TimeBlockDay";
import { TaskList, TimeBlockEntry } from "../../model/model";
import { findOneTaskList } from "../../util/db";
import { quickPost } from "../../util/quickPost";
import { SearchOverlay } from "../../components/SearchOverlay";

interface TimeBlockViewProps {
  activeTaskList: TaskList;
}

export default function TimeBlockView(props: TimeBlockViewProps) {
  // store the active list in state too
  const [activeTaskList, setActiveTaskList] = useSetState(props.activeTaskList);

  const isDirty = !isEqual(activeTaskList, props.activeTaskList);

  // store the color provider state here
  const [colorContext, setColorContext] = useState<ColorSansHandler>({
    getColorFromPriority: (priority: number) => {
      const scale = scaleOrdinal<number, string>()
        .domain([1, 2, 3, 4, 5])
        .range(["#D61E29", "#FDBB30", "#FEE08B", "#D9EF8B", "#A6D96A"]);
      return scale(priority);
    },
    isColoredByPriority: true,
  });

  const onChange = useCallback(
    (data: Partial<TaskColorContext>) =>
      setColorContext({ ...colorContext, ...data }),
    [colorContext]
  );

  const handleSaveTaskList = async () => {
    await quickPost("/api/insertTaskList", activeTaskList);
  };

  const handleNewTaskList = (entries: TimeBlockEntry[]) => {
    setActiveTaskList({ timeBlockEntries: entries });
  };

  const handleTaskListNameChange = (name: string) => {
    setActiveTaskList({ name });
  };

  // store a string for start time in state
  const parser = utcParse("%H:%M");

  const dateToStr = utcFormat("%H:%M");
  const dateToStrLocal = timeFormat("%H:%M");

  const startTime = parser(activeTaskList.viewStart);
  const endTime = parser(activeTaskList.viewEnd);

  const nowInRightUnits = parser(dateToStrLocal(new Date()));

  // store shouldScheduleAfterCurrent in state
  const [shouldScheduleAfterCurrent, setShouldScheduleAfterCurrent] =
    useState(true);

  const [searchContext, setSearchContext] = useSetState<
    Omit<SearchContext, "onChange">
  >({
    isSearchOpen: false,
    searchText: "",
  });

  const hotkeys = useMemo<HotkeyConfig[]>(
    () => [
      {
        combo: "shift+r",
        label: "rebalance",
        global: true,
        group: "time block view",

        onKeyDown: () => {
          const schedStartTime = shouldScheduleAfterCurrent
            ? +nowInRightUnits
            : +startTime;

          const newEntries = getTImeBlocksWithoutOverlap(
            activeTaskList.timeBlockEntries,
            schedStartTime
          );

          setActiveTaskList({ timeBlockEntries: newEntries });
        },
      },
      {
        combo: "shift+c",
        label: "color by priority",
        global: true,
        group: "time block view",

        onKeyDown: () => {
          onChange({ isColoredByPriority: !colorContext.isColoredByPriority });
        },
      },
      {
        combo: "shift+s",
        label: "show search",
        global: true,
        group: "global",

        onKeyDown: (ev) => {
          setSearchContext({ isSearchOpen: true });

          // stop the S from going into the search box
          ev.preventDefault();
        },
      },
    ],
    [
      activeTaskList.timeBlockEntries,
      startTime,
      setActiveTaskList,
      colorContext.isColoredByPriority,
      onChange,
      nowInRightUnits,
      shouldScheduleAfterCurrent,
      setSearchContext,
    ]
  );

  useHotkeys(hotkeys);

  return (
    <>
      <H2>
        <EditableText
          onChange={handleTaskListNameChange}
          value={activeTaskList.name}
        />
      </H2>

      {isDirty && <Button text="save all" onClick={handleSaveTaskList} />}

      <SettingsPopover
        setActiveTaskList={setActiveTaskList}
        isColoredByPriority={colorContext.isColoredByPriority}
        onChange={onChange}
        dateToStr={dateToStr}
        startTime={startTime}
        endTime={endTime}
        shouldScheduleAfterCurrent={shouldScheduleAfterCurrent}
        setShouldScheduleAfterCurrent={setShouldScheduleAfterCurrent}
      />

      <SearchContext.Provider
        value={{ ...searchContext, onChange: setSearchContext }}
      >
        <TaskColorContext.Provider value={{ ...colorContext, onChange }}>
          <>
            <TimeBlockDay
              start={dateToStr(startTime)}
              end={dateToStr(endTime)}
              majorUnit={1}
              defaultEntries={activeTaskList.timeBlockEntries}
              onEntryChange={handleNewTaskList}
            />
            <SearchOverlay />
          </>
        </TaskColorContext.Provider>
      </SearchContext.Provider>
    </>
  );
}

export async function getServerSideProps(context): Promise<{
  props: Partial<TimeBlockViewProps>;
}> {
  const id = context.params.id;

  let activeTaskList = await findOneTaskList(id);

  return {
    props: {
      activeTaskList,
    },
  };
}

// function that modifies an array of time blocks to occur end to end without overlap
function getTImeBlocksWithoutOverlap(
  timeBlocks: TimeBlockEntry[],
  forcedStart: number
) {
  const newTimeBlocks = [...timeBlocks];

  const goodBlocks = newTimeBlocks
    .filter((c) => c.start !== undefined)

    .sort((a, b) => a.start - b.start);

  const frozenBlocks = newTimeBlocks.filter(
    (c) => c.isFrozen && c.start !== undefined
  );

  goodBlocks.forEach((block, idx) => {
    // skip movement on frozen blocks and complete
    if (block.isFrozen || block.isComplete) {
      return;
    }

    if (idx === 0) {
      if (forcedStart !== undefined) {
        block.start = forcedStart;
      }
      return;
    }
    let prevBlock = goodBlocks[idx - 1];

    const possibleStart = Math.max(
      forcedStart,
      prevBlock.start + prevBlock.duration * 1000
    );

    const possibleEnd = possibleStart + block.duration * 1000;

    // check if start or end time is in a frozen block
    const frozenConflicts = frozenBlocks.filter((c) => {
      const isBefore = possibleEnd <= c.start;
      const isAfter = possibleStart >= c.start + c.duration * 1000;

      return !(isBefore || isAfter);
    });

    const actualStart =
      frozenConflicts.length > 0
        ? frozenConflicts[0].start + frozenConflicts[0].duration * 1000
        : possibleStart;

    block.start = actualStart;
  });

  return newTimeBlocks;
}
