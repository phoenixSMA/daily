import { MySQLConnector } from "../connectors/mysql-connector";
import { DataSource } from "./data-source";
import { SortDirection } from "./constants";

(async () => {
	const connector = new MySQLConnector();
	const dataSource = new DataSource(connector);
	console.log(await dataSource.getSpreadKline('LCQ2020-LCZ2020', SortDirection.Desc));
	connector.disconnect();
})();
