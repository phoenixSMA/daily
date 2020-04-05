import { ChartDataSets, ChartPoint } from 'chart.js';
import { spreadsColors } from "../constants";

export const scatterLast = (point: ChartPoint): ChartDataSets => {
	return {
		type: `scatter`,
		label: `Last`,
		data: [point],
		borderColor: spreadsColors[0],
		backgroundColor: spreadsColors[0],
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 4,
		pointRadius: 7,
		pointHoverRadius: 4,
		hideInLegendAndTooltip: false,
		yAxisID: 'Yaxis1',
	};
};
