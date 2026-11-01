import { logger } from '../../index.js';
import { createTransport } from 'nodemailer';
import { CONFIG_DEFAULT } from '@polymech/commons';
import { sync as read } from '@polymech/fs/read';
const sendHtmlEmail = async ({ from, to, subject, html, attachments }, transport) => {
    try {
        const transporter = createTransport({
            ...transport
        });
        const info = await transporter.sendMail({
            from,
            to, // list of receivers
            subject, // Subject line
            html,
            attachments
        });
        logger.info(`Message sent: ${info.messageId}`);
        return info;
    }
    catch (error) {
        logger.error(`Error occurred: ${error.message}`);
        logger.trace(error);
        throw error;
    }
};
export const test = async (options) => {
    const config = CONFIG_DEFAULT();
    logger.settings.minLevel = (options.logLevel || 'info');
    const transport = config?.email[options.transport];
    if (!transport) {
        throw new Error(`No email transport configuration found : ${options.transport}`);
    }
    if (!options.html && options.src && options.srcInfo) {
        options.html = read(options.src, 'string') || '<h1>Test Email</h1>';
    }
    logger.info(`Sending email from ${options.from} to ${options.to}`);
    return sendHtmlEmail({
        from: options.from,
        to: options.to,
        subject: options.subject || 'Test Email',
        html: options.html || '<h1>Test Email</h1>',
        attachments: options.attachments
    }, transport);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL25vZGVtYWlsZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFBO0FBQ3ZDLE9BQU8sRUFBbUIsZUFBZSxFQUFFLE1BQU0sWUFBWSxDQUFBO0FBQzdELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRWhELE1BQU0sYUFBYSxHQUFHLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQW1CLEVBQUUsU0FBNEIsRUFBRSxFQUFFO0lBQ3BILElBQUksQ0FBQztRQUNELE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQztZQUNoQyxHQUFHLFNBQVM7U0FDZixDQUFDLENBQUE7UUFDRixNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxRQUFRLENBQUM7WUFDcEMsSUFBSTtZQUNKLEVBQUUsRUFBRSxvQkFBb0I7WUFDeEIsT0FBTyxFQUFFLGVBQWU7WUFDeEIsSUFBSTtZQUNKLFdBQVc7U0FDZCxDQUFDLENBQUE7UUFDRixNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQTtRQUM5QyxPQUFPLElBQUksQ0FBQTtJQUNmLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNuQixNQUFNLEtBQUssQ0FBQTtJQUNmLENBQUM7QUFDTCxDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLE9BQWlCLEVBQUUsRUFBRTtJQUM1QyxNQUFNLE1BQU0sR0FBUSxjQUFjLEVBQUUsQ0FBQTtJQUNwQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFlLElBQUksTUFBTSxDQUFDLENBQUE7SUFDOUQsTUFBTSxTQUFTLEdBQUcsTUFBTSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFzQixDQUFBO0lBQ3ZFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO0lBQ3BGLENBQUM7SUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsRCxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBVyxJQUFJLHFCQUFxQixDQUFBO0lBQ2pGLENBQUM7SUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLHNCQUFzQixPQUFPLENBQUMsSUFBSSxPQUFPLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ2xFLE9BQU8sYUFBYSxDQUFDO1FBQ2pCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtRQUNsQixFQUFFLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDZCxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxZQUFZO1FBQ3hDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLHFCQUFxQjtRQUMzQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7S0FDbkMsRUFBRSxTQUFTLENBQUMsQ0FBQTtBQUNqQixDQUFDLENBQUEifQ==