"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.draft = void 0;
const imapflow_1 = require("imapflow");
async function getMessagesFromInboxWithFilter(imapConfig, fromAddress, toAddress) {
    const client = new imapflow_1.ImapFlow({
        host: imapConfig.host,
        port: imapConfig.port,
        secure: imapConfig.tls,
        auth: {
            user: imapConfig.user,
            pass: imapConfig.password
        }
    });
    try {
        // Connect to the IMAP server
        await client.connect();
        // Select and lock the INBOX
        let lock = await client.getMailboxLock('INBOX');
        try {
            // Search for messages where the 'from' address and 'to' address match the specified filters
            const searchCriteria = {
                from: fromAddress,
                to: toAddress
            };
            // Search for messages matching the criteria
            const messages = client.fetch({ from: fromAddress, to: toAddress }, { envelope: true, source: true });
            // Iterate through each filtered message and print details
            for await (let message of messages) {
                console.log('Message ID:', message.uid);
                console.log('From:', message.envelope?.from?.map(f => `${f.name} <${f.address}>`).join(', '));
                console.log('To:', message.envelope?.to?.map(f => `${f.name} <${f.address}>`).join(', '));
                console.log('Subject:', message.envelope?.subject);
                console.log('Date:', message.envelope?.date);
                // If you need the message body, you can access it from message.source
                console.log('Raw message source:', message.source.toString());
            }
        }
        finally {
            // Always release the lock
            lock.release();
        }
        // Log out and close the connection
        await client.logout();
    }
    catch (err) {
        console.error('Error fetching messages:', err);
        throw err;
    }
}
// Configuration for IMAP
const imapConfig = {
    host: 'imap.example.com',
    port: 993,
    auth: {
        user: 'your_email@example.com',
        pass: 'your_password'
    },
    secure: true
};
// Create a draft email
const draft = async (subject, html, options) => {
    const client = new imapflow_1.ImapFlow(options);
    try {
        await client.connect();
        await client.mailboxOpen('Drafts');
        const draftMessage = {
            envelope: {
                from: 'Your Name <your_email@example.com>',
                subject: subject
            },
            content: html,
            ...options
        };
        // Append the draft to the 'Drafts' folder
        await client.append('Drafts', draftMessage, { flags: ['\Draft'] });
        console.log('Draft created successfully.');
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        // Close the connection
        await client.logout();
        console.log('Connection ended.');
    }
};
exports.draft = draft;
/*
// Example usage
const config: ImapConfig = {
    user: 'your-email@example.com',
    password: 'your-password',
    host: 'imap.your-email-provider.com',
    port: 993,
    tls: true
};

const fromAddress = 'sender@example.com';
const toAddress = 'recipient@example.com';

getMessagesFromInboxWithFilter(config, fromAddress, toAddress)
    .then(() => {
        console.log('Finished fetching filtered messages.');
    })
    .catch(err => {
        console.error('Error:', err);
    });
*/ 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2ltYXAvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQW1DO0FBVW5DLEtBQUssVUFBVSw4QkFBOEIsQ0FBQyxVQUFzQixFQUFFLFdBQW1CLEVBQUUsU0FBaUI7SUFDeEcsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBUSxDQUFDO1FBQ3hCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtRQUNyQixJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7UUFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxHQUFHO1FBQ3RCLElBQUksRUFBRTtZQUNGLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtZQUNyQixJQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7U0FDNUI7S0FDSixDQUFDLENBQUM7SUFFSCxJQUFJO1FBQ0EsNkJBQTZCO1FBQzdCLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXZCLDRCQUE0QjtRQUM1QixJQUFJLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEQsSUFBSTtZQUNBLDRGQUE0RjtZQUM1RixNQUFNLGNBQWMsR0FBRztnQkFDbkIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEVBQUUsRUFBRSxTQUFTO2FBQ2hCLENBQUM7WUFFRiw0Q0FBNEM7WUFDNUMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUV0RywwREFBMEQ7WUFDMUQsSUFBSSxLQUFLLEVBQUUsSUFBSSxPQUFPLElBQUksUUFBUSxFQUFFO2dCQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxPQUFP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