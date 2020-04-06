import { Attachment } from "nodemailer/lib/mailer";
import { getTableClusters } from "./html/table-clusters";
import { cleanDir, date2SQLstring } from "../helpers/utils";
import { CanvasRenderService } from "chartjs-node-canvas";
import * as fs from "fs";
import { getBacktestChartJSConfig, Limits } from "../chartjs-adapter/backtest-chart";
import { ChartConfiguration } from "chart.js";
import { scattersSpacers } from "../chartjs-adapter/datasets/scatters-spacers";
import { getPatternsBacktestChartJSConfig } from "../chartjs-adapter/patterns-backtest-chart";
import { DatesInterval } from "../data-service/types";

export const createWeeklyClustersDigest = async (code: string, dates: DatesInterval): Promise<{
	htmlReport: string;
	attachments: Attachment[],
}> => {
	const server = process.env.initiator === 'server';
	const rewrite = process.env.rewrite ? JSON.parse(process.env.rewrite) : true;
	console.log('process.env.initiator:', process.env.initiator);
	console.log('process.env.rewrite:', process.env.rewrite);
	const { tableClusters, formulasClusters } = await getTableClusters(code, dates);
	const attachments: Attachment[] = [];
	const embedded: string[] = [];
	const prefix = 'weekly-clusters-digest';
	if (rewrite) {
		cleanDir('src/img', prefix);
	}
	let width: number;
	let height: number;
	console.log(formulasClusters.length);
	for (const idx in formulasClusters) {
		width = 1600;
		height = 300;
		const formula = formulasClusters[idx];
		console.log(formula);
		let embedPart = `<br><a href="#888" name="${idx}" id="${idx}">${formula}</a>`;
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
			if (rewrite) {
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
				console.log(`Writing "${relativePath}"`);
				fs.writeFileSync(relativePath, image);
			}
		}
		width = 1600;
		height = 900;
		const filename = `${prefix}.patterns.${idx}.jpg`;
		const relativePath = `src/img/${filename}`;
		const cid = `patterns-${idx}`;
		const imgSrc = server ? `img/${filename}` : `cid:${cid}`;
		embedded.push(`${embedPart}<br><img src="${imgSrc}" alt="${cid}">`);
		if (rewrite) {
			const canvasRenderService = new CanvasRenderService(width, height);
			const config = await getPatternsBacktestChartJSConfig(formula);
			const image = await canvasRenderService.renderToBuffer(config);
			console.log(`Writing "${relativePath}"`);
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

	return {
		htmlReport: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weekly Digest</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      padding: 0;
      margin: 0;
      background: #eee;
      color: black;
      height: 100vh;
    }
    table {
      border-collapse: collapse;
      font-size: 10px;
      table-layout: fixed;
    }
    td, th {
      border: 1px solid darkgray;
      text-align: center;
      padding: 1px 3px;
      white-space: nowrap;
      color: black;
      vertical-align: center;
    }
    td a {
    	text-decoration: none;
    	color: inherit;
    }
    .sell-row {
      background-color: #eed4d4;
    }
    .buy-row {
      background-color: #d4eed4;
    }
    .al-r {
      text-align: right;
    }
    .loss {
      color: red;
    }
    .profit {
      color: darkgreen;
    }
  </style>
</head>
<body>
<div style="color: black; font-size: 12px; font-weight: bold" id="888" name="888">"${code}": ${date2SQLstring(dates.from)} - ${date2SQLstring(dates.to)}</div>
${tableClusters}
${embedded.join('')}
</body>
</html>`,
		attachments,
	};
};
