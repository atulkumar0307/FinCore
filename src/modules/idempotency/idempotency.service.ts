import {
    findIdempotencyKey,
    createIdempotencyKey,
} from "../idempotency/idempotency.repository.js";
import { generateRequestHash } from "./idempotency.utils.js";
import { PoolClient } from "pg";
import { AppError } from "../../shared/errors/app.error.js";

export async function checkIdempotency(
    userId: string,
    key:  string,
    requestData: unknown,
    client?: PoolClient
){
    const requestHash = generateRequestHash(requestData);

    // 1. Check weather the key already exists
    const existing = await findIdempotencyKey(
        userId,
        key,
        client
    );

    if(existing){
        if(existing.requestHash !== requestHash){
            throw new AppError(
                409,
                "Idempotency key already used for a different request"
            );
        }
        
        return {
            isRetry: true,
            record: existing,
        };
    }

    // 2. Try to create the key
    const created = await createIdempotencyKey(
        userId,
        key,
        requestHash,
        client
    );

    // 3. Another cocurrent request may have created it first
    if(!created){
        const cocurrent = await findIdempotencyKey(
            userId,
            key,
            client
        );

        if(!cocurrent){
            throw new Error(
                "Unable to create or find idempotency key"
            );
        }

        if(cocurrent.requestHash !== requestHash){
            throw new Error(
                "Idempotency key already used for a different request"
            );
        }
        return {
            isRetry: true,
            record: cocurrent,
        };
    }

    // 4. We created it, so this is a new request
    return {
        isRetry: false,
        record: created,
    };
}