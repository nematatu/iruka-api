const express = require('express');
const { OAuth } = require('oauth');
const dotenv = require('dotenv');
const querystring = require('querystring');
const axios = require('axios');
const session = require('express-session');

dotenv.config();

const app = express();
const port = 3000;

const oauth = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    process.env.TWITTER_CONSUMER_KEY,
    process.env.TWITTER_CONSUMER_SECRET,
    '1.0A',
    process.env.CALLBACK_URL,
    'HMAC-SHA1'
);

app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Twitterの認証ページにリダイレクト
app.get('/login', (req, res) => {
    oauth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
        if (error) {
            console.error('Error obtaining request token:', error);
            res.status(500).json({ error: 'Failed to get request token' });
        } else {
            req.session.oauthToken = oauthToken;
            req.session.oauthTokenSecret = oauthTokenSecret;
            res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`);
        }
    });
});


// 認証後にTwitterからリダイレクトされるエンドポイント
app.get('/callback', (req, res) => {
    const { oauth_token, oauth_verifier } = req.query;

    if (!oauth_token || !oauth_verifier) {
        return res.status(400).json({ error: 'OAuth token or verifier is missing' });
    }

    oauth.getOAuthAccessToken(oauth_token, req.session.oauthTokenSecret, oauth_verifier, (error, oauthAccessToken, oauthAccessTokenSecret) => {
        if (error) {
            res.status(500).json({ error: 'Failed to get access token' });
        } else {
            req.session.oauthAccessToken = oauthAccessToken;
            req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;

            // アクセストークンでユーザー情報を取得
            oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json', oauthAccessToken, oauthAccessTokenSecret, (error, data) => {
                if (error) {
                    res.status(500).json({ error: 'Failed to get user info' });
                } else {
                    res.json(JSON.parse(data));
                }
            });
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
