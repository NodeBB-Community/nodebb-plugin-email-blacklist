# nodebb email blacklist plugin
An email blacklist plugin for nodebb - only let's users register with an email address not in the blacklisted email domain list.
It can also use [isTempMail API](https://www.istempmail.com) to check the domain.

You can add email domain to the blacklist (one per line)

You can also add domains to a whitelist (one per line). When the whitelist is not empty, only email addresses from those domains can be used. The blacklist still applies.

Domains are matched case-insensitively. Enable "Match subdomains" to make an entry like `example.com` also match `mail.example.com` (in both lists). Entries may be written as `example.com` or `@example.com`; an entry written as `*.example.com` always matches subdomains, even when the option is off.

Example of available list:
- [A list of domains for disposable and temporary email addresses](https://gist.github.com/adamloving/4401361)
- [List of disposable email provider domains](https://gist.github.com/michenriksen/8710649)
- [Disposable Email Blacklist](https://github.com/martenson/disposable-email-domains/blob/master/disposable_email_blacklist.conf)