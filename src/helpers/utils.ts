import { ModifyDateTime } from "./constants";

export const date2SQLstring = (date: Date = new Date()): string => {
	return date.toLocaleDateString()
		.split('-')
		.map(el => el.length === 1 ? '0' + el : el)
		.join('-');
};

export const diffDays = (date1: Date, date2: Date): number => {
	return (date2.getTime() - date1.getTime()) / 24 / 60 / 60 / 1000;
};

export const correctMySQLDateTime = (date: Date): Date | null => {
	if (date === null) {
		return null;
	}
	return new Date(date.getTime() - (new Date().getTimezoneOffset()) * 60 * 1000);
};

export const modifyDateTime = (date: Date, modificator: ModifyDateTime, value: number): Date => {
	switch (modificator) {
		case ModifyDateTime.Years:
			return new Date(date.getFullYear() + value, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
		case ModifyDateTime.Months:
			return new Date(date.getFullYear(), date.getMonth() + value, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
		case ModifyDateTime.Days:
		case ModifyDateTime.Hours:
		case ModifyDateTime.Minutes:
		case ModifyDateTime.Seconds:
			return new Date(date.getTime() + modificator * value);
		default:
			return new Date(date);
	}
};

export const monthCode2Number = (monthCode: string) => {
	if (monthCode.length !== 1 || !'FGHJKMNQUVXZ'.includes(monthCode)) {
		throw `monthCode2Number: invalid month code ${monthCode}`;
	}
	return 'FGHJKMNQUVXZ'.indexOf(monthCode);

};

export const formatNumber = (number: number, fractionDigits?: number) => {
	const options: object = fractionDigits === undefined ? {} : {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	};
	return new Intl.NumberFormat('en-EN', options).format(number).split(',').join(' ');
};
