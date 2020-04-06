import { ChartDataSets, ChartPoint } from 'chart.js';

export const scatterLast = (point: ChartPoint, options?: { borderWidth?: number; pointRadius?: number; yAxisID?: 'Yaxis1' | 'Yaxis2' }): ChartDataSets => {
	const { borderWidth = 4, pointRadius = 7, yAxisID = 'Yaxis1' } = options || {};
	return {
		type: `scatter`,
		label: `Last`,
		data: [point],
		borderColor: 'black',
		backgroundColor: 'darkgrey',
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth,
		pointRadius,
		pointHoverRadius: 4,
		hideInLegendAndTooltip: false,
		yAxisID,
	};
};
