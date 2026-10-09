import { Request, Response, NextFunction } from "express";
import { 
    createUserAccount, 
    getUserAccounts, 
    getUserAccount, 
    tranferMoney, 
    depositMoney, 
    withdrawMoney 
} from "./account.service.js";
import { getAccountTransactionHistory } from "../transaction/transaction.service.js";

export async function createAccountController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void>{
    try{
        const { type, currency } = req.body;

        if(!req.user){
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }
        const account = await createUserAccount(
            req.user.userId,
            type,
            currency
        );

        res.status(201).json({
            account,
        });
    } catch(error){
        next(error);
    }
}

export async function getAccountsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try{
        if(!req.user){
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        const accounts = await getUserAccounts(
            req.user.userId
        );

        res.status(200).json({
            accounts,
        });
    } catch (error){
        next(error);
    }
}

export async function getAccountController(
    req: Request< {accountId: string}>,
    res: Response,
    next: NextFunction
): Promise<void>{
    try{
        if(!req.user){
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        const account = await getUserAccount(
            req.params.accountId,
            req.user.userId
        );

        if(!account){
            res.status(404).json({
                message: "Account not found",
            });
            return;
        }

        res.status(200).json({
            account,
        });
    } catch (error){
        next(error);
    }
}

export async function depositController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void>{
    try{
        if (!req.user){
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        const transaction = await depositMoney(
            req.params.accountId as string,
            req.user.userId,
            req.body.amount
        );

        res.status(201).json({
            message: "Deposit Successful",
            transaction,
        });
    } catch (error){
        next(error);
    }
}

export async function withdrawController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try{
        if(!req.user) {
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        const transaction = await withdrawMoney(
            req.params.accountId as string,
            req.user.userId,
            req.body.amount
        );
        
        res.status(201).json({
            message: "Withdrawal successful",
            transaction
        });
    } catch(error){
        next(error);
    }
}

export async function transferController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void>{
    try{
        if(!req.user){
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        const idempotencyKey = req.header("Idempotency-Key");
        if(!idempotencyKey){
            res.status(400).json({
                message: "Idempotency-Key header is required",
            });
            return;
        }
        
        const transaction = await tranferMoney(
            req.params.accountId as string,
            req.user.userId,
            req.body.toAccountId,
            req.body.amount,
            idempotencyKey
        );

        res.status(201).json({
            message: "Transfer successful",
            transaction,
        });
    } catch (error){
        next(error);
    }
}

export async function getAccountTransactionController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void>{
    try{
        if(!req.user){
            res.status(401).json({
                message: "Unauthorized",
            });
            return;
        }

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            100
        );

        const offset = Math.max(
            Number(req.query.offset) || 0,
            0
        );

        const result = await getAccountTransactionHistory(
            req.params.accountId as string,
            req.user.userId,
            limit,
            offset
        );

        res.status(200).json(result);
    } catch (error){
        next(error);
    }
}