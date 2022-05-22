import Redis from "ioredis";
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
  const reply = await client.hgetall("DATA");

  const obj: { [key: string]: Task } = {};

  for (let key in reply) {
    obj[key] = JSON.parse(reply[key]);
  }

  return obj;
}

export async function findOne(name: string, version: string) {
  const reply = await client.hget(name, version);

  if (!reply) {
    return null;
  }

  let record: Task = JSON.parse(reply);

  return record;
}

export async function insertTask(data: Task) {
  console.log("insertTask:", data);
  const value = JSON.stringify(data);
  const reply = await client.hset("DATA", data.id, value);
  return reply;
}
