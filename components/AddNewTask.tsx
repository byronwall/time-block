import { FormGroup, InputGroup } from "@blueprintjs/core";
import { useState } from "react";

import { TimeBlockEntry } from "../model/model";
import { useTaskStore } from "../model/TaskStore";
import { createUuid } from "../util/helpers";

interface AddNewTaskProps {}

export function AddNewTask(props: AddNewTaskProps) {
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
      day: 0,
    };

    addNewTask(task);

    setNewTaskText("");
  };

  return (
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
  );
}
