import { IOptions, ITransportOptions } from '../../types.js'
import { logger } from '../../index.js'
import { SendMailOptions, createTransport } from 'nodemailer'
import { CONFIG_DEFAULT } from '@polymech/commons'
import { sync as read } from '@polymech/fs/read'

const sendHtmlEmail = async ({ from, to, subject, html, attachments }: SendMailOptions, transport: ITransportOptions) => {
    try {
        const transporter = createTransport({
            ...transport
        })
        const info = await transporter.sendMail({
            from,
            to, // list of receivers
            subject, // Subject line
            html,
            attachments
        })
        logger.info(`Message sent: ${info.messageId}`)
        return info
    } catch (error) {
        logger.error(`Error occurred: ${error.message}`)
        logger.trace(error)
        throw error
    }
}

export const test = async (options: IOptions) => {
    const config: any = CONFIG_DEFAULT()
    logger.settings.minLevel = (options.logLevel as any || 'info')
    const transport = config?.email[options.transport] as ITransportOptions
    if (!transport) {
        throw new Error(`No email transport configuration found : ${options.transport}`)
    }
    if (!options.html && options.src && options.srcInfo) {
        options.html = read(options.src, 'string') as string || '<h1>Test Email</h1>'
    }
    logger.info(`Sending email from ${options.from} to ${options.to}`)
    return sendHtmlEmail({
        from: options.from,
        to: options.to,
        subject: options.subject || 'Test Email',
        html: options.html || '<h1>Test Email</h1>',
        attachments: options.attachments
    }, transport)
}