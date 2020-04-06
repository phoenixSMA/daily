import { ChartConfiguration } from "chart.js";
import { BacktestRecord, DatesInterval, Formula, Kline } from "../data-service/types";
import { MySQLConnector } from "../connectors/mysql-connector";
import { DataSource } from "../data-service/data-source";
import { Spread } from "../data-service/spread";
import { ValueType } from "./constants";
import { linesBacktestData } from "./datasets/lines-backtest-data";
import { scatterLast } from "./datasets/scatter-last";
import { correctMySQLDateTime, date2SQLstring } from "../helpers/utils";
import { lineCurrent } from "./datasets/line-current";

export const getBacktestChartJSConfig = async (formula: Formula, depth: number = 15, valueType: ValueType = ValueType.Pnl): Promise<{ config: ChartConfiguration; limits: Limits }> => {
	const connector = new MySQLConnector();
	const dataSource = new DataSource(connector);
	const spread = new Spread(formula, connector);
	await spread.getLegsData();
	const dates: DatesInterval = spread.getBaseInterval();
	const data: Data = {};

	const limits: Limits = {
		x: {
			min: dates.from,
			max: dates.to,
		},
		y: {
			min: Infinity,
			max: -Infinity,
		}
	};

	data.original = await dataSource.getSpreadKline(formula);
	data.truncated = DataSource.getTruncatedKline(data.original, dates);

	const result = (await dataSource.getBactestIdByFormula(formula)).filter(el => el.depth === depth);
	if (result.length > 0) {
		data.backtestData = await dataSource.getBacktestData(result[0].b_id);
		limits.y.max = data.backtestData.reduce((a, c) => (c[valueType] > a ? c[valueType] : a), 0);
		limits.y.min = -limits.y.max;
	} else {
		data.backtestData = [];
	}
	const config: ChartConfiguration = {
		data: {
			datasets: []
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			title: {
				display: true,
				text: formula,
			},
			legend: {
				display: false,
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						unit: 'day',
						displayFormats: {
							day: 'MMM D'
						}
					},
					display: true,
					scaleLabel: {
						display: true
					}
				}],
				yAxes: [{
					gridLines: {
						drawOnChartArea: false,
					},
					type: 'linear',
					display: true,
					position: "left",
					id: "Yaxis1",
					scaleLabel: {
						display: true,
						labelString: 'Price (Points)'
					}
				}, {
					gridLines: {
						drawOnChartArea: true,
						color: 'rgba(0, 0, 0, 0.1)',
						zeroLineColor: "black",
						zeroLineWidth: 1
					},
					type: 'linear',
					display: true,
					position: "right",
					id: "Yaxis2",
					scaleLabel: {
						display: true,
						labelString: 'PnL (USD)'
					}
				}]
			}
		}
	};

	config.data.datasets.push(lineCurrent(data.truncated, 1));
	config.data.datasets.push(scatterLast({
		x: date2SQLstring(correctMySQLDateTime(new Date())),
		y: 0
	}, { borderWidth: 2, pointRadius: 4, yAxisID: "Yaxis2" }));
	config.data.datasets.push(...linesBacktestData(data.backtestData, ValueType.Pnl, false));

	connector.disconnect();
	return { config, limits };
};

export type Limits = {
	x: {
		min: Date;
		max: Date;
	}
	y: {
		min: number;
		max: number;
	}
}

type Data = {
	original?: Kline;
	truncated?: Kline;
	backtestData?: BacktestRecord[];
}
