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
    const client =  await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");

        return result;
    } catch (error){
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}