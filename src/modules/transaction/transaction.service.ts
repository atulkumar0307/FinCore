import { createTransaction } from "./transaction.repository.js";
import { Transaction } from "./transaction.types.js";
import { findAccountById } from "../account/account.repository.js";
import { findTransactionByAccountId } from "./transaction.repository.js";
import { AppError } from "../../shared/errors/app.error.js";
import { hasMoreTransactions } from "./transaction.repository.js";

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

export async function getAccountTransactionHistory(
    accountId: string,
    userId: string,
    limit: number,
    offset: number
) {
    const account = await findAccountById(accountId, userId);

    if(!account){
        throw new Error("Account not found");
    }

    const transactions = await findTransactionByAccountId(
        accountId,
        limit,
        offset
    );

    const hasMore = await hasMoreTransactions(
        accountId,
        offset,
        limit
    );

    return {
        transactions,
        pagination: {
            limit,
            offset,
            hasMore,
        },
    };
}