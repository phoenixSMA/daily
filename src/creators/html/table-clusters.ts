import { TableClusters } from "../types";
import { MySQLConnector } from "../../connectors/mysql-connector";
import { DatesInterval } from "../../data-service/types";
import { date2SQLstring, formatNumber, modifyDateTime } from "../../helpers/utils";
import { ModifyDateTime } from "../../helpers/constants";
import { BacktestClusters, Backtests } from "../../chartjs-adapter/data-types";
import { Spread } from "../../data-service/spread";
import { Side } from "../../data-service/constants";

export const tableClusters = async (code: string): Promise<TableClusters> => {
	const connector = new MySQLConnector();
	const dates: DatesInterval = {
		from: modifyDateTime(new Date(), ModifyDateTime.Days, 1),
		to: modifyDateTime(new Date(), ModifyDateTime.Days, 7),
	};
	const maxWidth = 3;
	const select = `SELECT *, b.* from backtest_clusters JOIN backtests as b USING(b_id) WHERE LEFT(b.ind, LENGTH(b.ind) - 11) = '${code}' AND date_enter_from >= '${date2SQLstring(dates.from)}' AND date_enter_from <= '${date2SQLstring(dates.to)}' ORDER BY sum_pnlpd DESC`;
	const res: (Backtests & BacktestClusters)[] = await connector.query(select);
	const clusters = [];
	for (const cluster of res) {
		const spread = new Spread(cluster.formula, connector);
		await spread.getLegsData();
		if (spread.getSpreadWidth() <= maxWidth) {
			let select = `SELECT COUNT(*) as count FROM backtest_data WHERE c_id = ${cluster.c_id} AND win_percent = 100`;
			console.log(select);
			const win100 = (await connector.query(select))[0].count;
			select = `SELECT COUNT(*) as count FROM backtest_data WHERE c_id = ${cluster.c_id} AND win_percent < 100 AND win_percent >= 90`;
			console.log(select);
			const win90 = (await connector.query(select))[0].count;
			select = `SELECT COUNT(*) as count FROM backtest_data WHERE c_id = ${cluster.c_id} AND win_percent < 90 AND win_percent >= 80`;
			console.log(select);
			const win80 = (await connector.query(select))[0].count;
			const total = win100 + win90 + win80;
			clusters.push({ ...cluster, total, win100, win90, win80 });
		}
	}
	const tbody = clusters.map(createRow).join('');
	connector.disconnect();
	return `<table>${thead}${tbody}</table>`;
};

const thead = '<tr><th>Formula</th><th>Side</th><th>Depth</th><th>Enter from</th><th>Enter to</th><th>Exit from</th><th>Exit to</th><th>Total</th><th>Win 100%</th><th>Win 90%</th><th>Win 80%</th><th>Sum PnL</th><th>Sum PnLpD</th></tr>';

const createRow = (row: Backtests & BacktestClusters & { total: number; win100: number; win90: number; win80: number }): string => {
	let result = `<tr class="${row.side === Side.Buy ? 'buy-row' : 'sell-row'}">`;
	result += `<td>${row.formula}</td>`;
	result += `<td>${row.side}</td>`;
	result += `<td>${row.depth}</td>`;
	result += `<td>${date2SQLstring(row.date_enter_from)}</td>`;
	result += `<td>${date2SQLstring(row.date_enter_to)}</td>`;
	result += `<td>${date2SQLstring(row.date_exit_from)}</td>`;
	result += `<td>${date2SQLstring(row.date_exit_to)}</td>`;
	result += `<td>${row.total}</td>`;
	result += `<td>${row.win100}</td>`;
	result += `<td>${row.win90}</td>`;
	result += `<td>${row.win80}</td>`;
	result += `<td class="al-r">${formatNumber(row.sum_pnl, 2)}</td>`;
	result += `<td class="al-r">${formatNumber(row.sum_pnlpd, 2)}</td>`;
	result += '</tr>';
	return result;
};
