import { Request, Response, NextFunction } from "express";
import { createUserAccount, getUserAccounts, getUserAccount } from "./account.service.js";
import { depositMoney } from "./account.service.js";

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