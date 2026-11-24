# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |

## Reporting a vulnerability

Please report security issues privately by email to **info@ligatrix.com**. Do not open a public issue.

Include:

- the affected version and component;
- the input that triggers the problem and the markup it produces;
- the impact you expect (for example, script execution through an unescaped option);
- any suggested fix, if you have one.

We acknowledge reports within 2 business days, keep you informed while we investigate, and credit you in the release
notes if you wish.

## Scope

Escaping is the core promise of this package: any way to get markup, an event handler or a `javascript:` URL into the
output through a text option is a vulnerability. Options whose names end in `Html`, and a table column's `render()`,
insert trusted markup by design and are out of scope.
