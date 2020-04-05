import { ChartDataSets } from "chart.js";
import { date2SQLstring } from "../../helpers/utils";
import { Side } from "../../data-service/constants";
import { DatesInterval } from "../../data-service/types";

export const linePosition = (dates: DatesInterval, positionPrice: number, positionSide: Side): ChartDataSets =>{
	return {
		type: `line`,
		label: `Position`,
		data: [{
			x: date2SQLstring(dates.from),
			y: positionPrice,
		}, {
			x: date2SQLstring(dates.to),
			y: positionPrice,
		}],
		borderColor: positionSide === Side.Buy ? 'darkgreen' : 'darkred',
		backgroundColor: positionSide === Side.Buy ? 'darkgreen' : 'darkred',
		fill: false,
		lineTension: 0,
		borderDash: [5, 5],
		borderWidth: 4,
		pointRadius: 0,
		pointHoverRadius: 1,
		hideInLegendAndTooltip: false,
		yAxisID: 'Yaxis1',
	};
};
