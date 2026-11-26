# Security Policy

Digimon Database is a fan-made encyclopedia. Only the live site at
[digimondb.com](https://www.digimondb.com) and the latest commit on `main`
are maintained, so there are no older versions to patch.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report it privately through GitHub instead: go to the **Security** tab of this
repository and click **Report a vulnerability**. Only the maintainer can see
the report.

Helpful things to include:

- What the issue is and where it happens (URL, route or file)
- Steps to reproduce it, or a small proof of concept
- What an attacker could do with it

## What to expect

- A first reply within **7 days**.
- If the report is confirmed, a fix as soon as possible. Critical issues come first.
- If it is not considered a vulnerability, an explanation of why.
- Credit in the fix commit or advisory if you want it. There is no bug bounty.

## Scope

In scope:

- The live site and the code in this repository
- The admin area, file uploads, search API and the error report form

Out of scope:

- Wrong or missing Digimon data. Use the "report an error" button on the page instead.
- Denial of service, load testing or automated scanning that degrades the site
- Missing security headers or best practices with no demonstrable impact
- Issues in third-party services (Vercel, Digi-API, Wikimon) that should be reported to them

## Testing in good faith

If you test within these rules, you will not be treated as an attacker:

- Only use accounts and data that are yours.
- Do not access, change or delete other people's data.
- Stop and report as soon as you confirm the problem.
- Give a reasonable time to fix it before disclosing it publicly.
