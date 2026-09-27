import { pool } from "../../config/database.js";
import { RefreshToken } from "./refresh-token.types.js";

export async function createRefreshToken(
    userId: string,
    tokenHash: string,
    tokenFamilyId: string,
    expiresAt: Date
): Promise<RefreshToken> {
    const result = await pool.query<RefreshToken>(
        `
        INSERT INTO refresh_tokens (
        user_id,
        token_hash,
        token_family_id,
        expires_at
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
        id,
        user_id AS "userId",
        token_hash AS "tokenHash",
        token_family_id AS "tokenFamilyId",
        expires_at AS "expiresAt",
        revoked_at AS "revokedAt",
        created_at AS "createdAt"
        `,
        [userId, tokenHash, tokenFamilyId, expiresAt]
    );

    return result.rows[0];
}

export async function findRefreshTokenByHash(
    tokenHash: string
): Promise<RefreshToken | null>{
    const result = await pool.query<RefreshToken>(
        `
        SELECT
        id,
        user_id AS "userId",
        token_hash AS "tokenHash",
        token_family_id AS "tokenFamilyId",
        expires_at AS "expiresAt",
        revoked_at AS "revokedAt",
        created_at AS "createdAt"
        FROM refresh_tokens
        WHERE token_hash = $1
        `,
        [tokenHash]
    );
    if(result.rows.length === 0){
        return null;
    }

    return result.rows[0];
}

export async function revokeRefreshToken(
    tokenHash: string
): Promise<boolean> {
    const result = await pool.query(
        `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token_hash = $1
            AND revoked_at IS NULL
        `,
        [tokenHash]
    );

    return result.rowCount === 1;
}

export async function revokeRefreshTokenFamily(
    tokenFamilyId: string
): Promise<void> {
    await pool.query(
        `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token_family_id = $1
            AND revoked_at IS NULL
        `,
        [tokenFamilyId]
    );
}