import nodemailer from 'nodemailer';
import { createReport } from "./creators/create-report";
import { mySQLDate2String } from "./helpers/utils";

(async () => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'phoenixsma@gmail.com',
			pass: 'S17m31a08'
		}
	});

	const portfolio = 'AO.2020';

	const htmlReport = await createReport(portfolio);

	const mailOptions = {
		from: 'phoenixsma@gmail.com',
		to: 'phoenixsma@gmail.com',
		subject: `${portfolio} ${mySQLDate2String()}`,
		text: 'Report',
		html: htmlReport,
		attachments: [{
			filename: 'image.jpg',
			path: 'src/image.jpg',
			cid: 'unique@nodemailer.com'
		}]
	};

	transporter.sendMail(mailOptions, function (error: Error, info: any) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});

})();

