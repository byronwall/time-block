import {
  Button,
  EditableText,
  FormGroup,
  H2,
  HotkeyConfig,
  InputGroup,
  useHotkeys,
} from "@blueprintjs/core";
import { scaleOrdinal, timeFormat, utcFormat, utcParse } from "d3";
import { isEqual } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSetState } from "react-use";

import { SearchOverlay } from "../../components/SearchOverlay";
import { SettingsPopover } from "../../components/SettingsPopover";
import {
  ColorSansHandler,
  TaskColorContext,
} from "../../components/TaskColorContext";
import { TimeBlockDay } from "../../components/TimeBlockDay";
import { TimeBlockUnit } from "../../components/TimeBlockUnit";
import { TaskList, TimeBlockEntry } from "../../model/model";
import { useTaskStore } from "../../model/TaskStore";
import { findOneTaskList } from "../../util/db";
import { createUuid } from "../../util/helpers";

interface TimeBlockViewProps {
  initialTaskList: TaskList;
}

const parser = utcParse("%H:%M");

const dateToStr = utcFormat("%H:%M");
const dateToStrLocal = timeFormat("%H:%M");

export default function TimeBlockView(props: TimeBlockViewProps) {
  const { initialTaskList } = props;

  const setActiveTaskList = useTaskStore((state) => state.setTaskList);

  // this is used to update the store based on the server loaded props
  useEffect(() => {
    setActiveTaskList(initialTaskList);
  }, []);

  console.log("render main view");

  const isDirty = useTaskStore(
    (state) => !isEqual(state.taskList, initialTaskList)
  );

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

  const handleSaveTaskList = useTaskStore((state) => state.onSaveActiveTasks);

  const updateTaskList = useTaskStore((c) => c.updateTaskListPartial);
  const handleTaskListNameChange = (name: string) => {
    updateTaskList({ name });
  };

  // store a string for start time in state

  const nowInRightUnits = useMemo(() => parser(dateToStrLocal(new Date())), []);

  const onSearchOpen = useTaskStore((state) => state.setIsSearchOpen);

  // store shouldScheduleAfterCurrent in state
  const [shouldScheduleAfterCurrent, setShouldScheduleAfterCurrent] =
    useState(true);

  const hotkeys = useMemo<HotkeyConfig[]>(
    () => [
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
          onSearchOpen(true);

          // stop the S from going into the search box
          ev.preventDefault();
        },
      },
    ],
    [colorContext.isColoredByPriority, onChange, onSearchOpen]
  );

  useHotkeys(hotkeys);

  const toggleDetailShortcut = useTaskStore(
    (state) => state.toggleDetailShortcut
  );

  const onChangePartial = useTaskStore(
    (state) => state.updateHoverTimeBlockEntryPartial
  );

  const onDeleteHover = useTaskStore((state) => state.onDeleteHoverTask);

  const onScheduleHover = useTaskStore((state) => state.onScheduleHoverTask);

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
    ],
    [onChangePartial, toggleDetailShortcut, onDeleteHover, onScheduleHover]
  );

  useHotkeys(timeUnitHotKeys);

  const [newTaskText, setNewTaskText] = useState("");

  const addNewTask = useTaskStore((state) => state.addTimeBlockEntry);

  const handleCreateTaskClick = async (isScheduled = true) => {
    // const newStartTime = isScheduled ? getFirstStartTime() : undefined;
    const newStartTime = isScheduled ? undefined : undefined;

    // add new task to state
    const task: TimeBlockEntry = {
      id: createUuid(),
      description: newTaskText,
      duration: 60 * 60,
      start: newStartTime,
      priority: 5,
    };

    addNewTask(task);

    setNewTaskText("");
  };

  const taskListName = useTaskStore((state) => state.taskList.name);

  const unscheduled = useTaskStore(
    (state) => state.taskList.timeBlockEntries
  ).filter((c) => c.start === undefined);

  return (
    <>
      <H2>
        <EditableText
          onChange={handleTaskListNameChange}
          value={taskListName}
        />
      </H2>

      {isDirty && <Button text="save all" onClick={handleSaveTaskList} />}

      <SettingsPopover
        isColoredByPriority={colorContext.isColoredByPriority}
        onChange={onChange}
        dateToStr={dateToStr}
        shouldScheduleAfterCurrent={shouldScheduleAfterCurrent}
        setShouldScheduleAfterCurrent={setShouldScheduleAfterCurrent}
      />

      <TaskColorContext.Provider value={{ ...colorContext, onChange }}>
        <>
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
              {unscheduled.map((block, idx) => (
                <TimeBlockUnit key={idx} block={block} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex" }}>
            <TimeBlockDay
              shouldShowLeftSidebar={true}
              shouldScheduleAfterCurrent={shouldScheduleAfterCurrent}
              nowInRightUnits={nowInRightUnits}
            />
          </div>
          <SearchOverlay />
        </>
      </TaskColorContext.Provider>
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
