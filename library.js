'use strict';

const https = require('https');

const winston = require.main.require('winston');
const pluginData = require('./plugin.json');

const meta = require.main.require('./src/meta');

const Plugin = module.exports;

pluginData.nbbId = pluginData.id.replace(/nodebb-plugin-/, '');

Plugin.load = async function (params) {
	const routeHelpers = require.main.require('./src/routes/helpers');
	const { router } = params;
	routeHelpers.setupAdminPageRoute(router, `/admin/plugins/${pluginData.nbbId}`, (req, res) => {
		res.render(`admin/plugins/${pluginData.nbbId}`, {
			title: pluginData.name,
		});
	});
};

Plugin.onEmailSave = async (data) => {
	const pluginSettings = await meta.settings.get(pluginData.nbbId);
	if (isBlacklistedDomain(data.email, pluginSettings.domains)) {
		throw new Error('Blacklisted email provider.');
	}

	if (pluginSettings.isTempMailEnabled === 'on' && !await isTempMail(data.email)) {
		throw new Error('Blacklisted email provider.');
	}

	return data;
};

Plugin.filterEmailUpdate = async function (data) {
	if (data && data.email) {
		const pluginSettings = await meta.settings.get(pluginData.nbbId);
		if (isBlacklistedDomain(data.email, pluginSettings.domains)) {
			throw new Error('Blacklisted email provider.');
		}
		if (pluginSettings.isTempMailEnabled === 'on') {
			return await isTempMail(data.email);
		}
	}
	return data;
};

function isBlacklistedDomain(email, domains = '') {
	const emailDomain = String(email).substring(email.indexOf('@') + 1);
	const domainBlacklist = (domains || '').split('\n').map(line => line.trim());
	return domainBlacklist.includes(emailDomain);
}

function isTempMail(email) {
	// Note: does not work, isTempMail is now a paid service and requires an API token
	return new Promise((resolve, reject) => {
		https.request({
			host: 'www.istempmail.com',
			path: `/api-public/check/${email}`,
		}, (res) => {
			let body = '';
			res.on('data', (chunk) => {
				body += chunk;
			});
			res.on('end', () => {
				winston.info(`[plugins/${pluginData.nbbId}] isTempMail: ${body}`);
				const jsonBody = JSON.parse(body);
				if ('blocked' in jsonBody && jsonBody.blocked) {
					return resolve(false);
				}

				resolve(true);
			}).on('error', (err) => {
				winston.warn(`[plugins/${pluginData.nbbId}] Error with the request: ${err.message}`);
				reject(err);
			});
		}).end();
	});
}

Plugin.admin = {
	menu: function (header, callback) {
		header.plugins.push({
			route: `/plugins/${pluginData.nbbId}`,
			icon: pluginData.faIcon,
			name: pluginData.name,
		});

		callback(null, header);
	},
};
