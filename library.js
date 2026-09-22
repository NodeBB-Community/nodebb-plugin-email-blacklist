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

// Turn a blacklist entry that contains * into an anchored regex. Everything
// except * is escaped, and * becomes .* so one entry can span any number of
// labels: *.theindexer.* matches a.theindexer.app and b.theindexer.com.
function wildcardToRegExp(pattern) {
	const source = pattern
		.split('*')
		.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('.*');
	return new RegExp(`^${source}$`);
}

function isBlacklistedDomain(email, domains = '') {
	const address = String(email);
	// Domains are case insensitive, so compare both sides in lower case.
	const emailDomain = address.substring(address.indexOf('@') + 1).toLowerCase();
	const domainBlacklist = (domains || '')
		.split('\n')
		.map(line => line.trim().toLowerCase())
		.filter(Boolean); // an empty line must never become a match-all
	return domainBlacklist.some((pattern) => {
		if (!pattern.includes('*')) {
			return pattern === emailDomain;
		}
		return wildcardToRegExp(pattern).test(emailDomain);
	});
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
