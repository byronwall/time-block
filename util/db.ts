import { ReadStream } from "fs";
import Redis from "ioredis";
import { TaskList, TaskListOld, TimeBlockDay } from "../model/model";

const { REDIS_URL = "" } = process.env;
// delete process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("Missing REDIS_URL environment variable");
}

try {
  new URL(REDIS_URL);
} catch (err) {
  throw new Error("Invalid REDIS_URL environment variable");
}

const client = new Redis(REDIS_URL);

client.on("error", (err) => {
  console.error("Redis error: ", err);
});

export async function findAll() {
  const reply = await client.hgetall("BLOCKS");

  const obj: { [key: string]: TaskList } = {};

  for (let key in reply) {
    obj[key] = JSON.parse(reply[key]) as TaskList;
  }

  return obj;
}

export async function findOneTaskList(id: string) {
  const reply = await client.hget("BLOCKS", id);

  const _taskList = JSON.parse(reply) as TaskList;

  // data migration steps
  const taskList = migrateTaskListData(_taskList);

  return taskList;
}

type TaskListDb = TaskList & Partial<TaskListOld>;

function migrateTaskListData(taskList: TaskListDb): TaskList {
  const newTaskList = taskList as TaskList;

  console.log("migrating task list data", taskList);

  if (!("timeBlockEntries" in newTaskList)) {
    newTaskList.timeBlockEntries = [];
  }

  if ("unscheduledEntries" in newTaskList) {
    ((newTaskList as any).unscheduledEntries ?? []).forEach((c) =>
      newTaskList.timeBlockEntries.push(c)
    );
  }

  delete (newTaskList as any).unscheduledEntries;
  delete (newTaskList as any).timeBlockDays;

  // handle the tasks if needed
  if (taskList.timeBlockEntries) {
    taskList.timeBlockEntries.forEach((entry) => {
      if (entry.priority === undefined) {
        entry.priority = 5;
      }
    });
  }

  // migrate the time blocks into the first day if needed

  if (newTaskList.viewStart === undefined) {
    newTaskList.viewStart = "08:00";
  }

  if (newTaskList.viewEnd === undefined) {
    newTaskList.viewEnd = "17:00";
  }

  return newTaskList;
}

export async function insertTask(data: TaskList) {
  const value = JSON.stringify(data);
  const reply = await client.hset("BLOCKS", data.id, value);
  return reply;
}
