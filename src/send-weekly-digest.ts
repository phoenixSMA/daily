import nodemailer from 'nodemailer';
import { createClustersDigest } from "./creators/create-clusters-digest";
import { DatesInterval } from "./data-service/types";
import { modifyDateTime } from "./helpers/utils";
import { ModifyDateTime } from "./helpers/constants";

(async () => {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'phoenixsma@gmail.com',
			pass: 'S17m31a08'
		}
	});

	const codes = ['C', 'S', 'SM', 'BO', 'W', 'KW', 'LC', 'LN', 'FC', 'NG', 'CL', 'HO', 'RB'];
	// const codes = ['NG'];

	const dates: DatesInterval = {
		from: modifyDateTime(new Date(), ModifyDateTime.Days, 2),
		to: modifyDateTime(new Date(), ModifyDateTime.Days, 8),
	};

	for (const code of codes) {
		let subject = `"${code}" Weekly Digest Upcoming`;
		let { htmlReport, attachments } = await createClustersDigest(code, dates, 10, false);

		const mailOptions = {
			from: 'phoenixsma@gmail.com',
			to: 'phoenixsma@gmail.com',
			subject,
			text: 'Upcoming Report',
			html: htmlReport,
			attachments,
		};

		let info = await transporter.sendMail(mailOptions);
		console.log('Email sent: ' + info.response);

		subject = `"${code}" Weekly Digest On Fire`;
		({ htmlReport, attachments } = await createClustersDigest(code, dates, 10, true));

		mailOptions.subject = subject;
		mailOptions.text = 'On Fire Report';
		mailOptions.html = htmlReport;
		mailOptions.attachments = attachments;

		info = await transporter.sendMail(mailOptions);
		console.log('Email sent: ' + info.response);
	}

})();
