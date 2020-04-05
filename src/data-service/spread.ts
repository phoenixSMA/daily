import { DatesInterval, Formula, Formula2LegsResult, Leg } from "./types";
import { Side, SpreadType } from "./constants";
import { MySQLConnector } from "../connectors/mysql-connector";
import { correctMySQLDateTime, monthCode2Number } from "../helpers/utils";

export class Spread {
	private readonly _originalFormula: string;
	private readonly _qty: number;
	private readonly _side: Side;
	private readonly _legs: Leg[] = [];
	private readonly _formula: Formula;
	private readonly _spreadType: SpreadType;
	private _searchMask: string;

	constructor(formula: string, connector?: MySQLConnector) {
		this._connector = connector;
		this._originalFormula = formula;
		const result = Spread.formula2Legs(formula);
		if (!result.message) {
			this._legs = result.legs;
			this._formula = result.formula;
			this._side = result.spreadSide;
			this._qty = result.spreadQty;
			this._spreadType = result.spreadType;
		} else {
			throw result.message;
		}
	}

	get spreadType() {
		return this._spreadType;
	}

	private _comma: number;

	get comma() {
		return this._comma;
	}

	get originalFormula() {
		return this._originalFormula;
	}

	private _multiplier: number;

	get multiplier() {
		return this._multiplier;
	}

	private _connector?: MySQLConnector;

	set connector(connector: MySQLConnector) {
		this._connector = connector;
	}

	get qty() {
		return this._qty;
	}

	get side() {
		return this._side;
	}

	get legs() {
		return this._legs;
	}

	get formula() {
		return this._formula;
	}

	public static formula2Legs(formula: Formula): Formula2LegsResult {
		formula = Spread._cleanFormula(formula);
		const result: Formula2LegsResult = {
			formula,
			legs: [],
			spreadSide:
			Side.Buy,
			spreadQty: 1,
		};
		let legs = formula.split('-')
			.map(el => el.split('+'))
			.flat()
			.filter(el => el.length > 0)
			.map(contract => ({ contract, code: '', month: '', year: 0, side: Side.Buy, qty: 1 }));
		for (const leg of legs) {
			let { contract } = leg;
			const idx = formula.indexOf(contract);
			(idx > 0) && (formula[idx - 1] === '-') && (leg.side = Side.Sell);
			const split = contract.split('*');
			if (split.length > 1) {
				if ((split.length > 2) || (isNaN(+split[0]) && isNaN(+split[1]))) {
					result.message = `Error: Can't split contract "${contract}"`;
					return result;
				}
				if (!isNaN(+split[0])) {
					leg.qty = +split[0];
					leg.contract = split[1];
				} else {
					leg.qty = +split[1];
					leg.contract = split[0];
				}
			}
			({ contract } = leg);
			if (contract.length < 6) {
				result.message = `Error: Can't parse contract "${contract}" - contract length < 6`;
				return result;
			} else if (isNaN(+contract.substr(-4))) {
				result.message = `Error: Can't parse contract "${contract}" - year "${contract.substr(-4)}" is NaN`;
				return result;
			} else if (!'FGHKJKMNQUVXZ'.includes(contract.substr(-5, 1))) {
				result.message = `Error: Can't parse contract "${contract}" - month "${contract.substr(-5, 1)}" not found`;
				return result;
			}
			leg.year = +contract.substr(-4);
			leg.month = contract.substr(-5, 1);
			leg.code = contract.substr(0, contract.length - 5);
		}
		legs = legs.filter(leg => leg.qty > 0);
		if (legs.length === 0) {
			result.message = `Error: Can't parse formula "${formula}" - leg not extracted`;
			return result;
		}
		if (legs[0].side === Side.Sell) {
			result.spreadSide = Side.Sell;
			legs.forEach(leg => leg.side = leg.side === Side.Buy ? Side.Sell : Side.Buy);
		}
		const legsQty = legs.map(leg => leg.qty);
		const minQty = Math.min(...legsQty);
		if (minQty > 1) {
			let spreadQty = 1;
			for (let deli = 2; deli <= minQty; deli++) {
				if (legsQty.every(qty => (qty % deli === 0))) {
					spreadQty = deli;
				}
			}
			if (spreadQty > 1) {
				result.spreadQty = spreadQty;
				legs.forEach(leg => leg.qty = leg.qty / spreadQty);
			}
		}
		switch (legs.length) {
			case 1:
				result.spreadType = SpreadType.Single;
				break;
			case 2:
				if (legs[0].code === legs[1].code) {
					result.spreadType = SpreadType.Calendar;
				} else {
					result.spreadType = SpreadType.InterComodity;
				}
				break;
			case 3:
				result.spreadType = SpreadType.Butterfly;
				break;
			case 4:
				result.spreadType = SpreadType.Condor;
				break;
			default:
				result.spreadType = SpreadType.Other;
				break;
		}
		return { ...result, formula: Spread.legs2Formula(legs), legs };
	}

	public static legs2Formula(legs: Leg[]): Formula {
		let formula = '';
		for (const leg of legs) {
			(leg.side === Side.Sell) && (formula += '-');
			(formula.length !== 0) && (leg.side === Side.Buy) && (formula += '+');
			(leg.qty > 1) && (formula += leg.qty + '*');
			formula += leg.code + leg.month + leg.year;
		}
		return formula;
	}

	private static _cleanFormula(formula: Formula): Formula {
		[' ', '\t', '\n'].forEach((needle: string) => {
			while (formula.indexOf(needle) > -1) {
				formula = formula.replace(needle, '');
			}
		});
		return formula;
	}

	public async getLegsData(): Promise<void> {
		if (this._legs.length === 0) {
			throw 'Error: spread legs not found';
		}
		if (!this._connector) {
			throw 'Error: No database connection';
		}
		const codes = this._legs.reduce((a, c): string[] => {
			if (!a.includes(c.code)) {
				a.push(c.code);
			}
			return a;
		}, []);
		for (const code of codes) {
			const select = `SELECT multiplier, comma, globex_code, price_step, listed_mask FROM futures WHERE code = '${code}'`;
			const res = (await this._connector.query(select))[0];
			const { multiplier, comma, globex_code, price_step, listed_mask } = res;
			for (let leg of this._legs) {
				if (leg.code === code) {
					leg = Object.assign(leg, { multiplier, comma, globex_code, price_step });
				}
			}
			if (this._legs[0].code) {
				this._searchMask = listed_mask + listed_mask;
			}
		}
		const multipliers = this._legs.reduce((a, c): string[] => {
			if (!a.includes(c.multiplier)) {
				a.push(c.multiplier);
			}
			return a;
		}, []);
		if (multipliers.length > 1) {
			this._multiplier = 1;
		} else {
			this._multiplier = multipliers[0];
		}
		this._comma = Math.max(...this._legs.map(leg => leg.comma));
		for (let leg of this.legs) {
			const select = `SELECT * FROM contracts WHERE contract = '${leg.contract}'`;
			const res = (await this._connector.query(select))[0];
			if (res) {
				leg.lastDate = res.first_notice ? correctMySQLDateTime(res.first_notice) : correctMySQLDateTime(res.expiry_date);
			} else {
				leg.lastDate = new Date('1971-02-17');
			}
		}
	}

	public getFormula(shift: number): Formula {
		const legs = this.legs.map((leg: Leg) => {
			const _leg = Object.assign({}, leg);
			_leg.year += shift;
			return _leg;
		});
		return Spread.legs2Formula(legs);
	}

	public getBaseInterval(): DatesInterval {
		return {
			from: new Date(this._legs[0].year - 1, monthCode2Number(this._legs[0].month)),
			to: this._legs[0].lastDate,
		}
	}

	public getSpreadWidth(): number {
		if (this._spreadType !== SpreadType.Calendar) {
			return 0;
		}
		const idx1 = this._searchMask.indexOf(this._legs[0].month);
		const idx2 = this._searchMask.indexOf(this._legs[1].month, idx1 + 1);
		return idx2 - idx1;
	}
}
