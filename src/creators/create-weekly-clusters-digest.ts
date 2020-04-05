import { Attachment } from "nodemailer/lib/mailer";
import { getTableClusters } from "./html/table-clusters";
import * as fs from "fs";
import * as path from "path";

export const createWeeklyClustersDigest = async (code: string): Promise<{
	htmlReport: string;
	attachments: Attachment[],
}> => {
	const server = process.env.initiator === 'server';
	const rewrite = process.env.rewrite ? JSON.parse(process.env.rewrite) : true;
	console.log('process.env.initiator:', process.env.initiator);
	console.log('process.env.rewrite:', process.env.rewrite);
	const { tableClusters, formulasClusters } = await getTableClusters(code);
	const attachments: Attachment[] = [];
	const embedded: string[] = [];
	const prefix = 'weekly-clusters-digest';
	if (rewrite) {
		const dir = 'src/img';
		const files = await fs.promises.readdir(dir);
		for (const file of files) {
			if (file.includes(prefix)) {
				await fs.promises.unlink(path.join(dir, file));
			}
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
${tableClusters}
</body>
</html>`,
		attachments,
	};
};
