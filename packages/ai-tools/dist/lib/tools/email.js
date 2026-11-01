"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tools = exports.md2html = void 0;
const path_1 = __importDefault(require("path"));
const showdown_1 = require("showdown");
const nodemailer_1 = require("@polymech/osr-mail/lib/nodemailer");
const md2html = (content) => {
    let converter = new showdown_1.Converter({
        tables: true
    });
    converter.setOption('literalMidWordUnderscores', 'true');
    return converter.makeHtml(content);
};
exports.md2html = md2html;
const sendOptions = (recipient = 'cgoflyn@gmail.com', subject, body = 'en') => {
    const contacts = Array.isArray(recipient) ? recipient : [recipient];
    return {
        from: 'PlasticHub <newsletter@osr-plastic.org>',
        transport: 'newsletter',
        subject,
        contacts,
        filter: true,
        query: null,
        to: null,
        source: body
    };
};
const __1 = require("../..");
const tools = (target, options) => {
    const logger = (0, __1.toolLogger)(path_1.default.parse(__filename).name, options);
    return [
        {
            type: 'function',
            function: {
                name: 'send_email',
                description: 'Sends an email',
                parameters: {
                    type: 'object',
                    properties: {
                        recipient: {
                            type: ['string', 'array'],
                            items: {
                                type: 'string'
                            },
                            description: 'The email address of the recipient(s). Can be a single email or an array of emails. For "me", use the default email address',
                        },
                        subject: {
                            type: 'string',
                            description: 'the subject',
                            optional: true
                        },
                        body: {
                            type: 'string',
                            description: 'Markdown formatted body of the email',
                            optional: true
                        }
                    },
                    required: ['url']
                },
                function: async (params) => {
                    logger.debug(`Tool::EMail:Send ${params.recipient}`);
                    const sendMail = async (recipients, subject, body, raw) => {
                        const recipientList = Array.isArray(recipients) ? recipients : [recipients];
                        for (const recipient of recipientList) {
                            if (!recipient) {
                                logger.error(`Invalid contact : ${recipient}`);
                                continue;
                            }
                            const opts = {
                                ...options,
                                from: 'PlasticHub <newsletter@osr-plastic.org>',
                                subject: subject,
                                transport: "newsletter",
                                to: recipient,
                                html: body,
                                attachments: [
                                    {
                                        content: raw,
                                        filename: 'body.md',
                                        contentDisposition: 'attachment',
                                    }
                                ],
                            };
                            return await (0, nodemailer_1.test)(opts);
                        }
                    };
                    const recipient = params.recipient === 'me' ? options.variables.DEFAULT_EMAIL || 'cgoflyn@gmail.com' : params.recipient;
                    sendMail(recipient, params.subject, (0, exports.md2html)(params.body), params.body);
                },
                parse: JSON.parse
            }
        }
    ];
};
exports.tools = tools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1haWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3Rvb2xzL2VtYWlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF1QjtBQUN2Qix1Q0FBb0M7QUFFcEMsa0VBQWdFO0FBR3pELE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDakMsSUFBSSxTQUFTLEdBQUcsSUFBSSxvQkFBUyxDQUFDO1FBQzVCLE1BQU0sRUFBRSxJQUFJO0tBQ2IsQ0FBQyxDQUFDO0lBQ0gsU0FBUyxDQUFDLFNBQVMsQ0FBQywyQkFBMkIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RCxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFBO0FBTlksUUFBQSxPQUFPLFdBTW5CO0FBRUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxZQUErQixtQkFBbUIsRUFBRSxPQUFlLEVBQUUsT0FBZSxJQUFJLEVBQUUsRUFBRTtJQUMvRyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEUsT0FBTztRQUNMLElBQUksRUFBRSx5Q0FBeUM7UUFDL0MsU0FBUyxFQUFFLFlBQVk7UUFDdkIsT0FBTztRQUNQLFFBQVE7UUFDUixNQUFNLEVBQUUsSUFBSTtRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsRUFBRSxFQUFFLElBQUk7UUFDUixNQUFNLEVBQUUsSUFBSTtLQUNiLENBQUE7QUFDSCxDQUFDLENBQUE7QUFFRCw2QkFBa0M7QUFDM0IsTUFBTSxLQUFLLEdBQUcsQ0FBQyxNQUFjLEVBQUUsT0FBa0IsRUFBYyxFQUFFO0lBQ3BFLE1BQU0sTUFBTSxHQUFHLElBQUEsY0FBVSxFQUFDLGNBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENB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