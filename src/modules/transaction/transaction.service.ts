import { createTransaction } from "./transaction.repository.js";
import { Transaction } from "./transaction.types.js";

export async function initiateTransaction(
    type: Transaction["type"],
    amount: string,
    currency: string,
    reference?: string
): Promise<Transaction>{
    return await createTransaction(
        type,
        amount,
        currency,
        reference
    );
}