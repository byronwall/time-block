import {
  Button,
  EditableText,
  H2,
  HotkeyConfig,
  useHotkeys,
} from "@blueprintjs/core";
import { scaleTime, timeHour, utcFormat } from "d3";
import { isEqual } from "lodash-es";
import { useEffect, useMemo } from "react";

import { AddNewTask } from "../../components/AddNewTask";
import { SearchOverlay } from "../../components/SearchOverlay";
import { SettingsPopover } from "../../components/SettingsPopover";
import { TimeBlockDay } from "../../components/TimeBlockDay";
import { TimeBlockSidebarTicks } from "../../components/TimeBlockSidebarTicks";
import { TimeBlockUnit } from "../../components/TimeBlockUnit";
import { TaskList } from "../../model/model";
import { useTaskStore } from "../../model/TaskStore";
import { findOneTaskList } from "../../util/db";

interface TimeBlockViewProps {
  initialTaskList: TaskList;
}

export default function TimeBlockView(props: TimeBlockViewProps) {
  const { initialTaskList } = props;

  const setActiveTaskList = useTaskStore((state) => state.setTaskList);

  // this is used to update the store based on the server loaded props
  useEffect(() => {
    setActiveTaskList(initialTaskList);
  }, []);

  const isDirty = useTaskStore(
    (state) => !isEqual(state.taskList, initialTaskList)
  );

  const handleSaveTaskList = useTaskStore((state) => state.onSaveActiveTasks);

  const updateTaskList = useTaskStore((c) => c.updateTaskListPartial);
  const handleTaskListNameChange = (name: string) => {
    updateTaskList({ name });
  };

  // store a string for start time in state

  const onSearchOpen = useTaskStore((state) => state.setIsSearchOpen);

  const toggleColor = useTaskStore((state) => state.toggleIsColoredByPriority);

  const hotkeys = useMemo<HotkeyConfig[]>(() => {
    return [
      {
        combo: "shift+c",
        label: "color by priority",
        global: true,
        group: "time block view",

        onKeyDown: () => toggleColor(),
      },
      {
        combo: "shift+s",
        label: "show search",
        global: true,
        group: "global",

        onKeyDown: (ev) => {
          onSearchOpen(true);

          // stop the S from going into the search box
          ev.preventDefault();
        },
      },
    ];
  }, [onSearchOpen, toggleColor]);

  useHotkeys(hotkeys);

  const toggleDetailShortcut = useTaskStore(
    (state) => state.toggleDetailShortcut
  );

  const onChangePartial = useTaskStore(
    (state) => state.updateHoverTimeBlockEntryPartial
  );

  const onDeleteHover = useTaskStore((state) => state.onDeleteHoverTask);

  const onScheduleHover = useTaskStore((state) => state.onScheduleHoverTask);

  // TODO: generate these hot key defs in the store
  const timeUnitHotKeys = useMemo<HotkeyConfig[]>(
    () => [
      {
        combo: "d",
        label: "details",
        global: true,
        group: "hover on block",

        onKeyDown: () => toggleDetailShortcut(),
      },

      {
        combo: "x",
        label: "delete",
        global: true,
        group: "hover on block",

        onKeyDown: () => onDeleteHover(),
      },
      {
        combo: "s",
        label: "schedule",
        global: true,
        group: "hover on block",

        onKeyDown: () => onScheduleHover(),
      },
      {
        combo: "1",
        label: "set priority 1",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial({ priority: 1 }),
      },
      {
        combo: "2",
        label: "set priority 2",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial({ priority: 2 }),
      },
      {
        combo: "3",
        label: "set priority 3",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial({ priority: 3 }),
      },

      {
        combo: "4",
        label: "set priority 4",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial({ priority: 4 }),
      },
      {
        combo: "5",
        label: "set priority 5",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial({ priority: 5 }),
      },
      {
        combo: "c",
        label: "complete",
        global: true,
        group: "hover on block",

        onKeyDown: () =>
          onChangePartial((c) => ({ isComplete: !c.isComplete })),
      },
      {
        combo: "f",
        label: "freeze",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial((c) => ({ isFrozen: !c.isFrozen })),
      },
      {
        combo: "r",
        label: "increment day",
        global: true,
        group: "hover on block",

        onKeyDown: () => onChangePartial((c) => ({ day: c.day + 1 })),
      },

      {
        combo: "e",
        label: "decrement day",
        global: true,
        group: "hover on block",

        onKeyDown: () =>
          onChangePartial((c) => ({ day: Math.max(0, c.day - 1) })),
      },
    ],
    [onChangePartial, toggleDetailShortcut, onDeleteHover, onScheduleHover]
  );

  useHotkeys(timeUnitHotKeys);

  const taskListName = useTaskStore((state) => state.taskList.name);

  // TODO: this pulls in too many changes - tighten scope?
  const unscheduled = useTaskStore((state) => state.taskList.timeBlockEntries)
    .filter((c) => c.start === undefined)
    .sort((a, b) => a.priority - b.priority);

  const numberOfDays = useTaskStore((state) => state.numberOfDays)();

  const daysToRender = Array.from(Array(numberOfDays + 1).keys());

  const dateStart = useTaskStore((state) => state.dateStart)();
  const dateEnd = useTaskStore((state) => state.dateEnd)();
  const hourScale = scaleTime().domain([dateStart, dateEnd]).range([0, 600]);

  const hours = hourScale.ticks(timeHour);

  const formatter = utcFormat("%H:%M");

  return (
    <>
      <H2>
        <EditableText
          onChange={handleTaskListNameChange}
          value={taskListName}
        />
      </H2>

      {isDirty && <Button text="save all" onClick={handleSaveTaskList} />}

      <SettingsPopover />

      <>
        <AddNewTask />
        <div>
          <h3>unscheduled</h3>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {unscheduled.map((block, idx) => (
              <TimeBlockUnit key={idx} block={block} />
            ))}
          </div>
        </div>

        <div className="time-view-parent">
          <div className="time-view" style={{ display: "flex" }}>
            <TimeBlockSidebarTicks
              hourScale={hourScale}
              hours={hours}
              formatter={formatter}
            />
            <div className="time-day-holder">
              {daysToRender.map((day) => (
                <TimeBlockDay key={day} day={day} />
              ))}
            </div>
          </div>
        </div>
        <SearchOverlay />
      </>
    </>
  );
}

export async function getServerSideProps(context): Promise<{
  props: Partial<TimeBlockViewProps>;
}> {
  const id = context.params.id;

  let initialTaskList = await findOneTaskList(id);

  return {
    props: {
      initialTaskList,
    },
  };
}
