import nodemailer from 'nodemailer';
import { createWeeklyClustersDigest } from "./creators/create-weekly-clusters-digest";
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
	// const codes = ['C'];

	const dates: DatesInterval = {
		from: modifyDateTime(new Date(), ModifyDateTime.Days, 2),
		to: modifyDateTime(new Date(), ModifyDateTime.Days, 8),
	};

	for (const code of codes) {
		const subject = `"${code}" Weekly Digest`;
		const { htmlReport, attachments } = await createWeeklyClustersDigest(code, dates);

		const mailOptions = {
			from: 'phoenixsma@gmail.com',
			to: 'phoenixsma@gmail.com',
			subject,
			text: 'Report',
			html: htmlReport,
			attachments,
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('Email sent: ' + info.response);
	}

})();
