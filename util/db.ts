import Redis from "ioredis";
import { TaskList } from "../components/TaskListSelector";
import { Task } from "../model/model";

const { REDIS_URL = "" } = process.env;
// delete process.env.REDIS_URL;

if (!REDIS_URL) {
  console.log("env:", process.env);
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

  console.log("reply:", reply);

  const obj: { [key: string]: TaskList } = {};

  for (let key in reply) {
    obj[key] = JSON.parse(reply[key]) as TaskList;
  }

  return obj;
}

export async function insertTask(data: TaskList) {
  console.log("insertTask:", data);
  const value = JSON.stringify(data);
  const reply = await client.hset("BLOCKS", data.id, value);
  return reply;
}
