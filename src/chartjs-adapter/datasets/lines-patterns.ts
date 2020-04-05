import { ChartDataSets } from "chart.js";
import { AverageType } from "../../data-service/constants";
import { DataSource } from "../../data-service/data-source";
import { Patterns } from "../../data-service/types";
import { patternsColors } from "../constants";

export const linesPatterns = (patterns: Patterns): ChartDataSets[] => {
	const datasets: ChartDataSets[] = [];
	const averageTypes = Object.keys(patterns);
	averageTypes.forEach((averageType: AverageType) => {
		const depths = Object.keys(patterns[averageType]);
		depths.forEach(depth => {
			const dataset: ChartDataSets = {
				type: `line`,
				label: `${averageType} ${depth}y`,
				data: patterns[averageType][depth].map((klineRecord) => ({
					x: DataSource.getKlineDate(klineRecord),
					y: DataSource.getKlinePrice(klineRecord),
				})),
				borderColor: patternsColors[averageType][depth] ? patternsColors[averageType][depth] : 'darkgrey',
				backgroundColor: patternsColors[averageType][depth] ? patternsColors[averageType][depth] : 'darkgrey',
				fill: false,
				lineTension: 0,
				borderJoinStyle: 'round',
				borderWidth: 2,
				pointRadius: 0,
				pointHoverRadius: 1,
				hideInLegendAndTooltip: false,
				yAxisID: 'Yaxis1',
			};
			datasets.push(dataset);
		})
	});
	return datasets;
};
