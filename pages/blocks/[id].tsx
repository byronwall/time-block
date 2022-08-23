import {
  Button,
  Card,
  EditableText,
  FormGroup,
  H2,
  Switch,
} from "@blueprintjs/core";
import { TimePicker } from "@blueprintjs/datetime";
import { Popover2 } from "@blueprintjs/popover2";
import { scaleOrdinal, utcFormat, utcParse } from "d3";
import { isEqual } from "lodash-es";
import { useCallback, useEffect, useState } from "react";

import { handleBooleanChange } from "../../components/helpers";
import {
  ColorSansHandler,
  TaskColorContext,
} from "../../components/TaskColorContext";
import { TaskList } from "../../components/TaskListSelector";
import { TimeBlockDay, TimeBlockEntry } from "../../components/TimeBlockDay";
import { findOneTaskList } from "../../util/db";
import { quickPost } from "../../util/quickPost";

interface TimeBlockViewProps {
  activeTaskList: TaskList;
}

export default function TimeBlockView(props: TimeBlockViewProps) {
  // store the active list in state too
  const [activeTaskList, setActiveTaskList] = useState(props.activeTaskList);

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
    const newTaskList = { ...activeTaskList };
    newTaskList.timeBlockEntries = entries;

    setActiveTaskList(newTaskList);
  };

  const handleTaskListNameChange = (name: string) => {
    const newTaskList = { ...activeTaskList };
    newTaskList.name = name;

    setActiveTaskList(newTaskList);
  };

  useEffect(() => {
    // bind a key press handler to the document to detect key press without focus
    function handleKeyDown(e: KeyboardEvent) {
      // check if target is an input or textarea
      const isTargetInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      if (isTargetInput) {
        return;
      }

      if (e.key === "C") {
        onChange({ isColoredByPriority: !colorContext.isColoredByPriority });
        return;
      }

      console.log("unhandled key press", e.key);
    }

    document.addEventListener("keydown", handleKeyDown);

    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onChange, colorContext.isColoredByPriority]);

  // store a string for start time in state
  const parser = utcParse("%H:%M");
  const dateToStr = utcFormat("%H:%M");

  const [startTime, setStartTime] = useState(parser("08:00"));
  const [endTime, setEndTime] = useState(parser("18:00"));

  return (
    <>
      <H2>
        <EditableText
          onChange={handleTaskListNameChange}
          value={activeTaskList.name}
        />
      </H2>

      {isDirty && <Button text="save all" onClick={handleSaveTaskList} />}

      <Popover2
        content={
          <Card>
            <Switch
              label="color by priority"
              checked={colorContext.isColoredByPriority}
              onChange={handleBooleanChange((isColoredByPriority) =>
                onChange({ isColoredByPriority })
              )}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <FormGroup inline label="start time">
                <TimePicker
                  value={startTime}
                  onChange={setStartTime}
                  showArrowButtons
                />
              </FormGroup>

              <FormGroup inline label="end time">
                <TimePicker
                  value={endTime}
                  onChange={setEndTime}
                  showArrowButtons
                />
              </FormGroup>
            </div>
          </Card>
        }
      >
        <Button icon="cog" rightIcon="chevron-down" />
      </Popover2>

      <TaskColorContext.Provider value={{ ...colorContext, onChange }}>
        <TimeBlockDay
          start={dateToStr(startTime)}
          end={dateToStr(endTime)}
          majorUnit={1}
          defaultEntries={activeTaskList.timeBlockEntries}
          onEntryChange={handleNewTaskList}
        />
      </TaskColorContext.Provider>
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
