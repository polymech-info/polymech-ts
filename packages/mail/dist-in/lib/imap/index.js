import { ImapFlow } from 'imapflow';
export async function getMessagesFromInboxWithFilter(imapConfig, fromAddress, toAddress, subject) {
    const client = new ImapFlow({
        host: imapConfig.host,
        port: imapConfig.port,
        secure: imapConfig.tls,
        auth: {
            user: imapConfig.user,
            pass: imapConfig.password
        }
    });
    const results = [];
    try {
        await client.connect();
        let lock = await client.getMailboxLock('INBOX');
        try {
            const searchCriteria = {};
            if (fromAddress)
                searchCriteria.from = fromAddress;
            if (toAddress)
                searchCriteria.to = toAddress;
            if (subject)
                searchCriteria.subject = subject;
            // if no criteria, search all? or return empty? Let's assume search all if empty, or enforce at least one?
            // For now, if empty object, fetch might return everything.
            const messages = client.fetch(searchCriteria, { envelope: true, source: true });
            for await (let message of messages) {
                results.push({
                    uid: message.uid,
                    envelope: message.envelope,
                    source: message.source.toString()
                });
            }
        }
        finally {
            lock.release();
        }
        await client.logout();
        return results;
    }
    catch (err) {
        console.error('Error fetching messages:', err);
        throw err;
    }
}
// Create a draft email
export const draft = async (subject, html, options) => {
    const client = new ImapFlow(options);
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
        await client.append('Drafts', draftMessage, ['\\Draft']);
        console.log('Draft created successfully.');
    }
    catch (err) {
        console.error('Error:', err);
        throw err;
    }
    finally {
        // Close the connection
        await client.logout();
        console.log('Connection ended.');
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2ltYXAvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFVBQVUsQ0FBQTtBQVVuQyxNQUFNLENBQUMsS0FBSyxVQUFVLDhCQUE4QixDQUFDLFVBQXVCLEVBQUUsV0FBb0IsRUFBRSxTQUFrQixFQUFFLE9BQWdCO0lBQ3RJLE1BQU0sTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDO1FBQzFCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtRQUNyQixJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7UUFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxHQUFHO1FBQ3RCLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtZQUNyQixJQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7U0FDMUI7S0FDRixDQUFDLENBQUM7SUFFSCxNQUFNLE9BQU8sR0FBVSxFQUFFLENBQUM7SUFFMUIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFdkIsSUFBSSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQztZQUNILE1BQU0sY0FBYyxHQUFRLEVBQUUsQ0FBQztZQUMvQixJQUFJLFdBQVc7Z0JBQUUsY0FBYyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUM7WUFDbkQsSUFBSSxTQUFTO2dCQUFFLGNBQWMsQ0FBQyxFQUFFLEdBQUcsU0FBUyxDQUFDO1lBQzdDLElBQUksT0FBTztnQkFBRSxjQUFjLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUU5QywwR0FBMEc7WUFDMUcsMkRBQTJEO1lBRTNELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVoRixJQUFJLEtBQUssRUFBRSxJQUFJLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQztvQkFDWCxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7b0JBQ2hCLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtvQkFDMUIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO2lCQUNsQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0gsQ0FBQztnQkFBUyxDQUFDO1lBQ1QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxNQUFNLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QixPQUFPLE9BQU8sQ0FBQztJQUVqQixDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0MsTUFBTSxHQUFHLENBQUM7SUFDWixDQUFDO0FBQ0gsQ0FBQztBQUVELHVCQUF1QjtBQUN2QixNQUFNLENBQUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxFQUFFLE9BQWUsRUFBRSxJQUFZLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDcEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUE7SUFFcEMsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFdEIsTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBRWxDLE1BQU0sWUFBWSxHQUFHO1lBQ25CLFFBQVEsRUFBRTtnQkFDUixJQUFJLEVBQUUsb0NBQW9DO2dCQUMxQyxPQUFPLEVBQUUsT0FBTzthQUNqQjtZQUNELE9BQU8sRUFBRSxJQUFJO1lBQ2IsR0FBRyxPQUFPO1NBQ1gsQ0FBQTtRQUVELDBDQUEwQztRQUMxQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDN0IsTUFBTSxHQUFHLENBQUE7SUFDWCxDQUFDO1lBQVMsQ0FBQztRQUNULHVCQUF1QjtRQUN2QixNQUFNLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDbkMsQ0FBQztBQUNILENBQUMsQ0FBQSJ9