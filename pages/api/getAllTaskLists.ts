import { findAll } from "../../util/db";

export default async function handler(req, res) {
  // do the insert -- return 200

  const result = await findAll();

  res.status(200).json(result);
}
