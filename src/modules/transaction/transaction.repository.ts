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