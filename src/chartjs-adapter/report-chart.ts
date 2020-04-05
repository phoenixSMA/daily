import { BacktestRecord, DatesInterval, Formula, Kline, Patterns } from "../data-service/types";
import { MySQLConnector } from "../connectors/mysql-connector";
import { DataSource } from "../data-service/data-source";
import { Spread } from "../data-service/spread";
import { AverageType, Side, SortDirection } from "../data-service/constants";
import { modifyDateTime } from "../helpers/utils";
import { ModifyDateTime } from "../helpers/constants";
import { ChartPoint } from "chart.js";
import { scatterLast } from "./datasets/scatter-last";
import { lineCurrent } from "./datasets/line-current";
import { linesPatterns } from "./datasets/lines-patterns";
import { linePosition } from "./datasets/line-position";
import { linesBacktestData } from "./datasets/lines-backtest-data";
import { ValueTypes } from "./constants";
import Chart = require("chart.js");

export const createReportChartJSConfig = async (formula: Formula, positionPrice?: number, positionSide?: Side): Promise<Chart.ChartConfiguration> => {
	const connector = new MySQLConnector();
	const dataSource = new DataSource(connector);
	const spread = new Spread(formula, connector);
	await spread.getLegsData();
	const data: Data = {
		spread,
		klines: {
			original: [],
			filledGaps: [],
			filledGapsTruncated: [],
			filledGapsTruncatedExposed: [],
		},
	};
	const averageTypes = [AverageType.Mean, AverageType.Median];
	const depths: string[] = [5, 10, 15].map(String);
	for (let i = 0; i < 16; i++) {
		const kline = await dataSource.getSpreadKline(spread.getFormula(-i), SortDirection.Asc);
		data.klines.original.push(kline);
		const filledGaps = DataSource.getFilledGapsKline(kline);
		data.klines.filledGaps.push(filledGaps);
		const dates: DatesInterval = spread.getBaseInterval();
		dates.from = modifyDateTime(dates.from, ModifyDateTime.Years, -i);
		dates.to = modifyDateTime(dates.to, ModifyDateTime.Years, -i);
		const filledGapsTruncated = DataSource.getTruncatedKline(filledGaps, dates);
		data.klines.filledGapsTruncated.push(filledGapsTruncated);
		const filledGapsTruncatedExposed = DataSource.getExposedKline(filledGapsTruncated, i);
		data.klines.filledGapsTruncatedExposed.push(filledGapsTruncatedExposed);
	}
	data.patterns = DataSource.getPatterns({
		filledGapsTruncatedExposed: data.klines.filledGapsTruncatedExposed,
		averageTypes,
		depths,
		dates: spread.getBaseInterval(),
	});

	const bIds = await dataSource.getBactestIdByFormula(formula);
	if (bIds.length > 0) {
		data.backtestData = await dataSource.getBacktestData(bIds[0]);
	}

	const config: Chart.ChartConfiguration = {
		data: {
			datasets: []
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			title: {
				display: true,
				text: `${formula} (Multiplier: ${spread.multiplier})`
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
						drawOnChartArea: true,
						color: 'rgba(0, 0, 0, 0.1)',
						zeroLineColor: "black",
						zeroLineWidth: 1
					},
					type: 'linear',
					display: true,
					position: "left",
					id: "Yaxis1",
					scaleLabel: {
						display: true,
						labelString: 'Price'
					}
				}, {
					gridLines: {
						drawOnChartArea: true,
						color: '#eee',
						zeroLineColor: 'rgba(0, 0, 0, 0.1)'
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

	const last: ChartPoint = {
		x: DataSource.getKlineDate(data.klines.filledGapsTruncated[0][data.klines.filledGapsTruncated[0].length - 1]),
		y: DataSource.getKlinePrice(data.klines.filledGapsTruncated[0][data.klines.filledGapsTruncated[0].length - 1]),
	};
	config.data.datasets.push(scatterLast(last));

	config.data.datasets.push(lineCurrent(data.klines.filledGapsTruncated[0]));

	config.data.datasets.push(...linesPatterns(data.patterns));

	if ((positionPrice !== undefined) && (positionSide !== undefined)) {
		const dates = spread.getBaseInterval();
		config.data.datasets.push(linePosition(dates, positionPrice, positionSide));
	}

	config.data.datasets.push(...linesBacktestData(data.backtestData, ValueTypes.Pnl));

	connector.disconnect();
	return config;
};

type Data = {
	spread: Spread;
	klines: {
		original?: Kline[];
		filledGaps?: Kline[];
		filledGapsTruncated?: Kline[];
		filledGapsTruncatedExposed?: Kline[];
	}
	patterns?: Patterns;
	backtestData?: BacktestRecord[];
}
