import { Pool, PoolClient } from "pg";
import { env } from "./env.js";

export const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
});


export async function withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        const result = await callback(client);

        await client.query("COMMIT");
        transactionStarted = false;

        return result;
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error(
                    "Failed to roll back transaction:",
                    rollbackError
                );
            }
        }

        throw error;
    } finally {
        client.release();
    }
}
