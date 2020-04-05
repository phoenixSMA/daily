import { Side } from "../data-service/constants";
import { BacktestLineColor } from "./types";

export const backtestLineColor = (side: Side, winPercent: number): BacktestLineColor => {
	if (winPercent === 100) {
		return 'darkgoldenrod';
	} else if (winPercent >= 90) {
		return side === Side.Buy ? 'blue' : 'red';
	}
	return side === Side.Buy ? 'dodgerblue' : 'hotpink';
};
