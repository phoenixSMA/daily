import { tablesPortfolioReport } from "./tables/tables-portfolio-report";
import { CanvasRenderService } from "chartjs-node-canvas";
import { getPatternsBacktestChartJSConfig } from "../chartjs-adapter/patterns-backtest-chart";
import * as fs from "fs";
import { Attachment } from "nodemailer/lib/mailer";
import { cleanDir } from "../helpers/utils";

export const createPortfolioReport = async (portfolio: string): Promise<{
	htmlReport: string;
	attachments: Attachment[]
}> => {
	const server = process.env.initiator === 'server';
	const rewrite = process.env.rewrite ? JSON.parse(process.env.rewrite) : true;
	console.log('process.env.initiator:', process.env.initiator);
	console.log('process.env.rewrite:', process.env.rewrite);
	console.log('Creating tables...');
	const { tableOpened, tableClosed, formulasOpened } = await tablesPortfolioReport(portfolio);
	const prefix = 'portfolio-report';
	let embedded = '';
	const attachments = [];
	const width = 1600;
	const height = 900;
	if (rewrite) {
		cleanDir('src/img', prefix)
	}
	console.log('Total opened: ', formulasOpened.length);
	for (const cid in formulasOpened) {
		const { formula, side, price } = formulasOpened[cid];
		console.log(formula);
		const filename = `${prefix}.${cid}.jpg`;
		const relativePath = `src/img/${filename}`;
		const imgSrc = server ? `img/${filename}` : `cid:${cid}`;
		embedded += `<br><a href="#888" id="${cid}" name="${cid}">${formula}</a> (${side}@${price})<br><img src="${imgSrc}" alt="${cid}">`;
		if (rewrite) {
			const canvasRenderService = new CanvasRenderService(width, height);
			const config = await getPatternsBacktestChartJSConfig(formula, +price, side);
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
  <title>Report</title>
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
	<div style="color: black; font-size: 12px; font-weight: bold" id="888" name="888">OPENED</div>
	<table>
		<thead>
        	<tr><th>Spread</th><th>Date</th><th>Side</th><th>Q</th><th>Price</th><th>Last</th><th>Pnl</th><th colspan='2'>Day</th><th colspan='2'>Week</th><th>Description</th></tr>
    	</thead>
		${tableOpened}
	</table>
	<div style='color: black; font-size: 12px; font-weight: bold; margin-top: 10px'>CLOSED</div>
	<table>
		<thead>
  			<tr><th>Spread</th><th>Opened</th><th>Closed</th><th>Side</th><th>Comission</th><th>Pnl</th></tr>
  		</thead>
		${tableClosed}
	</table>
	${embedded}
	</body>
</html>`,
		attachments
	};
};
