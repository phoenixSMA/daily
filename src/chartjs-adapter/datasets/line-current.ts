import { Kline } from "../../data-service/types";
import { ChartDataSets } from "chart.js";
import { DataSource } from "../../data-service/data-source";
import { spreadsColors } from "../constants";

export const lineCurrent = (kline: Kline): ChartDataSets => {
	return {
		type: `line`,
		label: `Current`,
		data: kline.map((klineRecord) => ({
			x: DataSource.getKlineDate(klineRecord),
			y: DataSource.getKlinePrice(klineRecord),
		})),
		borderColor: spreadsColors[0],
		backgroundColor: spreadsColors[0],
		fill: false,
		lineTension: 0,
		borderJoinStyle: 'round',
		borderWidth: 4,
		pointRadius: 0,
		pointHoverRadius: 1,
		hideInLegendAndTooltip: false,
		yAxisID: 'Yaxis1',
	};
};
