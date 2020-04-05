import nodemailer from 'nodemailer';
import { createPortfolioReport } from "./creators/create-portfolio-report";
import { date2SQLstring } from "./helpers/utils";

(async () => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'phoenixsma@gmail.com',
			pass: 'S17m31a08'
		}
	});

	const portfolio = 'AO.2020';

	const { htmlReport, attachments } = await createPortfolioReport(portfolio);

	const mailOptions = {
		from: 'phoenixsma@gmail.com',
		to: 'phoenixsma@gmail.com',
		subject: `${portfolio} ${date2SQLstring()}`,
		text: 'Report',
		html: htmlReport,
		attachments,
	};

	transporter.sendMail(mailOptions, function (error: Error, info: any) {
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});

})();

