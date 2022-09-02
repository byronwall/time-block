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
import { atom, Provider, useAtom } from "jotai";
import { focusAtom } from "jotai/optics";
import { splitAtom, useHydrateAtoms } from "jotai/utils";
import { isEqual } from "lodash-es";
import { useCallback, useMemo, useState } from "react";
import { useSetState } from "react-use";

import { SearchContext } from "../../components/SearchContext";
import { SearchOverlay } from "../../components/SearchOverlay";
import { SettingsPopover } from "../../components/SettingsPopover";
import {
  ColorSansHandler,
  TaskColorContext,
} from "../../components/TaskColorContext";
import { TimeBlockDay } from "../../components/TimeBlockDay";
import { TimeBlockUnit } from "../../components/TimeBlockUnit";
import {
  createDefaultTaskList,
  TaskList,
  TimeBlockEntry,
} from "../../model/model";
import { findOneTaskList } from "../../util/db";
import { createUuid } from "../../util/helpers";
import { quickPost } from "../../util/quickPost";

interface TimeBlockViewProps {
  initialTaskList: TaskList;
}

const parser = utcParse("%H:%M");

const dateToStr = utcFormat("%H:%M");
const dateToStrLocal = timeFormat("%H:%M");

export const taskListAtom = atom(createDefaultTaskList());

// TODO: attempt to add the filter here for unscheduled items
export const timeBlockEntriesAtom = focusAtom(taskListAtom, (c) =>
  c.prop("timeBlockEntries")
);

export const timeBlockEntriesSplitAtom = splitAtom(timeBlockEntriesAtom);

// TODO: this needs to go down one level so initial props can be passed in
export default function TimeBlockView(props: TimeBlockViewProps) {
  const { initialTaskList } = props;

  console.log("render main view");

  useHydrateAtoms([[taskListAtom, initialTaskList]]);
  const [activeTaskList, setActiveTaskList] = useAtom(taskListAtom);

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

  const handleTaskListNameChange = (name: string) => {
    setActiveTaskList({ ...activeTaskList, name });
  };

  // store a string for start time in state

  const startTime = useMemo(
    () => parser(activeTaskList.viewStart),
    [activeTaskList.viewStart]
  );
  const endTime = parser(activeTaskList.viewEnd);

  const nowInRightUnits = useMemo(() => parser(dateToStrLocal(new Date())), []);

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

  const handleBulkTimeBlockChange = useCallback(
    (entries: TimeBlockEntry[]) => {
      // grab updated or existing
      const newEntries = activeTaskList.timeBlockEntries.map((entry) => {
        const newEntry = entries.find((e) => e.id === entry.id);
        if (newEntry) {
          return newEntry;
        }
        return entry;
      });

      setActiveTaskList({ ...activeTaskList, timeBlockEntries: newEntries });
    },
    [activeTaskList, setActiveTaskList]
  );

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

    const newEntries = [...activeTaskList.timeBlockEntries, task];

    setActiveTaskList({ ...activeTaskList, timeBlockEntries: newEntries });

    setNewTaskText("");
  };

  const onEntryChange = useCallback(
    (id: string, newEntry: TimeBlockEntry) =>
      handleBulkTimeBlockChange([newEntry]),
    [handleBulkTimeBlockChange]
  );

  const unscheduled = activeTaskList.timeBlockEntries.filter(
    (c) => c.start === undefined
  );

  return (
    <>
      {/* this will need to go up a level (stay with [id]) */}
      <Provider initialValues={[[taskListAtom, initialTaskList]]}>
        <H2>
          <EditableText
            onChange={handleTaskListNameChange}
            value={activeTaskList.name}
          />
        </H2>

        {isDirty && <Button text="save all" onClick={handleSaveTaskList} />}

        <SettingsPopover
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
                  {unscheduled.map((block, idx) => (
                    <TimeBlockUnit
                      key={idx}
                      onChange={onEntryChange}
                      block={block}
                      startTime={startTime}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex" }}>
                <TimeBlockDay
                  shouldShowLeftSidebar={true}
                  dateStart={startTime}
                  dateEnd={endTime}
                  onEntryChange={handleBulkTimeBlockChange}
                  shouldScheduleAfterCurrent={shouldScheduleAfterCurrent}
                  nowInRightUnits={nowInRightUnits}
                />
              </div>
              <SearchOverlay />
            </>
          </TaskColorContext.Provider>
        </SearchContext.Provider>
      </Provider>
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
