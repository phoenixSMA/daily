import { Attachment } from "nodemailer/lib/mailer";
import { getTableClusters } from "./tables/table-clusters";
import { date2SQLstring } from "../helpers/utils";
import { DatesInterval } from "../data-service/types";
import { tripleChart } from "./charts/triple-chart";

export const createClustersDigest = async (code: string, dates: DatesInterval, topSlice?: number, onFire?: boolean): Promise<{
	htmlReport: string;
	attachments: Attachment[],
}> => {
	const { tableClusters, formulasClusters } = await getTableClusters(code, dates, topSlice, onFire);
	const topId = '888';
	const { embedded, attachments } = await tripleChart({
		prefix: 'clusters-digest',
		formulas: formulasClusters,
		topId,
	});

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
<div style="color: black; font-size: 12px; font-weight: bold" id="${topId}" name="${topId}">"${code}": ${date2SQLstring(dates.from)} - ${date2SQLstring(dates.to)}</div>
${tableClusters}
${embedded.join('')}
</body>
</html>`,
		attachments,
	};
};
