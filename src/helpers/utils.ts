export const mySQLDate2String = (mySQLDate: Date) => {
	return mySQLDate.toLocaleDateString()
		.split('-')
		.map(el => el.length < 2 ? '0' + el : el)
		.join('-')
};
