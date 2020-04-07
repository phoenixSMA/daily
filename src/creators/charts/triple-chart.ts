import { Attachment } from "nodemailer/lib/mailer";
import { Formula } from "../../data-service/types";
import { cleanDir, date2SQLstring } from "../../helpers/utils";
import { getBacktestChartJSConfig, Limits } from "../../chartjs-adapter/backtest-chart";
import { ChartConfiguration } from "chart.js";
import * as fs from	"fs";
import { scattersSpacers } from "../../chartjs-adapter/datasets/scatters-spacers";
import { CanvasRenderService } from "chartjs-node-canvas";
import { getPatternsBacktestChartJSConfig } from "../../chartjs-adapter/patterns-backtest-chart";

/**
 * Создает тройной чарт-бандл: backtests-15-depth, backtests-10-depth, paterns-bactests
 * backtests чарты синхронизированы по по обоим осям
 * process.env.initiator === 'server' => для отображения на html странице на express-сервере
 * process.env.rewrite === false => не создавать новые .jpg поверх старых, использовать старые
 * @param params
 */
export const tripleChart = async (params: TripleChartParams): Promise<TripleChartResult> => {
	const { prefix, formulas, bactestsChartDimensions, patternsChartDimensions, topId } = params;
	const embedded: string[] = [];
	const attachments: Attachment[] = [];
	const server = process.env.initiator === 'server';
	const rewrite = process.env.rewrite ? JSON.parse(process.env.rewrite) : true;
	console.log('TripleChart > process.env.initiator:', process.env.initiator);
	console.log('process.env.rewrite:', process.env.rewrite);
	if (rewrite) {
		cleanDir('src/img', prefix);
	}
	console.log('TripleChart > Total chart-bundles to create:', formulas.length);
	for (const idx in formulas) {
		let { width = 1600, height = 300 } = bactestsChartDimensions || {};
		const formula = formulas[idx];
		console.log('TripleChart > formula:', formula);
		let embedPart = `<br><a href="#${topId}" name="${idx}" id="${idx}">${formula}</a>`;
		const totalLimits: Limits = {
			x: {
				min: new Date('20171-02-17'),
				max: new Date('1971-02-17'),
			},
			y: {
				min: Infinity,
				max: -Infinity,
			}
		};
		const configs: { config: ChartConfiguration; relativePath: string }[] = [];
		for (const depth of [15, 10]) {
			const filename = `${prefix}.backtest-data.${depth}.${idx}.jpg`;
			const relativePath = `src/img/${filename}`;
			const cid = `backtest-data-${idx}-${depth}`;
			const imgSrc = server ? `img/${filename}` : `cid:${cid}`;
			embedded.push(`${embedPart}<br><img src="${imgSrc}" alt="${cid}">`);
			embedPart = '';
			if (rewrite || !fs.existsSync(relativePath)) {
				const { config, limits } = await getBacktestChartJSConfig(formula, depth);
				if (config.data.datasets.length > 2) {
					configs.push({ config, relativePath });
					totalLimits.x.min = totalLimits.x.min < limits.x.min ? totalLimits.x.min : limits.x.min;
					totalLimits.x.max = totalLimits.x.max > limits.x.max ? totalLimits.x.max : limits.x.max;
					totalLimits.y.min = totalLimits.y.min < limits.y.min ? totalLimits.y.min : limits.y.min;
					totalLimits.y.max = totalLimits.y.max > limits.y.max ? totalLimits.y.max : limits.y.max;
				} else {
					embedded.pop();
				}
			}
			if (!server) {
				attachments.push({
					filename,
					path: relativePath,
					cid,
				})
			}
		}
		if (rewrite) {
			for (const data of configs) {
				const { config, relativePath } = data;
				config.data.datasets.push(scattersSpacers([{
						x: date2SQLstring(totalLimits.x.min),
						y: totalLimits.y.min,
					}, {
						x: date2SQLstring(totalLimits.x.max),
						y: totalLimits.y.max,
					}],
					'Yaxis2'));
				const canvasRenderService = new CanvasRenderService(width, height);
				const image = await canvasRenderService.renderToBuffer(config);
				console.log(`TripleChart > Writing "${relativePath}"`);
				fs.writeFileSync(relativePath, image);
			}
		}
		({width = 1600, height = 900} = patternsChartDimensions || {});
		const filename = `${prefix}.patterns.${idx}.jpg`;
		const relativePath = `src/img/${filename}`;
		const cid = `patterns-${idx}`;
		const imgSrc = server ? `img/${filename}` : `cid:${cid}`;
		embedded.push(`${embedPart}<br><img src="${imgSrc}" alt="${cid}">`);
		if (rewrite) {
			const canvasRenderService = new CanvasRenderService(width, height);
			const config = await getPatternsBacktestChartJSConfig(formula);
			const image = await canvasRenderService.renderToBuffer(config);
			console.log(`TripleChart > Writing "${relativePath}"`);
			fs.writeFileSync(relativePath, image);
		}
		if (!server) {
			attachments.push({
				filename,
				path: relativePath,
				cid,
			})
		}
	}
	return { embedded, attachments };
};

export type TripleChartParams = {
	prefix: string;
	formulas: Formula[];
	bactestsChartDimensions?: ChartDimensions;
	patternsChartDimensions?: ChartDimensions;
	topId: string;
}

export type ChartDimensions = {
	width: number;
	height: number;
};

export type TripleChartResult = {
	embedded: string[];
	attachments: Attachment[];
}
