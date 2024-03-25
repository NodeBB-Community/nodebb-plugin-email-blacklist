'use strict';

define('admin/plugins/email-blacklist', [
	'settings',
], function (settings) {
	var ACP = {};

	ACP.init = function () {
		settings.load('email-blacklist', $('.email-blacklist-settings'));
		$('#save').on('click', saveSettings);
	};

	function saveSettings() {
		settings.save('email-blacklist', $('.email-blacklist-settings'));
	}

	return ACP;
});
