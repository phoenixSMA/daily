import express from 'express';
import { createPortfolioReport } from "./creators/create-portfolio-report";
import { createWeeklyClustersDigest } from "./creators/create-weekly-clusters-digest";

process.env.initiator = 'server';
process.env.rewrite = 'false';

const app = express();

app.use('/img', express.static(__dirname + '/img'));

app.get("/portfolio", async (request, response) => {
	const portfolio = 'AO.2020';
	const { htmlReport } = await createPortfolioReport(portfolio);
	response.send(htmlReport);
});

app.get('/weekly', async (request, response) => {
	const code = 'RB';
	const { htmlReport } = await createWeeklyClustersDigest(code);
	response.send(htmlReport);
});

app.listen(3333);
