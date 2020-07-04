import { MySQLConnector } from "../connectors/mysql-connector";
import {
	BacktestRecord,
	DatesInterval,
	Formula,
	Kline,
	KlineDate,
	KlinePrice,
	KlineRecord,
	Leg,
	PatternDepth,
	Patterns,
	TabData,
	TabsData,
} from "./types";
import { AverageType, Side, SortDirection, } from "./constants";
import { date2UTCdate, date2SQLstring, diffDays, modifyDateTime, } from "../helpers/utils";
import { Spread } from "./spread";
import { ModifyDateTime } from "../helpers/constants";
import { Backtests, PnLReports, Trades } from "../chartjs-adapter/data-types";

export class DataSource {
	private readonly _connector: MySQLConnector;

	constructor(connector: MySQLConnector) {
		this._connector = connector;
	}

	public static calcSpreadValue(legs: Leg[], prices: number[]): number | null {
		if (legs.length !== prices.length) {
			return null;
		}
		let value = 0;
		for (const ind in legs) {
			const leg = legs[ind];
			const price = prices[ind];
			value += (leg.side === Side.Buy ? 1 : -1) * leg.qty * price * leg.multiplier;
		}
		if (isNaN(value)) {
			return null;
		}
		return value;
	}

	public static getKlineRecord(kline: Kline, klineDate: KlineDate): KlineRecord | undefined {
		return kline.find((klineRecord: KlineRecord) => this.getKlineDate(klineRecord) === klineDate);
	}

	public static getKlinePrice(klineRecord: KlineRecord): KlinePrice {
		return klineRecord[Object.keys(klineRecord)[0]];
	}

	public static getKlineDate(klineRecord: KlineRecord): KlineDate {
		return Object.keys(klineRecord)[0];
	}

	public static exclude0229(kline: Kline): Kline {
		return kline.filter((klineRecord: KlineRecord) => !DataSource.getKlineDate(klineRecord).includes('02-29'));
	}

	public static getFilledGapsKline(kline: Kline, exclude0229: boolean = true): Kline {
		const output: Kline = [];
		let lastDate: KlineDate | null = null;
		let lastPrice: KlinePrice = 0;
		for (const klineRecord of kline) {
			if (!lastDate) {
				output.push(klineRecord);
				lastDate = DataSource.getKlineDate(klineRecord);
				lastPrice = DataSource.getKlinePrice(klineRecord);
				continue;
			}
			const diffPrice = DataSource.getKlinePrice(klineRecord) - lastPrice;
			const diffDate = diffDays(new Date(lastDate), new Date(DataSource.getKlineDate(klineRecord)));
			const direction = Math.sign(diffDate);
			for (let i = 1; i <= Math.abs(diffDate); i++) {
				const date = date2SQLstring(modifyDateTime(new Date(lastDate), ModifyDateTime.Days, i * direction));
				const price = lastPrice + diffPrice / diffDate * i * direction;
				output.push({ [date]: price });
			}
			lastDate = DataSource.getKlineDate(klineRecord);
			lastPrice = DataSource.getKlinePrice(klineRecord);
		}
		return exclude0229 ? this.exclude0229(output) : output;
	}

	public static getTruncatedKline(kline: Kline, dates: DatesInterval): Kline {
		const _dates = {
			from: dates.from ? date2SQLstring(dates.from) : '1971-02-17',
			to: dates.to ? date2SQLstring(dates.to) : '2071-02-17',
		};
		const result: Kline = [];
		for (const klineRecord of kline) {
			if ((this.getKlineDate(klineRecord) >= _dates.from) && (this.getKlineDate(klineRecord) <= _dates.to)) {
				result.push(Object.assign({}, klineRecord));
			}
		}
		return result;
	}

	public static getExposedKline(kline: Kline, exposeYears: number): Kline {
		const result: Kline = [];
		for (const klineRecord of kline) {
			const date = date2SQLstring(modifyDateTime(new Date(this.getKlineDate(klineRecord)), ModifyDateTime.Years, exposeYears));
			result.push({ [date]: this.getKlinePrice(klineRecord) });
		}
		return result;
	}

	public static getPatterns(args: {
		filledGapsTruncatedExposed: Kline[];
		averageTypes: AverageType[];
		depths: PatternDepth[],
		dates: DatesInterval
	}): Patterns {
		const average = {
			[AverageType.Mean]: (values: number[]): number => values.reduce((a, c) => a + c) / values.length,
			[AverageType.Median]: (values: number[]): number => {
				if (values.length % 2) {
					return values[Math.floor(values.length / 2)];
				} else {
					return (values[Math.floor(values.length / 2) - 1] + values[Math.floor(values.length / 2)]) / 2;
				}
			}
		};
		let patterns = {};
		const { filledGapsTruncatedExposed, averageTypes, depths, dates } = args;
		averageTypes.forEach((averageType: AverageType) => {
			(patterns as Patterns)[averageType] = {};
			depths.forEach((depth) => {
				(patterns as Patterns)[averageType][depth] = [];
			})
		});
		let currentDate = dates.from;
		while (currentDate <= dates.to) {
			const date = date2SQLstring(currentDate);
			const dateSlice = filledGapsTruncatedExposed.map((kline: Kline) => {
				const klineRecord = this.getKlineRecord(kline, date);
				return klineRecord ? this.getKlinePrice(klineRecord) : undefined;
			});
			averageTypes.forEach((averageType: AverageType) => {
				depths.forEach((depth) => {
					const depthSlice = dateSlice.slice(1, +depth + 1).sort((a, b) => (a - b));
					if ((depthSlice.length === +depth) && (depthSlice[depthSlice.length - 1] !== undefined)) {
						(patterns as Patterns)[averageType][depth].push({ [date]: average[averageType](depthSlice) });
					}
				})
			});
			currentDate = modifyDateTime(currentDate, ModifyDateTime.Days, 1);
		}
		averageTypes.forEach((averageType: AverageType) => {
			depths.forEach((depth) => {
				(patterns as Patterns)[averageType][depth] = this.exclude0229((patterns as Patterns)[averageType][depth]);
			})
		});
		return (patterns as Patterns);
	}

	public async getSpreadKline(formula: Formula, sortDirection: SortDirection = SortDirection.Asc): Promise<Kline> {
		const spread = new Spread(formula, this._connector);
		await spread.getLegsData();
		for (const leg of spread.legs) {
			leg.kline = await this.getContractKline(leg.contract, sortDirection);
		}
		if (spread.legs.length === 1) {
			return spread.legs[0].kline;
		}
		const kline: Kline = [];
		for (const klineRecord of spread.legs[0].kline) {
			const date = DataSource.getKlineDate(klineRecord);
			const prices: number[] = [];
			spread.legs.forEach((leg) => {
				const klineRecord = leg.kline.find(record => record[date] !== undefined);
				if (klineRecord) {
					prices.push(DataSource.getKlinePrice(klineRecord));
				}
			});
			const spreadValue = DataSource.calcSpreadValue(spread.legs, prices);
			if (spreadValue !== null) {
				kline.push({ [date]: spreadValue / spread.multiplier });
			}
		}
		return kline;
	}

	public async getContractKline(contract: string, sortDirection: SortDirection = SortDirection.Asc): Promise<Kline> {
		const select = `SELECT date, settle FROM settle WHERE contract = '${contract}' ORDER BY date ${sortDirection}`;
		const result = await this._connector.query(select);
		return result.map((row: { date: Date; settle: number }) => ({ [date2SQLstring(date2UTCdate(row.date))]: row.settle }));
	}

	public async getBactestIdByFormula(formula: Formula): Promise<{ b_id: number; depth: number }[]> {
		const select = `SELECT b_id, depth FROM backtests WHERE formula = '${formula}' ORDER BY depth DESC`;
		const result: Backtests[] = await this._connector.query(select);
		return result.map(({ b_id, depth }) => ({ b_id, depth }));
	}

	public async getBacktestData(bId: number): Promise<BacktestRecord[]> {
		const select = `SELECT side, win_percent, date_enter, date_exit, average_sm_pnl, average_sm_pnlpd FROM backtest_data WHERE b_id = ${bId} ORDER BY side, win_percent DESC, date_enter ASC, date_exit ASC`;
		const result = await this._connector.query(select);
		return result.map((row: { side: Side; win_percent: number; date_enter: Date; date_exit: Date; average_sm_pnl: number, average_sm_pnlpd: number }) => ({
			side: row.side,
			winPercent: row.win_percent,
			dateEnter: date2SQLstring(date2UTCdate(row.date_enter)),
			dateExit: date2SQLstring(date2UTCdate(row.date_exit)),
			pnl: row.average_sm_pnl,
			pnlpd: row.average_sm_pnlpd,
		}))
	}

	public async getTradeCommission(trade_id: number): Promise<number> {
		const select = `SELECT SUM(comm) as comm FROM trades_legs WHERE trade_id = ${trade_id}`;
		const commission = await this._connector.query(select);
		return commission.length > 0 ? commission[0].comm : 0;
	}

	public async getTabsDataOnDate(portfolioName: string, date: Date): Promise<TabsData> {
		let select = `SELECT tab_ids FROM portfolio WHERE name='${portfolioName}'`;
		const res = await this._connector.query(select);
		if (res.length === 0) {
			return null;
		}
		const tab_ids = res[0].tab_ids.split('|').join(',');
		select = `SELECT DISTINCT tab_id, formula FROM trades WHERE date <= '${date2SQLstring(date)}' AND tab_id IN (${tab_ids})`;
		const tabs = await this._connector.query(select);
		const tabsData: TabsData = {
			opened: [],
			closed: [],
		}
		for (const tab of tabs) {
			const { tab_id, formula } = tab;
			const spread = new Spread(formula, this._connector);
			await spread.getLegsData();
			const select = `SELECT trade_id, date, side, price, quantity FROM trades WHERE date <= '${date2SQLstring(date)}' AND tab_id = ${tab_id} ORDER BY date, time`;
			const trades: Partial<Trades>[] = await this._connector.query(select);
			const total = {
				qty: 0,
				value: 0,
				commission: 0,
			}
			for (const trade of trades) {
				const direction = trade.side === Side.Buy ? 1 : -1;
				total.qty += trade.quantity * direction;
				total.value += trade.price * trade.quantity * direction;
				total.commission += await this.getTradeCommission(trade.trade_id);
			}
			const tabData: TabData = {
				tab_id,
				formula,
				side: trades[0].side,
				commission: +total.commission.toFixed(2),
				openedAt: date2UTCdate(trades[0].date),
			}
			if (total.qty === 0) {
				tabsData.closed.push({
					...tabData,
					points: +total.value.toFixed(spread.comma),
					pnl: +(-total.value * spread.multiplier - tabData.commission).toFixed(2),
					closedAt: date2UTCdate(trades[trades.length - 1].date),
				})
			} else {
				const qty = Math.abs(total.qty);
				const adjustedPrice = total.value / total.qty + tabData.commission / total.qty / spread.multiplier;
				tabsData.opened.push({
					...tabData,
					qty,
					price: +(total.value / total.qty).toFixed(4),
					adjustedPrice,
				})
			}
		}
		return tabsData;
	}

	public async getLast(formula: Formula, date?: Date): Promise<number | null> {
		const kline = await this.getSpreadKline(formula, SortDirection.Desc);
		if (kline.length === 0) {
			return null;
		}
		if (!date) {
			return DataSource.getKlinePrice(kline[0]);
		} else {
			const klineRecord = kline.find(_klineRecord => DataSource.getKlineDate(_klineRecord) <= date2SQLstring(date));
			if (!klineRecord) {
				return null;
			} else {
				return DataSource.getKlinePrice(klineRecord);
			}
		}
	}

	public async getPnlLines(portfolioName: string, startDate: Date, endDate: Date): Promise<{ total: Kline; closed: Kline }> {
		const select = `SELECT * FROM pnl_reports WHERE name = '${portfolioName}' AND date >= '${date2SQLstring(startDate)}' AND date <= '${date2SQLstring(endDate)}' ORDER BY date ASC`;
		const result: PnLReports[] = await this._connector.query(select);
		const total: Kline = result.map((row) => ({ [date2SQLstring(date2UTCdate(row.date))]: row.total }));
		const closed: Kline = result.map((row) => ({ [date2SQLstring(date2UTCdate(row.date))]: row.closed }));
		return { total, closed };
	}
}
