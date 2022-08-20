import { Button, EditableText, H2, Switch } from "@blueprintjs/core";
import { interpolateViridis, scaleLinear, scaleOrdinal } from "d3";
import { useState } from "react";
import { TaskList } from "../../components/TaskListSelector";
import { TimeBlockDay, TimeBlockEntry } from "../../components/TimeBlockDay";
import { findOneTaskList } from "../../util/db";
import { quickPost } from "../../util/quickPost";

import { handleBooleanChange } from "../../components/helpers";
import {
  ColorSansHandler,
  TaskColorContext,
} from "../../components/ColorSansHandler";

interface TimeBlockViewProps {
  activeTaskList: TaskList;
}

export default function TimeBlockView(props: TimeBlockViewProps) {
  // store the active list in state too
  const [activeTaskList, setActiveTaskList] = useState(props.activeTaskList);

  // store the color provider state here
  const [colorContext, setColorContext] = useState<ColorSansHandler>({
    getColorFromPriority: (priority: number) => {
      const scale = scaleOrdinal<number, string>()
        .domain([1, 2, 3, 4, 5])
        .range(["#D61E29", "#FDBB30", "#FEE08B", "#D9EF8B", "#A6D96A"]);
      return scale(priority);
    },
    isColoredByPriority: false,
  });

  const onChange = (data: Partial<TaskColorContext>) =>
    setColorContext({ ...colorContext, ...data });

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

  return (
    <>
      <H2>
        <EditableText
          onChange={handleTaskListNameChange}
          value={activeTaskList.name}
        ></EditableText>
      </H2>

      <Button text="save all" onClick={handleSaveTaskList} />

      <Switch
        label="color by priority"
        checked={colorContext.isColoredByPriority}
        onChange={handleBooleanChange((isColoredByPriority) =>
          onChange({ isColoredByPriority })
        )}
      />

      <TaskColorContext.Provider value={{ ...colorContext, onChange }}>
        <TimeBlockDay
          start={"08:00"}
          end={"18:00"}
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
