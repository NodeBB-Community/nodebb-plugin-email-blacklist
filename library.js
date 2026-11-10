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
	if (data && data.email) {
		const pluginSettings = await meta.settings.get(pluginData.nbbId);
		checkDomain(data.email, pluginSettings);

		if (pluginSettings.isTempMailEnabled === 'on' && !await isTempMail(data.email)) {
			throw new Error('Blacklisted email provider.');
		}
	}

	return data;
};

Plugin.filterEmailUpdate = async function (data) {
	if (data && data.email) {
		const pluginSettings = await meta.settings.get(pluginData.nbbId);
		checkDomain(data.email, pluginSettings);
		if (pluginSettings.isTempMailEnabled === 'on') {
			return await isTempMail(data.email);
		}
	}
	return data;
};

function checkDomain(email, pluginSettings = {}) {
	const emailDomain = getEmailDomain(email);
	const matchSubdomains = isEnabled(pluginSettings.matchSubdomains);

	if (matchesDomainList(emailDomain, pluginSettings.domains, matchSubdomains)) {
		throw new Error('Blacklisted email provider.');
	}

	const whitelist = parseDomainList(pluginSettings.whitelist);
	if (whitelist.length && !matchesDomainList(emailDomain, whitelist, matchSubdomains)) {
		throw new Error('Email provider not allowed.');
	}
}

function getEmailDomain(email) {
	const str = String(email);
	return normalizeDomain(str.substring(str.lastIndexOf('@') + 1));
}

function normalizeDomain(domain) {
	return String(domain).trim().toLowerCase()
		.replace(/^[@*.]+/, '')
		.replace(/\.$/, '');
}

// accepts "example.com", "@example.com", and "*.example.com" / ".example.com"
// (the last two always match subdomains)
function parseDomainList(domains) {
	if (Array.isArray(domains)) {
		return domains;
	}
	return String(domains || '').split(/\r?\n/).map((line) => {
		const entry = line.trim().toLowerCase();
		return {
			domain: normalizeDomain(entry),
			wildcard: entry.startsWith('*.') || entry.startsWith('.'),
		};
	}).filter(entry => entry.domain);
}

function matchesDomainList(emailDomain, domains, matchSubdomains) {
	if (!emailDomain) {
		return false;
	}
	return parseDomainList(domains).some(({ domain, wildcard }) => emailDomain === domain ||
		((matchSubdomains || wildcard) && emailDomain.endsWith(`.${domain}`)));
}

function isEnabled(value) {
	return value === true || value === 1 || ['true', 'on', '1'].includes(String(value));
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
