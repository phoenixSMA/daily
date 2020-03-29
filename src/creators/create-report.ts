import { createTables } from "./html/create-tables";

export const createReport = async (portfolio: string) => {
	const { tableOpened, tableClosed, formulasOpened } = await createTables(portfolio);
	return `	
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title111</title>
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
	<div style="color: black; font-size: 12px; font-weight: bold">OPENED</div>
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
	</body>
</html>`;
};
