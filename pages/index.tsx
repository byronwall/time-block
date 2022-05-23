import { useState } from "react";
import { TimeBlockDay } from "../components/TimeBlockDay";
import { Task } from "../model/model";
import { createUuid } from "../util/helpers";

interface TasksProps {}

type TaskHash = { [key: string]: Task };

export default function Tasks(props: TasksProps) {
  // store task hash in state
  const [tasks, setTasks] = useState<TaskHash>({});

  // store new task text in state
  const [newTaskText, setNewTaskText] = useState("");

  const handleLoadClick = async () => {
    await loadAllTasks();
  };

  const handleCreate = async () => {
    console.log("create");

    const task = {
      id: createUuid(),
      description: newTaskText,
      completed: false,
      duration: 0,
      end: 0,
      start: 0,
    };

    const result = await fetch("/api/insertTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });

    // then load new data
    loadAllTasks();
  };

  return (
    <div style={{ width: 800, margin: "auto" }}>
      <h1>Tasks</h1>
      <div>
        <h2>actions</h2>
        <button onClick={handleLoadClick}>Load All</button>

        <div>
          <input
            type="text"
            value={newTaskText}
            onChange={(evt) => setNewTaskText(evt.target.value)}
          />
          <button onClick={handleCreate}>Create</button>
        </div>

        <h2>task list</h2>
        <div>
          {Object.values(tasks).map((task) => (
            <div key={task.id}>{task.description}</div>
          ))}
        </div>

        <h2>time block day</h2>

        <TimeBlockDay start={"08:00"} end={"18:00"} majorUnit={1} />
        <div style={{ marginBottom: 100 }} />
      </div>
    </div>
  );

  async function loadAllTasks() {
    const results = await fetch("/api/getAllTasks");
    const data = (await results.json()) as TaskHash;

    setTasks(data);
  }
}
