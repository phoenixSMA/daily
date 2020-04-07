import express from 'express';
import { createPortfolioReport } from "./creators/create-portfolio-report";
import { createClustersDigest } from "./creators/create-clusters-digest";
import { DatesInterval } from "./data-service/types";
import { modifyDateTime } from "./helpers/utils";
import { ModifyDateTime } from "./helpers/constants";

process.env.initiator = 'server';
process.env.rewrite = 'true';

const app = express();

app.use('/img', express.static(__dirname + '/img'));

app.get("/portfolio", async (request, response) => {
	const portfolio = 'AO.2020';
	const { htmlReport } = await createPortfolioReport(portfolio);
	response.send(htmlReport);
});

app.get('/weekly', async (request, response) => {
	const code = 'C';
	const dates: DatesInterval = {
		from: modifyDateTime(new Date(), ModifyDateTime.Days, 2),
		to: modifyDateTime(new Date(), ModifyDateTime.Days, 8),
	};
	const { htmlReport } = await createClustersDigest(code, dates);
	response.send(htmlReport);
});

app.listen(3333);
