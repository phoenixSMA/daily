import { Formula } from "../data-service/types";

export type Backtests = {
	b_id: number;
	datetime: Date;
	depth: number;
	duration_max: number;
	duration_min: number;
	formula: Formula;
	ind: string;
	length: number;
	min_lines: number;
	prec: number;
	win_percent: number;
	archive: boolean;
}

export type BacktestClusters = {
	c_id: number;
	b_id: number;
	count: number;
	date_enter_from: Date;
	date_enter_to: Date;
	date_exit_from: Date;
	date_exit_to: Date;
	side: string;
	sum_pnl: number;
	sum_pnlpd: number;
}

export type BacktestData = {
	id: number;
	b_id: number;
	c_id: number;
	side: string;
	date_enter: Date;
	date_exit: Date;
	duration: number;
	win: number;
	lose: number;
	total: number;
	win_percent: number;
	average_sm_pnl: number;
	average_sm_pnlpd: number;
	average_sm_drawdown: number;
	min_enter_price: number;
	min_exit_price: number;
	min_points: number;
	min_pnl: number;
	min_days: number;
	min_pnlpd: number;
	min_best: number;
	min_worst: number;
	min_drawdown: number;
	max_enter_price: number;
	max_exit_price: number;
	max_points: number;
	max_pnl: number;
	max_days: number;
	max_pnlpd: number;
	max_best: number;
	max_worst: number;
	max_drawdown: number;
	average_enter_price: number;
	average_exit_price: number;
	average_points: number;
	average_pnl: number;
	average_days: number;
	average_pnlpd: number;
	average_best: number;
	average_worst: number;
	average_drawdown: number;
	r_status: string;
	r_enter_date: Date | null;
	r_enter_price: number | null;
	r_exit_date: Date | null;
	r_exit_price: number | null;
	r_points: number | null;
	r_pnl: number | null;
	r_days: number | null;
	r_best_date: Date | null;
	r_best: number | null;
	r_worst_date: Date | null;
	r_worst: number | null;
	r_drawdown: number | null;
}
