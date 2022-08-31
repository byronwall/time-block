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
import { useCallback, useMemo, useState } from "react";
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
import { getTImeBlocksWithoutOverlap } from "../../components/helpers";
import { createUuid } from "../../util/helpers";
import {
  TimeBlockUnit,
  TimeBlockUnitProps,
} from "../../components/TimeBlockUnit";

interface TimeBlockViewProps {
  initialTaskList: TaskList;
}

export default function TimeBlockView(props: TimeBlockViewProps) {
  const { initialTaskList } = props;

  const [activeTaskList, setActiveTaskList] = useSetState(initialTaskList);

  const isDirty = !isEqual(activeTaskList, initialTaskList);

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

  const handleNewTaskList = (entries: TimeBlockEntry[], idx: number) => {
    // update the entries for single day

    const newDays = activeTaskList.timeBlockDays.map((day, i) => {
      if (i === idx) {
        return {
          ...day,
          entries,
        };
      }
      return day;
    });

    setActiveTaskList({ timeBlockDays: newDays });
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
    [colorContext.isColoredByPriority, onChange, setSearchContext]
  );

  useHotkeys(hotkeys);

  const [newTaskText, setNewTaskText] = useState("");

  const handleBlockSchedule = (id: string) => {
    // remove from unscheduled
    const newUnscheduled = activeTaskList.unscheduledEntries.filter((entry) => {
      return entry.id !== id;
    });

    // add to first day
    const newDays = [...activeTaskList.timeBlockDays];
    const firstDay = newDays[0];
    const taskToSched = activeTaskList.unscheduledEntries.find(
      (entry) => entry.id === id
    );

    taskToSched.start = getFirstStartTime();
    firstDay.entries.push(taskToSched);

    setActiveTaskList({
      unscheduledEntries: newUnscheduled,
      timeBlockDays: newDays,
    });
  };

  function getFirstStartTime() {
    const entriesFirstDay = activeTaskList.timeBlockDays[0].entries;
    const maxEndTime = entriesFirstDay.reduce((max, block) => {
      return Math.max(max, block.start + block.duration * 1000);
    }, startTime.getTime());

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

    const newDays = [...activeTaskList.timeBlockDays];
    const firstDay = newDays[0];
    firstDay.entries.push(task);
    setActiveTaskList({ timeBlockDays: newDays });

    setNewTaskText("");
  };

  const TimeBlockCommon: Pick<TimeBlockUnitProps, "onDelete" | "onChange"> = {
    onChange: (id: string, newEntry: TimeBlockEntry) => {},
    onDelete: (id: string) => {},
  };

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
                {activeTaskList.unscheduledEntries.map((block) => (
                  <TimeBlockUnit
                    {...TimeBlockCommon}
                    key={block.id}
                    block={block}
                    onSchedule={handleBlockSchedule}
                  />
                ))}
              </div>
            </div>
            <div>
              actions
              <Button
                text="add day"
                onClick={() => {
                  const newDays = activeTaskList.timeBlockDays.concat([
                    {
                      label: "New",
                      entries: [],
                    },
                  ]);
                  setActiveTaskList({ timeBlockDays: newDays });
                }}
              />
            </div>
            <div style={{ display: "flex" }}>
              {activeTaskList.timeBlockDays.map((day, idx) => (
                <TimeBlockDay
                  key={idx}
                  shouldShowLeftSidebar={idx === 0}
                  dateStart={startTime}
                  dateEnd={endTime}
                  defaultEntries={day.entries}
                  onEntryChange={(entries) => handleNewTaskList(entries, idx)}
                  shouldScheduleAfterCurrent={shouldScheduleAfterCurrent}
                  nowInRightUnits={nowInRightUnits}
                />
              ))}
            </div>
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

  let initialTaskList = await findOneTaskList(id);

  return {
    props: {
      initialTaskList,
    },
  };
}
