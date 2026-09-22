# nodebb email blacklist plugin
An email blacklist plugin for nodebb - only let's users register with an email address not in the blacklisted email domain list.
It can also use [isTempMail API](https://www.istempmail.com) to check the domain.

You can add email domain to the blacklist (one per line)

## Wildcards

An entry can contain `*`, which matches any run of characters, including dots.

| Entry | Matches | Does not match |
| --- | --- | --- |
| `mailinator.com` | `mailinator.com` | `mail.mailinator.com` |
| `*.theindexer.*` | `a.theindexer.app`, `b.theindexer.com`, `deep.sub.theindexer.co.uk` | `theindexer.com` |
| `theindexer.*` | `theindexer.app`, `theindexer.com` | `a.theindexer.app` |
| `*theindexer.*` | `theindexer.app`, `a.theindexer.com` | `theindexer` |

Use `*theindexer.*` to cover the bare domain and every subdomain in one entry.
Matching ignores case, and blank lines are ignored.

Example of available list:
- [A list of domains for disposable and temporary email addresses](https://gist.github.com/adamloving/4401361)
- [List of disposable email provider domains](https://gist.github.com/michenriksen/8710649)
- [Disposable Email Blacklist](https://github.com/martenson/disposable-email-domains/blob/master/disposable_email_blacklist.conf)
