// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { TaskList } from "../../model/model";
import { insertTask } from "../../util/db";

export default async function handler(req, res) {
  // do the insert -- return 200

  const task = req.body as TaskList;

  const result = await insertTask(task);

  res.status(200).json({ result });
}
