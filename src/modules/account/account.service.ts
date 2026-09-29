import { createAccount, findAccountsByUserId, findAccountById } from "./account.repository.js";
import { Account } from "./account.types.js";

export async function createUserAccount(
    userId: string,
    type: Account["type"],
    currency: string
): Promise<Account>{
    const account = await createAccount(
        userId,
        type,
        currency
    );
    return account;
}

export async function getUserAccounts(
    userId: string
): Promise<Account[]> {
    return await findAccountsByUserId(userId);
}

export async function getUserAccount(
    accountId: string,
    userId: string
): Promise<Account | null> {
    return await findAccountById(accountId, userId);
}