
import { describe, it, expect, beforeAll, vi } from 'vitest'
import nodemailer from 'nodemailer'
import { test as sendTestEmail } from '../lib/nodemailer/index.js'
import { IOptions, ITransportOptions } from '../types.js'

// Mock dependencies
vi.mock('@polymech/commons', async () => {
    return {
        CONFIG_DEFAULT: vi.fn(),
        forward_slash: (s: string) => s,
        pathInfo: () => ({}),
        substitute: (_: any, s: string) => s,
        resolve: (_: any, s: string) => s,
        globBase: () => ({ glob: '', base: '' }),
        isFile: () => true,
        exists: () => true
    }
})

// We need to import the mocked module to control the mock
import { CONFIG_DEFAULT } from '@polymech/commons'

describe('Mail E2E Tests', () => {
    let testAccount: nodemailer.TestAccount

    beforeAll(async () => {
        // Create a real SMTP account on Ethereal for testing
        testAccount = await nodemailer.createTestAccount()
    })

    it('should send a test email using ethereal account', async () => {
        const transportConfig: ITransportOptions = {
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        }

        // Setup the mock to return our test transport configuration
        vi.mocked(CONFIG_DEFAULT).mockReturnValue({
            email: {
                'ethereal': transportConfig
            }
        })

        const options: IOptions = {
            transport: 'ethereal',
            from: 'sender@example.com',
            to: 'recipient@example.com',
            subject: 'Vitest E2E Test',
            html: '<p>Hello from Vitest!</p>',
            logLevel: 'error' // suppress logs during test
        }

        const info = await sendTestEmail(options)

        expect(info).toBeDefined()
        expect(info.messageId).toBeDefined()
        expect(info.accepted).toContain('recipient@example.com')

        // Ethereal allows us to preview the email
        const previewUrl = nodemailer.getTestMessageUrl(info)
        console.log('Preview URL: %s', previewUrl)
        expect(previewUrl).toBeTruthy()
    })
})
