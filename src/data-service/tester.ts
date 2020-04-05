import { Formula } from "./types";
import { createReportChartJSConfig } from "../chartjs-adapter/report-chart";
import { CanvasRenderService } from "chartjs-node-canvas";
import * as fs from 'fs';
import * as path from 'path';
import { Side } from "./constants";
import { createWeeklyClustersDigest } from "../creators/create-weekly-clusters-digest";

const test1 = async (): Promise<void> => {
	const code = 'RB';
	console.log(await createWeeklyClustersDigest(code));
};

const testCreateReportChart = async (): Promise<void> => {
	const formula: Formula = 'NGM2020-2*NGN2020+NGQ2020';
	const width = 1600;
	const height = 900;
	const canvasRenderService = new CanvasRenderService(width, height);
	const config = await createReportChartJSConfig(formula, -0.1020, Side.Buy);
	const image = await canvasRenderService.renderToBuffer(config);
	const dir = 'src/img';
	const files = await fs.promises.readdir(dir);
	for (const file of files) {
		await fs.promises.unlink(path.join(dir, file));
	}
	fs.writeFileSync('src/img/image2.jpg', image);
};

(async () => {
	await test1();
})();
