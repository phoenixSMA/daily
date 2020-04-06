import { ChartDataSets } from "chart.js";
import { Spacers } from "../types";

export const scattersSpacers = (spacers: Spacers, yAxisID: 'Yaxis1' | 'Yaxis2' = 'Yaxis1'): ChartDataSets => {
	return {
		type: 'scatter',
		data: [...spacers],
		borderColor: 'darkgoldenrod',
		backgroundColor: 'darkgoldenrod',
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 0,
		pointRadius: 0,
		pointHoverRadius: 0,
		hideInLegendAndTooltip: true,
		yAxisID,
	}
};
