const { google } = require('googleapis');
const express = require('express')
const OAuth2Data = require('./google_key.json')

const app = express()

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];


const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
var authed = false;

const getUsers = (request, response) => {
    console.log('Pobieram dane ...');
    client.query('SELECT * FROM public."Users"', (error, res) => {
        if (error) {
            throw error
        }
        console.log('Dostałem ...');
        for (let row of res.rows) {
            console.log(JSON.stringify(row));
        }
    })
}

const addOrUpdateUser = (email) => {
    const joined = new Date().toISOString();
    const lastvisit = joined;
    const counter = 1;
    const query = 'SELECT * FROM public."Users" WHERE email = $1';
    client.query(query, [email], (error, result) => {
        if (error) {
            throw error;
        }
        if (result.rows.length === 0) {
            const insertQuery = 'INSERT INTO public."Users" (email, joined, lastvisit, counter) VALUES ($1, $2, $3, $4)';
            client.query(insertQuery, [email, joined, lastvisit, counter], (error, result) => {
                if (error) {
                    throw error;
                }
                console.log('User added to database');
            });
        } else {
            const updateQuery = 'UPDATE public."Users" SET lastvisit = $1, counter = counter + 1 WHERE email = $2';
            client.query(updateQuery, [lastvisit, email], (error, result) => {
                if (error) {
                    throw error;
                }
                console.log('User updated in database');
            });
        }
    });
}

app.get('/', (req, res) => {
	console.log(authed);
    if (!authed) {
        // Generate an OAuth URL and redirect there
        const url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/gmail.readonly'
        });
        console.log(url)
        res.redirect(url);
    } else {
        PGHOST='ep-wild-bush-363371.eu-central-1.aws.neon.tech'
        PGDATABASE='neondb'
        PGUSER='SzymonB5'
        PGPASSWORD='<% PASSWORD %>'
        ENDPOINT_ID='ep-wild-bush-363371'


        const postgres = require('postgres');
        require('dotenv').config();

        getUsers();
        const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
        const URL = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?options=project%3D${ENDPOINT_ID}`;

        addOrUpdateUser();

        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        gmail.users.labels.list({
            userId: 'me',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const labels = res.data.labels;
            if (labels.length) {
                console.log('Labels:');
                labels.forEach((label) => {
                    console.log(`- ${label.name}`);
                });
            } else {
                console.log('No labels found.');
            }
        });
        res.send('Logged in')
    }
})

app.get('/auth/google/callback', function (req, res) {
    const code = req.query.code
    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                authed = true;
                res.redirect('/')
            }
        });
    }
});

const port = process.env.port || 5000
app.listen(port, () => console.log(`Server running at ${port}`));
