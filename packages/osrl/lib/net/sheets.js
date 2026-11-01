"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.download = exports.read = void 0;
const index_1 = require("../../index");
const mime_1 = require("./mime");
const strings_1 = require("@plastichub/core/strings");
const osr_commons_1 = require("@plastichub/osr-commons");
const fs = require("fs");
const path = require("path");
const read_1 = require("@plastichub/fs/read");
const write_1 = require("@plastichub/fs/write");
const exists_1 = require("@plastichub/fs/exists");
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
function loadSavedCredentialsIfExist() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tokenPath = path.resolve((0, strings_1.substitute)('${OSR_ROOT}/token.json', osr_commons_1.DEFAULT_ROOTS));
            const credentials = (0, read_1.sync)(tokenPath, 'json');
            return google.auth.fromJSON(credentials);
        }
        catch (err) {
            return null;
        }
    });
}
/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
function saveCredentials(client, credentialsFile = '${OSR_ROOT}/credentials.json') {
    return __awaiter(this, void 0, void 0, function* () {
        credentialsFile = path.resolve((0, strings_1.substitute)(credentialsFile, osr_commons_1.DEFAULT_ROOTS));
        const keys = (0, read_1.sync)(credentialsFile, 'json');
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        const tokenPath = path.resolve((0, strings_1.substitute)('${OSR_ROOT}/token.json', osr_commons_1.DEFAULT_ROOTS));
        (0, write_1.sync)(tokenPath, payload);
    });
}
function authorize(credentialsFile = '${OSR_ROOT}/credentials.json') {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield loadSavedCredentialsIfExist();
        if (client) {
            return client;
        }
        credentialsFile = path.resolve((0, strings_1.substitute)(credentialsFile, osr_commons_1.DEFAULT_ROOTS));
        client = yield authenticate({
            scopes: SCOPES,
            keyfilePath: credentialsFile
        });
        if (client.credentials) {
            yield saveCredentials(client);
        }
        return client;
    });
}
const readSheet = (auth, sheet, range) => __awaiter(void 0, void 0, void 0, function* () {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = yield sheets.spreadsheets.values.get({
        spreadsheetId: sheet,
        range: range,
    });
    return res.data.values;
});
const read = (sheet, range, credentialsFile = '${OSR_ROOT}/credentials.json') => __awaiter(void 0, void 0, void 0, function* () {
    credentialsFile = path.resolve((0, strings_1.substitute)(credentialsFile, osr_commons_1.DEFAULT_ROOTS));
    if (!(0, exists_1.sync)(path.resolve(credentialsFile))) {
        index_1.logger.error('Cant find credentials.json ', credentialsFile);
        return Promise.reject();
    }
    const client = yield authorize(credentialsFile);
    const ret = yield readSheet(client, sheet, range);
    return ret;
});
exports.read = read;
const download = (sheet, dst, credentialsFile = '${OSR_ROOT}/credentials.json') => __awaiter(void 0, void 0, void 0, function* () {
    credentialsFile = path.resolve((0, strings_1.substitute)(credentialsFile, osr_commons_1.DEFAULT_ROOTS));
    if (!(0, exists_1.sync)(path.resolve(credentialsFile))) {
        index_1.logger.error('Cant find credentials.json ' + credentialsFile);
        return;
    }
    const auth = yield authorize(credentialsFile);
    google.options({ auth: auth });
    const dest = fs.createWriteStream(dst);
    const drive = google.drive('v3');
    const res = yield drive.files.export({
        fileId: sheet,
        mimeType: mime_1.mimes[path.parse(dst).ext]
    }, {
        responseType: 'stream'
    });
    yield new Promise((resolve, reject) => {
        res.data
            .on('error', reject)
            .pipe(dest)
            .on('error', reject)
            .on('finish', resolve);
    });
});
exports.download = download;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9uZXQvc2hlZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFvQztBQUNwQyxpQ0FBK0I7QUFFL0Isc0RBQXFEO0FBQ3JELHlEQUF1RDtBQUd2RCx5QkFBeUI7QUFDekIsNkJBQTZCO0FBRTdCLDhDQUF1RDtBQUN2RCxnREFBeUQ7QUFDekQsa0RBQXVEO0FBRXZELE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUM3RCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBR3pDLDZEQUE2RDtBQUM3RCxnREFBZ0Q7QUFFaEQsTUFBTSxNQUFNLEdBQUcsQ0FBQyx1REFBdUQ7SUFDbkUsZ0RBQWdELENBQUMsQ0FBQztBQUV0RDs7OztHQUlHO0FBQ0gsU0FBZSwyQkFBMkI7O1FBRXRDLElBQUk7WUFDQSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUEsb0JBQVUsRUFBQyx3QkFBd0IsRUFBRSwyQkFBYSxDQUFDLENBQUMsQ0FBQztZQUNwRixNQUFNLFdBQVcsR0FBRyxJQUFBLFdBQVEsRUFBQyxTQUFTLEVBQUUsTUFBTSxDQUFXLENBQUM7WUFDMUQsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUM1QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsT0FBTyxJQUFJLENBQUM7U0FDZjtJQUNMLENBQUM7Q0FBQTtBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZSxlQUFlLENBQUMsTUFBTSxFQUFFLGtCQUEwQiw4QkFBOEI7O1FBRTNGLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUEsb0JBQVUsRUFBQyxlQUFlLEVBQUUsMkJBQWEsQ0FBQyxDQUFDLENBQUM7UUFFM0Us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