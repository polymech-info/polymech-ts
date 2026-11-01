import { ImapFlow } from 'imapflow'

export interface IImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

export async function getMessagesFromInboxWithFilter(imapConfig: IImapConfig, fromAddress?: string, toAddress?: string, subject?: string): Promise<any[]> {
  const client = new ImapFlow({
    host: imapConfig.host,
    port: imapConfig.port,
    secure: imapConfig.tls,
    auth: {
      user: imapConfig.user,
      pass: imapConfig.password
    }
  });

  const results: any[] = [];

  try {
    await client.connect();

    let lock = await client.getMailboxLock('INBOX');

    try {
      const searchCriteria: any = {};
      if (fromAddress) searchCriteria.from = fromAddress;
      if (toAddress) searchCriteria.to = toAddress;
      if (subject) searchCriteria.subject = subject;

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
    } finally {
      lock.release();
    }

    await client.logout();
    return results;

  } catch (err) {
    console.error('Error fetching messages:', err);
    throw err;
  }
}

// Create a draft email
export const draft = async (subject: string, html: string, options) => {
  const client = new ImapFlow(options)

  try {
    await client.connect()

    await client.mailboxOpen('Drafts')

    const draftMessage = {
      envelope: {
        from: 'Your Name <your_email@example.com>',
        subject: subject
      },
      content: html,
      ...options
    }

    // Append the draft to the 'Drafts' folder
    await client.append('Drafts', draftMessage, ['\\Draft']);
    console.log('Draft created successfully.');
  } catch (err) {
    console.error('Error:', err);
    throw err
  } finally {
    // Close the connection
    await client.logout();
    console.log('Connection ended.');
  }
}