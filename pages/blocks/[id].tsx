import {
  Button,
  EditableText,
  FormGroup,
  H2,
  HotkeyConfig,
  InputGroup,
  useHotkeys,
} from "@blueprintjs/core";
import { isEqual } from "lodash-es";
import { useEffect, useMemo, useState } from "react";

import { SearchOverlay } from "../../components/SearchOverlay";
import { SettingsPopover } from "../../components/SettingsPopover";
import { TimeBlockDay } from "../../components/TimeBlockDay";
import { TimeBlockUnit } from "../../components/TimeBlockUnit";
import { TaskList, TimeBlockEntry } from "../../model/model";
import { useTaskStore } from "../../model/TaskStore";
import { findOneTaskList } from "../../util/db";
import { createUuid } from "../../util/helpers";

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

  // TODO: this pulls in too many changes - tighten scope?
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

      <SettingsPopover />

      <>
        <div style={{ margin: 30 }}>
          {/* TODO: move this add new into its own comp */}
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
          <TimeBlockDay shouldShowLeftSidebar={true} />
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
