// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { Task } from "../../model/model";
import { insertTask } from "../../util/db";

export default async function handler(req, res) {
  // do the insert -- return 200

  console.log("req.body:", req.body);

  const task = req.body as Task;

  const result = await insertTask(task);

  res.status(200).json({ result });
}
