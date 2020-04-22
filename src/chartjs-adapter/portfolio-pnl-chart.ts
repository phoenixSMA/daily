import { MySQLConnector } from "../connectors/mysql-connector";
import Chart, { ChartConfiguration } from "chart.js";
import { ModifyDateTime } from "../helpers/constants";
import { date2SQLstring, modifyDateTime } from "../helpers/utils";
import { DataSource } from "../data-service/data-source";
import { Kline } from "../data-service/types";
import { Side } from "../data-service/constants";
import { Spread } from "../data-service/spread";

export const getPortfolioPnLChartJSConfig = async (portfolioName: string, startDate: Date, endDate: Date): Promise<ChartConfiguration | null> => {
	const connector = new MySQLConnector();
	const dataSource = new DataSource(connector);
	const savedPnLLines = await dataSource.getPnlLines(portfolioName, startDate, endDate);
	let correctedStartDate: Date;
	if (savedPnLLines.total.length) {
		const lastSavedDate = DataSource.getKlineDate(savedPnLLines.total[savedPnLLines.total.length - 1]);
		correctedStartDate = modifyDateTime(new Date(lastSavedDate), ModifyDateTime.Days, 1);
	} else {
		correctedStartDate = startDate;
	}
	const pnlLines: { total: Kline, closed: Kline } = {
		total: [],
		closed: [],
	};
	for (let currentDate = correctedStartDate; currentDate <= endDate; currentDate = modifyDateTime(currentDate, ModifyDateTime.Days, 1)) {
		console.log(currentDate);
		if ([0, 6].includes(currentDate.getDay())) {
			continue;
		}
		const tabsData = await dataSource.getTabsDataOnDate(portfolioName, currentDate);
		if (tabsData === null) {
			continue;
		}
		let openedPnL = 0;
		for (const tabData of tabsData.opened) {
			tabData.last = await dataSource.getLast(tabData.formula, currentDate);
			const spread = new Spread(tabData.formula, connector);
			await spread.getLegsData();
			const direction = tabData.side === Side.Buy ? 1 : -1;
			tabData.pnl = (tabData.last - tabData.adjustedPrice) * tabData.qty * direction * spread.multiplier;
			openedPnL += tabData.pnl;
		}
		let closedPnL = 0;
		for (const tabData of tabsData.closed) {
			closedPnL += tabData.pnl;
		}
		console.log(openedPnL);
		console.log(closedPnL);

		const lastValue = (kline: Kline) => DataSource.getKlinePrice(kline[kline.length - 1]);
		let isDifferent = false;
		if (pnlLines.total.length === 0) {
			if (savedPnLLines.total.length === 0) {
				isDifferent = true;
			} else {
				isDifferent = (lastValue(savedPnLLines.total).toFixed(2) !== (openedPnL + closedPnL).toFixed(2)) || (lastValue(savedPnLLines.closed).toFixed(2) !== closedPnL.toFixed(2));
			}
		} else {
			isDifferent = (lastValue(pnlLines.total).toFixed(2) !== (openedPnL + closedPnL).toFixed(2)) || (lastValue(pnlLines.closed).toFixed(2) !== closedPnL.toFixed(2));
		}
		if (isDifferent) {
			const date = date2SQLstring(currentDate)
			pnlLines.total.push({ [date]: +(openedPnL + closedPnL).toFixed(2) });
			pnlLines.closed.push({ [date]: +closedPnL.toFixed(2) });
		}
		// console.log(tabsData);
	}
	console.log(pnlLines);

	if (pnlLines.total.length) {
		let values = '';
		for (const kline of pnlLines.total) {
			const date = DataSource.getKlineDate(kline);
			const total = DataSource.getKlinePrice(kline);
			const closed = DataSource.getKlinePrice(DataSource.getKlineRecord(pnlLines.closed, date));
			values += `, ('${portfolioName}', '${date}', ${total}, ${closed})`
		}
		values = values.substr(2);
		const insert = `INSERT INTO pnl_reports (name, date, total, closed) VALUES ${values}`;
		console.log('insert result: ', await connector.query(insert));
	}

	pnlLines.total = savedPnLLines.total.concat(pnlLines.total);
	pnlLines.closed = savedPnLLines.closed.concat(pnlLines.closed);
	const startTotalValue = DataSource.getKlinePrice(pnlLines.total[0]);

	const config: Chart.ChartConfiguration = {
		data: {
			datasets: []
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			title: {
				display: true,
				text: `Portfolio "${portfolioName}"`
			},
			legend: {
				display: true,
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
					display: false,
					position: "left",
					id: "Yaxis1",
					scaleLabel: {
						display: false,
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

	config.data.datasets.push({
		type: `line`,
		label: `Total`,
		data: pnlLines.total.map((klineRecord) => ({
			x: DataSource.getKlineDate(klineRecord),
			y: (DataSource.getKlinePrice(klineRecord) - startTotalValue),
		})),
		borderColor: 'red',
		backgroundColor: 'red',
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 5,
		pointRadius: 0,
		pointHoverRadius: 1,
		hideInLegendAndTooltip: false,
		yAxisID: 'Yaxis2',
	});

	config.data.datasets.push({
		type: `line`,
		label: `Realized`,
		data: pnlLines.closed.map((klineRecord) => ({
			x: DataSource.getKlineDate(klineRecord),
			y: DataSource.getKlinePrice(klineRecord),
		})),
		borderColor: 'blue',
		backgroundColor: 'blue',
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 5,
		pointRadius: 0,
		pointHoverRadius: 1,
		hideInLegendAndTooltip: false,
		yAxisID: 'Yaxis2',
	});

	connector.disconnect();
	return config;
}
