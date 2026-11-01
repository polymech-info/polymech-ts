"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = void 0;
const index_1 = require("../../index");
const nodemailer_1 = require("nodemailer");
const osr_commons_1 = require("@plastichub/osr-commons");
const read_1 = require("@plastichub/fs/read");
const sendHtmlEmail = async ({ from, to, subject, html, attachments }, transport) => {
    try {
        const transporter = (0, nodemailer_1.createTransport)({
            ...transport
        });
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html,
            attachments
        });
        index_1.logger.info(`Message sent: ${info.messageId}`);
        return info;
    }
    catch (error) {
        index_1.logger.error(`Error occurred: ${error.message}`);
        index_1.logger.trace(error);
    }
};
const test = async (options) => {
    const config = (0, osr_commons_1.CONFIG_DEFAULT)();
    index_1.logger.setSettings({ minLevel: options.logLevel || 'info' });
    const transport = config?.email[options.transport];
    if (!transport) {
        index_1.logger.error(`No email transport configuration found : ${options.transport}`);
        return false;
    }
    if (!options.html && options.src && options.srcInfo) {
        options.html = (0, read_1.sync)(options.src, 'string') || '<h1>Test Email</h1>';
    }
    index_1.logger.info(`Sending email from ${options.from} to ${options.to}`);
    return sendHtmlEmail({
        from: options.from,
        to: options.to,
        subject: options.subject || 'Test Email',
        html: options.html || '<h1>Test Email</h1>',
        attachments: options.attachments
    }, transport);
};
exports.test = test;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL25vZGVtYWlsZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUNBQW9DO0FBQ3BDLDJDQUE2RDtBQUM3RCx5REFBd0Q7QUFDeEQsOENBQWtEO0FBRWxELE1BQU0sYUFBYSxHQUFHLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQW1CLEVBQUUsU0FBNEIsRUFBRSxFQUFFO0lBQ3BILElBQUk7UUFDQSxNQUFNLFdBQVcsR0FBRyxJQUFBLDRCQUFlLEVBQUM7WUFDaEMsR0FBRyxTQUFTO1NBQ2YsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsUUFBUSxDQUFDO1lBQ3BDLElBQUk7WUFDSixFQUFFO1lBQ0YsT0FBTztZQUNQLElBQUk7WUFDSixXQUFXO1NBQ2QsQ0FBQyxDQUFBO1FBQ0YsY0FBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7UUFDOUMsT0FBTyxJQUFJLENBQUE7S0FDZDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ1osY0FBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEQsY0FBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUN0QjtBQUNMLENBQUMsQ0FBQTtBQUVNLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxPQUFpQixFQUFFLEVBQUU7SUFDNUMsTUFBTSxNQUFNLEdBQVEsSUFBQSw0QkFBYyxHQUFFLENBQUE7SUFDcEMsY0FBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVEsRUFBQyxPQUFPLENBQUMsUUFBZSxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUE7SUFDbEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFzQixDQUFBO0lBQ3ZFLElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDWixjQUFNLENBQUMsS0FBSyxDQUFDLDRDQUE0QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtRQUM3RSxPQUFPLEtBQUssQ0FBQTtLQUNmO0lBQ0QsSUFBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ2hELE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBQyxRQUFRLENBQVcsSUFBSSxxQkFBcUIsQ0FBQTtLQUMvRTtJQUNELGNBQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLE9BQU8sQ0FBQyxJQUFJLE9BQU8sT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDbEUsT0FBTyxhQUFhLENBQUM7UUFDakIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1FBQ2xCLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTtRQUNkLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLFlBQVk7UUFDeEMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUkscUJBQXFCO1FBQzNDLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztLQUNuQyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ2pCLENBQUMsQ0FBQTtBQW5CWSxRQUFBLElBQUksUUFtQmhCIn0=