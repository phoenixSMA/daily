import { MySQLConnector } from "../connectors/mysql-connector";
import { Formula, Kline, KlineDate, KlinePrice, KlineRecord, Leg } from "./types";
import { Side, SortDirection } from "./constants";
import { mySQLDate2String } from "../helpers/utils";
import { Spread } from "./spread";

export class DataSource {
	private _connector: MySQLConnector;

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

	public static getKlinePrice(klineRecord: KlineRecord): KlinePrice {
		return klineRecord[Object.keys(klineRecord)[0]];
	}

	public static getKlineDate(klineRecord: KlineRecord): KlineDate {
		return Object.keys(klineRecord)[0];
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
		return result.map((row: { date: Date; settle: number }) => ({ [mySQLDate2String(row.date)]: row.settle }));
	}
}
