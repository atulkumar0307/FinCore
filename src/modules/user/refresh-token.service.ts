import crypto from "node:crypto";
import { generateRefreshToken, hashRefreshToken } from "../../shared/auth/refresh-token.js";
import { createRefreshToken, findRefreshTokenByHash, revokeRefreshToken, revokeRefreshTokenFamily } from "./refresh-token.repository.js";
import { createAccessToken } from "../../shared/auth/jwt.js";
import { RefreshTokenReuseError } from "../../shared/errors/auth.errors.js";

export type RefreshResponse = {
    accessToken: string;
    refreshToken: string;
};

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export async function issueRefreshToken(
    userId: string,
    tokenFamilyId?: string
): Promise<string>{
    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const familyId = tokenFamilyId ?? crypto.randomUUID();
    const expiresAt = new Date(
        Date.now() + 
        REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await createRefreshToken(
        userId,
        tokenHash,
        familyId,
        expiresAt
    );

    return refreshToken;
}

export async function refreshAccessToken(
    refreshToken: string
): Promise<RefreshResponse | null> {
    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await findRefreshTokenByHash(tokenHash);
    if(!storedToken){
        return null;
    }
    if(storedToken.revokedAt){
        await revokeRefreshTokenFamily(
            storedToken.tokenFamilyId
        )
        throw new RefreshTokenReuseError();
    }
    if(storedToken.expiresAt <= new Date()){
        return null;
    }

    await revokeRefreshToken(tokenHash);

    const newAccessToken = createAccessToken({
        userId: storedToken.userId,
    });

    const newRefreshToken = await issueRefreshToken(
        storedToken.userId,
        storedToken.tokenFamilyId
    );

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    };
}

export async function revokeRefreshTokenByValue(
    refreshToken: string
): Promise<void>{
    const tokenHash = hashRefreshToken(refreshToken);

    await revokeRefreshToken(tokenHash);
}