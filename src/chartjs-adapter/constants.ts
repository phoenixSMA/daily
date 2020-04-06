import { AverageType } from "../data-service/constants";

export const spreadsColors = {
	0: 'black',
	1: 'firebrick',
	2: 'crimson',
	3: 'tomato',
	4: 'coral',
	5: 'red',
	6: 'darkgreen',
	7: 'forestgreen',
	8: 'seagreen',
	9: 'springgreen',
	10: 'green',
	11: 'midnightblue',
	12: 'royalblue',
	13: 'dodgerblue',
	14: 'deepskyblue',
	15: 'blue',
};

export const patternsColors = {
	[AverageType.Mean]: {
		[String(5)]: 'red',
		[String(10)]: 'green',
		[String(15)]: 'blue',
	},
	[AverageType.Median]: {
		[String(5)]: 'darkred',
		[String(10)]: 'darkgreen',
		[String(15)]: 'navy',
	}
};

export enum ValueType {
	'Pnl'='pnl',
	"Pnlpd"= 'pnlpd',
}
