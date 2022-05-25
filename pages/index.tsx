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
      <h1>Time Block Schedule</h1>
      <p>
        Create new blocks with the input. Drag them around to change time or
        duration.
      </p>

      <TimeBlockDay start={"08:00"} end={"18:00"} majorUnit={1} />
      <div style={{ marginBottom: 100 }} />
    </div>
  );

  async function loadAllTasks() {
    const results = await fetch("/api/getAllTasks");
    const data = (await results.json()) as TaskHash;

    setTasks(data);
  }
}
