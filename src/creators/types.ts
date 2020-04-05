import { Side } from "../data-service/constants";
import { Formula } from "../data-service/types";

export type TablesPortfolioReport = {
	tableOpened: string;
	tableClosed: string;
	formulasOpened: {
		formula: Formula;
		side?: Side;
		price?: string;
	}[];
};

export type TableOpenedData = {
	tab_id: number;
	formula: string;
	opened: string;
	side: Side;
	qty: number;
	price: string;
	last: string;
	pnl: string;
	commission: number;
	day: {
		points: string;
		pnl?: string;
	};
	week: {
		points: string;
		pnl?: string;
	};
	description: string;
	value: number;
	total: {
		pnl: number;
		day: number;
		week: number;
	}
}

export type TableClosedData = {
	tab_id: number;
	formula: string;
	opened: string;
	closed: string;
	side: Side;
	commission: number;
	value: number;
	pnl: string;
}

export type TableClusters = {
	tableClusters: string;
	formulasClusters: Formula[];
};
