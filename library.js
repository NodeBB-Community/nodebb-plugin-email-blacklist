'use strict';

const pluginData = require('./plugin.json');

const meta = nodebb.require('./src/meta');
const winston = nodebb.require('winston');

const Plugin = module.exports;

pluginData.nbbId = pluginData.id.replace(/nodebb-plugin-/, '');

Plugin.load = async function (params) {
	const routeHelpers = nodebb.require('./src/routes/helpers');
	const { router } = params;
	routeHelpers.setupAdminPageRoute(router, `/admin/plugins/${pluginData.nbbId}`, (req, res) => {
		res.render(`admin/plugins/${pluginData.nbbId}`, {
			title: pluginData.name,
		});
	});
};

Plugin.onEmailSave = async (data) => {
	await enforceEmailBlacklist(data.email, data.uid);

	return data;
};

Plugin.filterEmailUpdate = async function (hookData) {
	const { uid, data } = hookData;
	if (data && data.email) {
		await enforceEmailBlacklist(data.email, uid);
	}
	return hookData;
};

async function enforceEmailBlacklist(email, uid) {
	const pluginSettings = await meta.settings.get(pluginData.nbbId);
	if (isBlacklistedDomain(email, pluginSettings.domains)) {
		winston.info(`Blacklisted email provider: ${email}, uid: ${uid}`);
		throw new Error('[[email-blacklist:blacklisted-email-provider]]');
	}
}

function isBlacklistedDomain(email, domains = '') {
	const emailDomain = String(email).substring(email.indexOf('@') + 1).trim().toLowerCase();
	if (!emailDomain) {
		return false;
	}

	const domainBlacklist = String(domains || '').split('\n')
		.map(line => line.trim().toLowerCase())
		.filter(Boolean);

	return domainBlacklist.some(
		domain => emailDomain === domain || emailDomain.endsWith(`.${domain}`)
	);
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
