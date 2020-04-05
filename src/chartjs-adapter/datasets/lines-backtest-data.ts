import { ChartDataSets } from "chart.js";
import { BacktestRecord } from "../../data-service/types";
import { Side } from "../../data-service/constants";
import { date2SQLstring } from "../../helpers/utils";
import { backtestLineColor } from "../utils";
import { ValueTypes } from "../constants";

export const linesBacktestData = (backtestData: BacktestRecord[], valueType: ValueTypes, maxValue?: number): ChartDataSets[] =>{
	const datasets: ChartDataSets[] = backtestData.map((backtestRecord: BacktestRecord) => ({
		type: 'line',
		data: [{
			x: backtestRecord.dateEnter,
			y: 0,
		}, {
			x: backtestRecord.dateExit,
			y: backtestRecord.side === Side.Buy ? backtestRecord[valueType] : -backtestRecord[valueType],
		}],
		borderColor: backtestLineColor(backtestRecord.side, backtestRecord.winPercent),
		backgroundColor: backtestLineColor(backtestRecord.side, backtestRecord.winPercent),
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 1,
		pointRadius: 1,
		pointHoverRadius: 2,
		yAxisID: "Yaxis2",
	}));
	if (!maxValue) {
		maxValue = Math.max(...backtestData.map((backtestRecord: BacktestRecord) => backtestRecord[valueType]));
	}
	datasets.push({
		type: 'scatter',
		data: [{
			x: date2SQLstring(),
			y: -maxValue * 3,
		}, {
			x: date2SQLstring(),
			y: maxValue * 3,
		}],
		borderColor: 'darkgoldenrod',
		backgroundColor: 'darkgoldenrod',
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 0,
		pointRadius: 0,
		pointHoverRadius: 0,
		hideInLegendAndTooltip: true,
		yAxisID: "Yaxis2",
	});
	return datasets;
};
