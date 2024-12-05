import { Status, Transaction } from "~/app/model/types_WIP";

async function completeTransaction(_: { transaction: Transaction; status: Status }): Promise<void> {
  throw new Error("Not implemented");
}

export { completeTransaction };
