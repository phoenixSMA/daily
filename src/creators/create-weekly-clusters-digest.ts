import { Attachment } from "nodemailer/lib/mailer";
import { tableClusters } from "./html/table-clusters";

export const createWeeklyClustersDigest = async (code: string): Promise<{
	htmlReport: string;
	attachments: Attachment[],
}> => {
	const attachments: Attachment[] = [];
	const table = await tableClusters(code);
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
${table}
</body>
</html>`,
		attachments,
	};
};
