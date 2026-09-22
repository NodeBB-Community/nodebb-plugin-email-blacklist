'use strict';

// Drives the real onEmailSave hook against a stubbed NodeBB core, so the
// domain matching is exercised through the plugin's actual call path.

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const DOMAINS = [
	'*.theindexer.*',
	'mailinator.com',
	'',
	'   ',
	'*.spam.example',
	'bare.example.*',
	'*wildcard.example.*',
	'trailing.example   ',
].join('\n');

const realRequire = require.main.require.bind(require.main);
require.main.require = (name) => {
	if (name === 'winston') {
		return { info() {}, warn() {} };
	}
	if (name === './src/meta') {
		return { settings: { get: async () => ({ domains: DOMAINS }) } };
	}
	return realRequire(name);
};

const Plugin = realRequire(path.resolve(__dirname, '../library.js'));

async function isBlocked(domain) {
	try {
		await Plugin.onEmailSave({ email: `user@${domain}` });
	} catch (err) {
		return true;
	}
	return false;
}

const cases = [
	// [domain, blocked]
	['a.theindexer.app', true],
	['b.theindexer.com', true],
	['deep.sub.theindexer.co.uk', true],
	['theindexer.com', false], // no leading label, so *. cannot match
	['nottheindexer.app', false], // *. requires a dot before theindexer
	['A.TheIndexer.APP', true], // domains are case insensitive
	['theindexerXapp', false], // the . in an entry is literal, not "any char"
	['mailinator.com', true],
	['MAILINATOR.COM', true],
	['gmail.com', false],
	['x.spam.example', true],
	['spam.example', false],
	['trailing.example', true], // entries are trimmed
	['bare.example.net', true], // a trailing * covers the TLD
	['sub.bare.example.net', false], // ... but not a subdomain
	['wildcard.example.org', true], // a leading * also matches nothing
	['a.wildcard.example.org', true],
	['wildcard.example', false], // the escaped . still needs a TLD
	['', false], // a blank line must never become a match-all
];

test('domain blacklist matching', async () => {
	for (const [domain, expected] of cases) {
		/* eslint-disable-next-line no-await-in-loop */
		const blocked = await isBlocked(domain);
		assert.strictEqual(blocked, expected, `user@${domain} blocked=${blocked}, expected ${expected}`);
	}
});
