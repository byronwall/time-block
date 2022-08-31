import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import Link from "next/link";
import { useState } from "react";

import { TaskListSelector } from "../components/TaskListSelector";
import { createDefaultTaskList, TaskList } from "../model/model";
import { findAll } from "../util/db";

interface TasksProps {
  taskLists: TaskList[];
  initialTaskList: TaskList;
}

export default function Tasks(props: TasksProps) {
  const { taskLists, initialTaskList } = props;

  const defaultTaskList = createDefaultTaskList();

  const [activeTaskList, setActiveTaskList] = useState(
    initialTaskList ?? defaultTaskList
  );

  const handleTaskListNameChange = (name: string) => {
    const newTaskList = { ...activeTaskList };
    newTaskList.name = name;

    setActiveTaskList(newTaskList);
  };

  return (
    <div>
      <p>
        Create new blocks with the input. Drag them around to change time or
        duration.
      </p>

      <Button
        text="create new list"
        onClick={() => {
          setActiveTaskList(createDefaultTaskList());
        }}
      />

      <div>
        <h3>choose a task list</h3>

        <ul>
          {taskLists.map((taskList) => (
            <li key={taskList.id}>
              <Link href={`/blocks/${taskList.id}`}>{taskList.name}</Link>
            </li>
          ))}
        </ul>

        <TaskListSelector
          items={taskLists}
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
