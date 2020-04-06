import { TableClusters } from "../types";
import { MySQLConnector } from "../../connectors/mysql-connector";
import { DatesInterval } from "../../data-service/types";
import { date2SQLstring, formatNumber } from "../../helpers/utils";
import { BacktestClusters, Backtests } from "../../chartjs-adapter/data-types";
import { Spread } from "../../data-service/spread";
import { Side } from "../../data-service/constants";

export const getTableClusters = async (code: string, dates: DatesInterval): Promise<TableClusters> => {
	const connector = new MySQLConnector();
	const maxWidth = ['NG', 'CL', 'HO', 'RB'].includes(code) ? 3 : 12;
	const select = `SELECT *, b.* from backtest_clusters JOIN backtests as b USING(b_id) WHERE LEFT(b.ind, LENGTH(b.ind) - 11) = '${code}' AND date_enter_from >= '${date2SQLstring(dates.from)}' AND date_enter_from <= '${date2SQLstring(dates.to)}' ORDER BY sum_pnlpd DESC`;
	const res: (Backtests & BacktestClusters)[] = await connector.query(select);
	const clusters = [];
	for (const cluster of res) {
		const spread = new Spread(cluster.formula, connector);
		await spread.getLegsData();
		if (spread.getSpreadWidth() <= maxWidth) {
			let select = `SELECT COUNT(*) as count FROM backtest_data WHERE c_id = ${cluster.c_id} AND win_percent = 100`;
			const win100 = (await connector.query(select))[0].count;
			select = `SELECT COUNT(*) as count FROM backtest_data WHERE c_id = ${cluster.c_id} AND win_percent < 100 AND win_percent >= 90`;
			const win90 = (await connector.query(select))[0].count;
			select = `SELECT COUNT(*) as count FROM backtest_data WHERE c_id = ${cluster.c_id} AND win_percent < 90 AND win_percent >= 80`;
			const win80 = (await connector.query(select))[0].count;
			const total = win100 + win90 + win80;
			clusters.push({ ...cluster, total, win100, win90, win80 });
		}
	}
	const formulasClusters = clusters.map(cluster => cluster.formula);
	const tbody = clusters.map(createRow).join('');
	const tableClusters = `<table>${thead}${tbody}</table>`;
	connector.disconnect();
	return { tableClusters, formulasClusters };
};

const thead = '<tr><th>Formula</th><th>Side</th><th>Depth</th><th>Enter from</th><th>Enter to</th><th>Exit from</th><th>Exit to</th><th>Total</th><th>Win 100%</th><th>Win 90%</th><th>Win 80%</th><th>Sum PnL</th><th>Sum PnLpD</th></tr>';

const createRow = (row: Backtests & BacktestClusters & { total: number; win100: number; win90: number; win80: number }, idx: number): string => {
	let tr = `<tr class="${row.side === Side.Buy ? 'buy-row' : 'sell-row'}">`;
	tr += `<td><a href="#${idx}">${row.formula}</a></td>`;
	tr += `<td>${row.side}</td>`;
	tr += `<td>${row.depth}</td>`;
	tr += `<td>${date2SQLstring(row.date_enter_from)}</td>`;
	tr += `<td>${date2SQLstring(row.date_enter_to)}</td>`;
	tr += `<td>${date2SQLstring(row.date_exit_from)}</td>`;
	tr += `<td>${date2SQLstring(row.date_exit_to)}</td>`;
	tr += `<td>${row.total}</td>`;
	tr += `<td>${row.win100}</td>`;
	tr += `<td>${row.win90}</td>`;
	tr += `<td>${row.win80}</td>`;
	tr += `<td class="al-r">${formatNumber(row.sum_pnl, 2)}</td>`;
	tr += `<td class="al-r">${formatNumber(row.sum_pnlpd, 2)}</td>`;
	tr += '</tr>';
	return tr;
};
