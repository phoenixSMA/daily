import { AverageType, Side, SpreadType } from "./constants";

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
	lastDate?: Date;
	kline?: Kline;
}

export type Formula = string;

export type Contract = string;

export type Formula2LegsResult = {
	formula: Formula;
	legs: Leg[];
	spreadSide: Side;
	spreadQty: number;
	spreadType?: SpreadType;
	message?: string;
};

export type KlineDate = string;

export type KlinePrice = number;

export type KlineRecord = Record<KlineDate, KlinePrice>;

export type Kline = KlineRecord[];

export type DatesInterval = {
	from?: Date;
	to?: Date;
}

export type PatternDepth = string;

export type Patterns = Record<AverageType, Record<PatternDepth, Kline>>;

export type BacktestDate = string;

export type BacktestValue = number;

export type BacktestRecord = {
	side: Side;
	winPercent: number;
	dateEnter: BacktestDate;
	dateExit: BacktestDate;
	pnl: BacktestValue;
	pnlpd: BacktestValue;
};

export type TabsData = {
	opened: TabData[],
	closed: TabData[],
}

export type TabData = {
	tab_id: number;
	formula: Formula;
	side: Side;
	openedAt: Date;
	closedAt?: Date;
	qty?: number;
	price?: number;
	adjustedPrice?: number;
	points?: number;
	pnl?: number;
	last?: number;
	commission: number;
}
