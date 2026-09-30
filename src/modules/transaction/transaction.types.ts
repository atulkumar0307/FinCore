export type TransactionType = 
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "TRANSFER";

export type TransactionStatus = 
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "RESERVED";

export type Transaction = {
    id: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: string;
    currency: string;
    reference: string | null;
    createdAt: Date;
}