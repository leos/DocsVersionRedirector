# ![icon](https://raw.githubusercontent.com/leos/DocsVersionRedirector/master/static/icons/icon48.png) DocsVersionRedirector

Chrome extension that redirects you to the exact version of the documentation that you want.

For example, DocsVersionRedirector can automatically redirect: https://docs.python.org/2.7/library/index.html to https://docs.python.org/3.6/library/index.html.

This is useful if you search for a page in the docs and end up on some other random version of the docs.

## Supported Sites

| Project     | Site                             | Type      |
| ----------- | -------------------------------- | --------- |
| Airflow     | airflow.apache.org/docs          | hardcoded |
| Ansible     | docs.ansible.com/ansible         | hardcoded |
| Bazel       | docs.bazel.build                 | hardcoded |
| Django      | docs.djangoproject.com           | hardcoded |
| Python      | docs.python.org                  | hardcoded |
| ReadTheDocs | any project on \*.readthedocs.io | dynamic   |
| RSpec       | rspec.info/documentation         | hardcoded |
| Ruby Docs   | ruby-doc.org                     | hardcoded |

For `dynamic` sites the extension will automatically parse the version numbers and add a configuration that's saved in local storage. For `hardcoded` adding a new version or a language means the extension needs to be updated. Don't be shy, submit a PR to update the version.

## Configuration

<img align="right" src="https://raw.githubusercontent.com/leos/DocsVersionRedirector/master/screenshots/python.png" />

On every site where the extension is active the icon will light up. If you click it you can change the setting for that site.

At the moment the settings will reset on every minor version. If you need to reset them manually, simply uninstall the extension.

## Installation

You can install the latest from the [Chrome Web Store](https://chrome.google.com/webstore/detail/nomnkbngkijpffepcgbbofhcnafpkiep/).

If you want to try it out locally, check out this repo, then:

```
npm install
npm run dev
```

This will assemble the extension into `dist/`.

Then go to `chrome://extensions/`, turn on **Developer mode**, click on **Load unpacked** and select the `dist` folder.

## Moves

This extension has simple support for pages that move between versions. See the `moves` property for `docs.python.org` in `src/sites.ts`. This is only currently available on `hardcoded` sites.

Please open an issue if you're interested in expanding this support.

## Adding sites

If you'd like to add a site, please submit a PR adding it to the appropriate spot in `src/sites.ts`. In addition, make sure to add a glob for the hostname in `manifest.json`.

If there's another dynamic site you'd like this extension to work with, please open an issue.
