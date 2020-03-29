import express from 'express';
import { createReport } from "./creators/create-report";

const app = express();

app.use("/", async (request, response) => {
	response.send(await createReport('AO.2020'));
});

app.listen(3333);
