import { Formula } from "./types";
import { getPatternsBacktestChartJSConfig } from "../chartjs-adapter/patterns-backtest-chart";
import { CanvasRenderService } from "chartjs-node-canvas";
import * as fs from 'fs';
import { Side } from "./constants";

const testCreateReportChart = async (): Promise<void> => {
	const formula: Formula = 'RBZ2020-2*RBF2021+RBG2021';
	const width = 1600;
	const height = 900;
	const canvasRenderService = new CanvasRenderService(width, height);
	const config = await getPatternsBacktestChartJSConfig(formula, -0.1020, Side.Buy);
	const image = await canvasRenderService.renderToBuffer(config);
	fs.writeFileSync('src/img/image2.jpg', image);
};

(async () => {
	await testCreateReportChart();
})();
