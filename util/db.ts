import Redis from "ioredis";
import { TaskList } from "../components/TaskListSelector";
import { Task } from "../model/model";

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

  const taskList = JSON.parse(reply) as TaskList;

  return taskList;
}

export async function insertTask(data: TaskList) {
  const value = JSON.stringify(data);
  const reply = await client.hset("BLOCKS", data.id, value);
  return reply;
}
