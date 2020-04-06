import { MySQLConnector } from "../../connectors/mysql-connector";
import { TablesPortfolioReport, TableClosedData, TableOpenedData } from "../types";
import { Side, SortDirection } from "../../data-service/constants";
import { Spread } from "../../data-service/spread";
import { DataSource } from "../../data-service/data-source";
import { correctMySQLDateTime, date2SQLstring } from "../../helpers/utils";

export const tablesPortfolioReport = async (portfolio: string): Promise<TablesPortfolioReport> => {
	let formulasOpened: {
		formula: string;
		side?: Side;
		price?: string;
	}[] = [];
	const mySQLConnector = new MySQLConnector();
	const dataSource = new DataSource(mySQLConnector);
	let select = `SELECT tab_ids FROM portfolio WHERE name = "${portfolio}"`;
	const tabIds = (await mySQLConnector.query(select))[0].tab_ids
		.split('|')
		.join(',');
	select = `SELECT tab_id, formula, status, description FROM tabs WHERE tab_id IN (${tabIds}) ORDER BY formula`;
	const tabs = await mySQLConnector.query(select);
	const tableOpenedData: Partial<TableOpenedData> [] = tabs.filter((tab: any) => tab.status === 'OPENED');
	const tableClosedData: Partial<TableClosedData> [] = tabs.filter((tab: any) => tab.status === 'CLOSED');
	const total = {
		pnl: 0,
		day: 0,
		week: 0,
		commission: 0,
	};
	for (const tab of tableOpenedData) {
		const spread = new Spread(tab.formula, mySQLConnector);
		await spread.getLegsData();
		const kline = await dataSource.getSpreadKline(tab.formula, SortDirection.Desc);
		tab.qty = 0;
		tab.value = 0;
		tab.commission = 0;
		tab.opened = '';
		select = `SELECT * FROM trades WHERE tab_id = ${tab.tab_id} ORDER BY date, time`;
		const trades = await mySQLConnector.query(select);
		if (trades.length > 0) {
			tab.opened = date2SQLstring(correctMySQLDateTime(trades[0].date));
			for (const trade of trades) {
				const sign = trade.side === Side.Buy ? 1 : -1;
				tab.qty += trade.quantity * sign;
				tab.value += trade.price * trade.quantity * sign;
				select = `SELECT SUM(comm) as commission FROM trades_legs WHERE trade_id = ${trade.trade_id}`;
				tab.commission += Number((await mySQLConnector.query(select))[0].commission.toFixed(2));
			}
			tab.side = tab.qty > 0 ? Side.Buy : Side.Sell;
			tab.price = (tab.value / tab.qty + Math.sign(tab.qty) * tab.commission / tab.qty * Math.sign(tab.qty) / spread.multiplier).toFixed(4);
			tab.last = DataSource.getKlinePrice(kline[0]).toFixed(spread.comma);
			tab.pnl = ((+tab.last - +tab.price) * tab.qty * spread.multiplier).toFixed(2);
			total.pnl += +tab.pnl;
			tab.day = {
				points: (DataSource.getKlinePrice(kline[0]) - DataSource.getKlinePrice(kline[1])).toFixed(spread.comma),

			};
			tab.day.pnl = (+tab.day.points * tab.qty * spread.multiplier).toFixed(2);
			total.day += +tab.day.pnl;
			tab.week = {
				points: (DataSource.getKlinePrice(kline[0]) - DataSource.getKlinePrice(kline[5])).toFixed(spread.comma),
			};
			tab.week.pnl = (+tab.week.points * tab.qty * spread.multiplier).toFixed(2);
			total.week += +tab.week.pnl;
			tab.qty = Math.abs(tab.qty);
		}
		formulasOpened.push({
			formula: tab.formula,
			side: tab.side,
			price: tab.price,
		})
	}
	const tableOpenedFooter = createTableOpenedFooter(total);
	total.pnl = 0;
	for (const tab of tableClosedData) {
		const spread = new Spread(tab.formula, mySQLConnector);
		await spread.getLegsData();
		tab.opened = '';
		tab.closed = '';
		tab.value = 0;
		tab.commission = 0;
		select = `SELECT * FROM trades WHERE tab_id = ${tab.tab_id} ORDER BY date, time`;
		const trades = await mySQLConnector.query(select);
		if (trades.length > 0) {
			tab.opened = date2SQLstring(correctMySQLDateTime(trades[0].date));
			tab.closed = date2SQLstring(correctMySQLDateTime(trades[trades.length - 1].date));
			for (const trade of trades) {
				const sign = trade.side === Side.Buy ? 1 : -1;
				tab.value += trade.price * trade.quantity * sign;
				select = `SELECT SUM(comm) as commission FROM trades_legs WHERE trade_id = ${trade.trade_id}`;
				tab.commission += Number((await mySQLConnector.query(select))[0].commission.toFixed(2));
			}
			total.commission += tab.commission;
			tab.side = trades[0].side;
			tab.pnl = (-tab.value * spread.multiplier - tab.commission).toFixed(2);
			total.pnl += +tab.pnl;
		}
	}
	const tableClosedFooter = createTableClosedFooter(total);
	const tableOpened = `<tbody>${tableOpenedData.map(createTableOpenedRow).join('')}</tbody>${tableOpenedFooter}`;
	const tableClosed = `<tbody>${tableClosedData.map(createTableClosedRow).join('')}</tbody>${tableClosedFooter}`;
	mySQLConnector.disconnect();
	return { tableOpened, tableClosed, formulasOpened };
};

const createTableOpenedRow = (row: Partial<TableOpenedData>, aname: number): string => {
	let tr = `<tr class="${row.side === Side.Buy ? 'buy-row' : 'sell-row'}">`;
	tr += `<td><a href="#${aname}">${row.formula}</a></td>`;
	tr += `<td>${row.opened}</td>`;

	tr += `<td>${row.side}</td>`;
	tr += `<td>${row.qty}</td>`;
	tr += `<td class="al-r">${row.price}</td>`;
	tr += `<td class="al-r">${row.last}</td>`;
	tr += `<td class="al-r ${+row.pnl >= 0 ? 'profit' : 'loss'}">${row.pnl}</td>`;
	tr += `<td class="al-r">${row.day.points}</td>`;
	tr += `<td class="al-r ${+row.day.pnl >= 0 ? 'profit' : 'loss'}">${row.day.pnl}</td>`;
	tr += `<td class="al-r">${row.week.points}</td>`;
	tr += `<td class="al-r ${+row.week.pnl >= 0 ? 'profit' : 'loss'}">${row.week.pnl}</td>`;
	tr += `<td>${row.description}</td>`;
	tr += '</tr>';
	return tr;
};

const createTableOpenedFooter = (total: { pnl: number; day: number; week: number }): string => {
	let footer = `<tfoot><tr><th colspan="5" style="text-align: left"> Total</th>`;
	footer += `<th colspan="2" class="al-r ${total.pnl < 0 ? 'loss' : 'profit'}">${total.pnl.toFixed(2)}</th>`;
	footer += `<th colspan="2" class="al-r ${total.day < 0 ? 'loss' : 'profit'}">${total.day.toFixed(2)}</th>`;
	footer += `<th colspan="2" class="al-r ${total.week < 0 ? 'loss' : 'profit'}">${total.week.toFixed(2)}</th>`;
	footer += '<th></th></tfoot>';
	return footer;
};

const createTableClosedRow = (data: Partial<TableClosedData>): string => {
	let tr = `<tr class="${data.side === Side.Buy ? 'buy-row' : 'sell-row'}">`;
	tr += `<td>${data.formula}</td>`;
	tr += `<td>${data.opened}</td>`;
	tr += `<td>${data.closed}</td>`;
	tr += `<td>${data.side}</td>`;
	tr += `<td class="al-r">${data.commission.toFixed(2)}</td>`;
	tr += `<td class="al-r ${+data.pnl >= 0 ? 'profit' : 'loss'}">${data.pnl}</td>`;
	tr += '</tr>';
	return tr;
};

const createTableClosedFooter = (total: { pnl: number; commission: number }): string => {
	let footer = `<tfoot><tr><th colspan="4" style="text-align: left"> Total</th>`;
	footer += `<th class="al-r">${total.commission.toFixed(2)}</th>`;
	footer += `<th class="al-r ${total.pnl < 0 ? 'loss' : 'profit'}">${total.pnl.toFixed(2)}</th>`;
	return footer;
};
