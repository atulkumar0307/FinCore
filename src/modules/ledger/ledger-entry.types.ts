export type LedgerEntryType = 
    | "DEBIT"
    | "CREDIT";

export type LedgerEntry = {
    id: string;
    transactionId: string;
    accountId: string;
    entryType: LedgerEntryType;
    amount: string;
    createdAt: Date;
};