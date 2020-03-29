import { Side } from "./constants";

export type Leg = {
	contract: string
	code: string;
	month: string;
	year: number;
	side: Side;
	qty: number;
	multiplier?: number;
	comma?: number;
	globex_code?: string;
	price_step?: number;
	kline?: Kline;
}

export type Formula = string;

export type Contract = string;

export type Formula2LegsResult = {
	formula: Formula;
	legs: Leg[];
	spreadSide: Side;
	spreadQty: number;
	message?: string;
};

export type KlineDate = string;

export type KlinePrice = number;

export type KlineRecord = Record<KlineDate, KlinePrice>;

export type Kline = KlineRecord[];

