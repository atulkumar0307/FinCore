import { PoolClient } from "pg";
import { pool } from "../../config/database.js";
import { Transaction } from "./transaction.types.js";

export async function createTransaction(
    type: Transaction["type"],
    amount: string,
    currency: string,
    reference?: string,
    client?: PoolClient
): Promise<Transaction> {
    const db = client ?? pool;
    
    const result = await db.query<Transaction>(
        `
        INSERT INTO transactions (
            type,
            amount,
            currency,
            reference
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            type,
            status,
            amount,
            currency,
            reference,
            created_at AS "createdAt"
        `,
        [type, amount, currency, reference ?? null]
    );

    return result.rows[0];
}

export async function completeTransaction(
    transactionId: string,
    client: PoolClient
): Promise<Transaction> {
    const result = await client.query<Transaction>(
        `
        UPDATE transactions
        SET status = 'COMPLETED'
        WHERE id = $1
        RETURNING
            id,
            type,
            status,
            amount,
            currency,
            reference,
            created_at AS "createdAt"
        `,
        [transactionId]
    );
    return result.rows[0];
}

export async function findTransactionByAccountId(
    accountId: string,
    limit: number,
    offset: number
): Promise<unknown[]>{
    const result = await pool.query(
        `SELECT
            t.id,
            t.type,
            t.status,
            t.amount,
            t.currency,
            le.entry_type AS "entryType",
            t.created_at AS "createdAt"
        FROM transactions t
        INNER JOIN ledger_entries le
            ON le.transaction_id = t.id
        WHERE le.account_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2
        OFFSET $3
        `,
        [accountId, limit, offset]
    );

    return result.rows;
}

export async function hasMoreTransactions(
    accountId: string,
    offset: number,
    limit: number
): Promise<boolean>{
    const result = await pool.query<{hasMore: boolean}>(
        `
        SELECT EXISTS (
            SELECT 1

            FROM transactions t
            INNER JOIN ledger_entries le
                ON le.transaction_id = t.id
            WHERE le.account_id = $1
            ORDER BY t.created_at DESC, t.id DESC
            OFFSET $2
            LIMIT 1
        ) AS "hasMore"
        `,
        [accountId, offset + limit]
    );

    return result.rows[0].hasMore;
}