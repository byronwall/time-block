import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { useState } from "react";

import { TaskList, TaskListSelector } from "../components/TaskListSelector";
import { TimeBlockDay, TimeBlockEntry } from "../components/TimeBlockDay";
import { findAll } from "../util/db";
import { createUuid } from "../util/helpers";
import { quickPost } from "../util/quickPost";

interface TasksProps {
  taskLists: TaskList[];
  activeTaskList: TaskList;
}

export default function Tasks(props: TasksProps) {
  // store active task list in state

  const defaultTaskList: TaskList = {
    name: "default",
    timeBlockEntries: [],
    id: createUuid(),
  };

  const [activeTaskList, setActiveTaskList] = useState(
    props.activeTaskList ?? defaultTaskList
  );

  const handleSaveTaskList = async () => {
    await quickPost("/api/insertTaskList", activeTaskList);

    // TODO: follow this with a reload of available
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
    <div style={{ width: 800, margin: "auto" }}>
      <h1>Time Block Schedule</h1>
      <p>
        Create new blocks with the input. Drag them around to change time or
        duration.
      </p>

      <Button
        text="create new list"
        onClick={() => {
          setActiveTaskList({
            id: createUuid(),
            name: "new list",
            timeBlockEntries: [],
          });
        }}
      />

      <div>
        <h3>choose a task list</h3>
        <TaskListSelector
          items={props.taskLists}
          activeItem={activeTaskList}
          onItemSelect={setActiveTaskList}
        />
      </div>

      <FormGroup>
        <InputGroup
          value={activeTaskList.name}
          onChange={(evt) => handleTaskListNameChange(evt.target.value)}
        />
      </FormGroup>
      <Button text="save all" onClick={handleSaveTaskList} />

      <TimeBlockDay
        start={"08:00"}
        end={"18:00"}
        majorUnit={1}
        defaultEntries={activeTaskList.timeBlockEntries}
        onEntryChange={handleNewTaskList}
      />
      <div style={{ marginBottom: 100 }} />
    </div>
  );
}

export async function getServerSideProps(context): Promise<{
  props: Partial<TasksProps>;
}> {
  let allTaskLists = await findAll();

  let values = Object.values(allTaskLists);

  return {
    props: {
      taskLists: values ?? [],
    },
  };
}
