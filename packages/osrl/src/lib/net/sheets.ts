
import { logger } from '../../index'
import { mimes } from './mime';

import { substitute } from '@plastichub/core/strings'
import { DEFAULT_ROOTS } from '@plastichub/osr-commons'


import * as fs from 'fs';
import * as path from 'path';

import { sync as readFile } from '@plastichub/fs/read';
import { sync as writeFile } from '@plastichub/fs/write';
import { sync as exists } from '@plastichub/fs/exists';

const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');


// https://developers.google.com/sheets/api/quickstart/nodejs
// If modifying these scopes, delete token.json.

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'];

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {

    try {
        const tokenPath = path.resolve(substitute('${OSR_ROOT}/token.json', DEFAULT_ROOTS));
        const credentials = readFile(tokenPath, 'json') as string;
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client, credentialsFile: string = '${OSR_ROOT}/credentials.json') {

    credentialsFile = path.resolve(substitute(credentialsFile, DEFAULT_ROOTS));

    const keys = readFile(credentialsFile, 'json') as any;

    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });

    const tokenPath = path.resolve(substitute('${OSR_ROOT}/token.json', DEFAULT_ROOTS));
    writeFile(tokenPath, payload);
}

async function authorize(credentialsFile: string = '${OSR_ROOT}/credentials.json') {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }

    credentialsFile = path.resolve(substitute(credentialsFile, DEFAULT_ROOTS));

    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: credentialsFile
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}
const readSheet = async (auth: any, sheet: string, range: any) => {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheet,
        range: range,
    });
    return res.data.values;
}

export const read = async (sheet: string, range: string, credentialsFile: string = '${OSR_ROOT}/credentials.json') => {

    credentialsFile = path.resolve(substitute(credentialsFile, DEFAULT_ROOTS))
    if (!exists(path.resolve(credentialsFile))) {
        logger.error('Cant find credentials.json ', credentialsFile);
        return Promise.reject();
    }
    const client = await authorize(credentialsFile);
    const ret = await readSheet(client, sheet, range);
    return ret;
}


export const download = async (sheet: string, dst: string, credentialsFile: string = '${OSR_ROOT}/credentials.json') => {
    credentialsFile = path.resolve(substitute(credentialsFile,DEFAULT_ROOTS));
    if(!exists(path.resolve(credentialsFile))){
        logger.error('Cant find credentials.json ' + credentialsFile);
        return;
    }
    const auth = await authorize(credentialsFile);
    google.options({ auth: auth as any });

    const dest = fs.createWriteStream(dst);
    const drive = google.drive('v3');
    const res = await drive.files.export(
        {
            fileId: sheet,
            mimeType: mimes[path.parse(dst).ext]
        },
        {
            responseType: 'stream'
        }
    );

    await new Promise((resolve, reject) => {
        res.data
            .on('error', reject)
            .pipe(dest)
            .on('error', reject)
            .on('finish', resolve);
    });
}



/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
/*
const authorize = async (credentials: any) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const tokenPath = substitute('${OSR_ROOT}/token.json', DEFAULT_ROOTS);
    const token = readFile(tokenPath, 'string') as string;
    if (!token) {
        return getNewToken(oAuth2Client);
    }

    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
}

*/


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
/*
const getNewToken = async (oAuth2Client: any) => {

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    logger.warn('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err: any, token: any) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            const tokenPath = substitute('${OSR_ROOT}/token.json', DEFAULT_ROOTS);
            writeFile(tokenPath, JSON.stringify(token, null, 2));
            return oAuth2Client;
        });
    });
}
*/
