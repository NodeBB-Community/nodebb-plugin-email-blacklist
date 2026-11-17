'use strict';

const pluginData = require('./plugin.json');

const meta = nodebb.require('./src/meta');

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
	const pluginSettings = await meta.settings.get(pluginData.nbbId);
	if (isBlacklistedDomain(data.email, pluginSettings.domains)) {
		throw new Error('[[email-blacklist:blacklisted-email-provider]]');
	}

	return data;
};

Plugin.filterEmailUpdate = async function (data) {
	if (data && data.email) {
		const pluginSettings = await meta.settings.get(pluginData.nbbId);
		if (isBlacklistedDomain(data.email, pluginSettings.domains)) {
			throw new Error('[[email-blacklist:blacklisted-email-provider]]');
		}
	}
	return data;
};

function isBlacklistedDomain(email, domains = '') {
	const emailDomain = String(email).substring(email.indexOf('@') + 1).trim().toLowerCase();
	if (!emailDomain) {
		return false;
	}

	const domainBlacklist = String(domains || '').split('\n')
		.map(line => line.trim().toLowerCase())
		.filter(Boolean);

	return domainBlacklist.some(domain =>
		emailDomain === domain || emailDomain.endsWith(`.${domain}`)
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
