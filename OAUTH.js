const { randomBytes } = require('crypto');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { parse } = require('url');

module.exports = class OAuth2 {
	constructor({
		endpoint,
		clientID,
		clientSecret,
		responseType = 'code',
		scopes = [],
		redirectURI,
	}) {
		this.endpoint = endpoint;
		this.clientID = clientID;
		this.clientSecret = clientSecret;
		this.responseType = responseType;
		this.scopes = scopes;
		this.redirectURI = redirectURI;
	}

	get authorizeURL() {
		return `${this.endpoint}/authorize`;
	}

	get tokenURL() {
		return `${this.endpoint}/token`;
	}

	get revokeURL() {
		return `${this.endpoint}/token/revoke`;
	}

	clone() {
		return new this.constructor({
			endpoint: this.endpoint,
			clientID: this.clientID,
			clientSecret: this.clientSecret,
			responseType: this.responseType,
			scopes: this.scopes.slice(),
			redirectURI: this.redirectURI,
		});
	}

	generateState(cookies) {
		const id = randomBytes(20).toString('hex');
		cookies.set('state', id, { signed: true });
		return id;
	}

	authorize() {
		return (req, res) => {
			/* eslint-disable camelcase */
			const params = new URLSearchParams({
				response_type: this.responseType,
				scope: this.scopes.join(' '),
				redirect_uri: this.redirectURI,
				client_id: this.clientID,
				state: this.generateState(res.cookies),
			});
			/* eslint-enable camelcase */

			res.setHeader('Location', `${this.authorizeURL}?${params}`);
			res.statusCode = 302;
			res.end();
		};
	}

	token(req, res, grantType = 'authorization_code') {
		const url = parse(req.url, true);

		const state = req.cookies.get('state', { signed: true });
		if (!state || url.query.state !== state) {
			res.statusCode = 401;
			res.end('no or invalid state provided');
			return;
		}

		const form = new FormData();
		form.append('client_id', this.clientID);
		form.append('client_secret', this.clientSecret);
		form.append('grant_type', grantType);
		form.append('code', url.query.code);
		form.append('redirect_uri', this.redirectURI);
		form.append('scope', this.scopes.join(' '));

		return fetch(this.tokenURL, {
			method: 'POST',
			body: form,
		}).then(r => r.json());
	}

	refresh(token) {
		const form = new FormData();
		form.append('client_id', this.clientID);
		form.append('client_secret', this.clientSecret);
		form.append('grant_type', 'refresh_token');
		form.append('refresh_token', token);
		form.append('redirect_uri', this.redirectURI);
		form.append('scope', this.scopes.join(' '));

		return fetch(this.tokenURL, {
			method: 'POST',
			body: form,
		}).then(r => r.json());
	}
};