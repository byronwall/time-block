import { Button, EditableText, H2 } from "@blueprintjs/core";
import { useState } from "react";
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

      <TimeBlockDay
        start={"08:00"}
        end={"18:00"}
        majorUnit={1}
        defaultEntries={activeTaskList.timeBlockEntries}
        onEntryChange={handleNewTaskList}
      />
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
