import { createAccount, findAccountsByUserId, findAccountById, findAccountByIdForUpdate, increaseAccountBalance, decreaseAccountBalance } from "./account.repository.js";
import { Account } from "./account.types.js";
import { withTransaction } from "../../config/database.js";
import { createTransaction, completeTransaction } from "../transaction/transaction.repository.js";
import { createLedgerEntry } from "../ledger/ledger.repository.js";

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

export async function depositMoney(
    accountId: string,
    userId: string,
    amount: string
) {
    return await withTransaction(async(client) => {

        // 1. Find and lock the account
        const account = await findAccountByIdForUpdate(
            accountId,
            userId,
            client
        );
        if(!account){
            throw new Error("Account not found");
        }

        // 2. Check account status
        if(account.status !== "ACTIVE"){
            throw new Error("Account is not active");
        }

        // 3. Create financial transaction
        const transaction = await createTransaction(
            "DEPOSIT",
            amount,
            account.currency,
            undefined,
            client
        );

        // 4. Increase account balance
        await increaseAccountBalance(
            accountId,
            amount,
            client
        );

        // 5. Create CREDIT ledger entry
        await createLedgerEntry(
            transaction.id,
            accountId,
            "CREDIT",
            amount,
            client
        );

        // 6. Complete transaction
        await completeTransaction(
            transaction.id,
            client
        )

        return transaction;
    });
}

export async function withdrawMoney(
    accountId: string,
    userId: string,
    amount: string
){
    return await withTransaction(async(client) => {
        const account = await findAccountByIdForUpdate(
            accountId,
            userId,
            client
        );

        if(!account){
            throw new Error("Account not found");
        }

        if(account.status !== "ACTIVE"){
            throw new Error("Account is not active");
        }

        if(Number(account.balance) < Number(amount)){
            throw new Error("Insufficient balance");
        }

        const transaction = await createTransaction(
            "WITHDRAWAL",
            amount,
            account.currency,
            undefined,
            client
        );

        await decreaseAccountBalance(
            accountId,
            amount,
            client
        );

        await createLedgerEntry(
            transaction.id,
            accountId,
            "DEBIT",
            amount,
            client
        );

        await completeTransaction(
            transaction.id,
            client
        );

        return transaction;
    });
}

export async function tranferMoney(
    fromAccountId: string,
    userId: string,
    toAccountId: string,
    amount: string
){
    return await withTransaction(async (client) => {
        // Prevent self transfer
        if(fromAccountId === toAccountId){
            throw new Error("Cannot transfer to the same account");
        }
        
        // Always lock account in the same order
        const accountIds = [fromAccountId, toAccountId].sort();

        const firstAccount = await findAccountByIdForUpdate(
            accountIds[0],
            undefined,
            client
        );
        const secondAccount = await findAccountByIdForUpdate(
            accountIds[1],
            undefined,
            client
        );

        if(!firstAccount || !secondAccount){
            throw new Error("Account not found");
        }

        // Recover the actual business roles after sorted locking
        const sender = firstAccount.id === fromAccountId ? firstAccount : secondAccount;
        const receiver = firstAccount.id === toAccountId ? firstAccount : secondAccount;

        // Sender must belong to logged in user
        if(sender.userId !== userId){
            throw new Error("Unauthorized");
        }

        // Both account must be active
        if(
            sender.status !== "ACTIVE" ||
            receiver.status !== "ACTIVE"
        ){
            throw new Error("Both accounts must be active");
        }

        // Sender must have enough money
        if(Number(sender.balance) < Number(amount)){
            throw new Error("Insufficient balance");
        }

        // Create transfer transaction
        const transaction = await createTransaction(
            "TRANSFER",
            amount,
            sender.currency,
            undefined,
            client
        );

        // Debit sender
        await decreaseAccountBalance(
            sender.id,
            amount,
            client
        );

        // Credit receiver
        await increaseAccountBalance(
            receiver.id,
            amount,
            client
        );

        // Sender ledger entry
        await createLedgerEntry(
            transaction.id,
            sender.id,
            "DEBIT",
            amount,
            client
        );

        // Receiver ledger entry
        await createLedgerEntry(
            transaction.id,
            receiver.id,
            "CREDIT",
            amount,
            client
        )

        // Mark transaction complete
        await completeTransaction(
            transaction.id,
            client
        );

        return transaction;
    });
}