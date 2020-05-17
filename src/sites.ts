import {browser} from 'webextension-polyfill-ts'
interface SiteOptionsVersion {
    version: string[]
    [key: string]: string[]
}

interface SiteOptionsFull extends SiteOptionsVersion {
    lang: string[]
}

interface SiteMove {
    version: string
    before: string
    after: string
}

export interface SiteDefinition {
    regex: RegExp
    template: string
    options: SiteOptionsVersion | SiteOptionsFull
    moves?: SiteMove[]
}

const blog = browser.extension.getBackgroundPage().console.log
class SiteConfig {
    private static instance: SiteConfig

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    static getInstance(): SiteConfig {
        if (!SiteConfig.instance) {
            SiteConfig.instance = new SiteConfig()
        }
        return SiteConfig.instance
    }

    async checkForDynamicConfig(hostname: string): Promise<boolean> {
        if (hostname in this.data) return false

        if (hostname.endsWith('readthedocs.io')) {
            blog('detected rtd')
            const response = await fetch(
                `https://readthedocs.org/projects/${hostname.split(
                    '.',
                    1
                )}/versions/`,
                {mode: 'no-cors'}
            )
            blog(response)
            if (!response.ok) {
                const responseText = await response.text()
                blog(response.status)
                blog(responseText)
                return false
            }
            blog('response ok!')
            const rtd_regex = /class="module-item-title".*>(.*)<\/a>/g
            const responseText = await response.text()
            const matches = responseText.match(rtd_regex)
            if (!matches) return false

            this.data[hostname] = {
                regex: /^\/docs\/(?<version>[^/]*)\/(?<path>.*)/,
                template: '/en/${version}/${path}',
                options: {
                    version: [],
                },
            }

            let match
            while ((match = rtd_regex.exec(responseText))) {
                this.data[hostname].options.version.push(match[1])
                blog(`adding version ${match[1]}`)
            }

            return true
        }

        return false
    }

    getDefinitionLocal(hostname: string): SiteDefinition {
        return this.data[hostname]
    }
    getSiteNames(): string[] {
        return Object.keys(this.data)
    }

    private data: {[key: string]: SiteDefinition} = {
        'airflow.apache.org': {
            regex: /^\/docs\/(?<version>[^/]*)\/(?<path>.*)/,
            template: '/docs/${version}/${path}',
            options: {
                version: [
                    'stable',
                    '1.10.10',
                    '1.10.9',
                    '1.10.8',
                    '1.10.7',
                    '1.10.6',
                    '1.10.5',
                    '1.10.4',
                    '1.10.3',
                    '1.10.2',
                    '1.10.1',
                ],
            },
        },
        'docs.ansible.com': {
            regex: /^\/ansible\/(?<version>[^/]*)\/(?<path>.*)/,
            template: '/ansible/${version}/${path}',
            options: {
                version: [
                    'devel',
                    'latest',
                    '2.8',
                    '2.7',
                    '2.6',
                    '2.5',
                    '2.4',
                    '2.3',
                ],
            },
        },
        'docs.bazel.build': {
            regex: /^\/versions\/(?<version>[^/]*)\/(?<path>.*)/,
            template: '/versions/${version}/${path}',
            options: {
                version: [
                    'master',
                    '3.1.0',
                    '3.0.0',
                    '2.2.0',
                    '2.1.0',
                    '2.0.0',
                    '1.2.0',
                    '1.1.0',
                    '1.0.0',
                    '0.29.1',
                    '0.29.0',
                    '0.28.0',
                    '0.27.0',
                    '0.26.0',
                    '0.25.0',
                    '0.24.0',
                    '0.23.0',
                    '0.22.0',
                    '0.21.0',
                    '0.20.0',
                    '0.19.2',
                    '0.19.1',
                    '0.18.1',
                    '0.17.2',
                    '0.17.1',
                ],
            },
        },
        'docs.djangoproject.com': {
            regex: /^\/(?<lang>[^/]*)\/(?<version>[^/]*)\/(?<path>.*)/,
            template: '/${lang}/${version}/${path}',
            options: {
                lang: [
                    'en',
                    'el',
                    'es',
                    'fr',
                    'id',
                    'ja',
                    'ko',
                    'pl',
                    'pt-br',
                    'zh-hans',
                ],
                version: [
                    'dev',
                    '3.0',
                    '2.2',
                    '2.1',
                    '2.0',
                    '1.11',
                    '1.10',
                    '1.8',
                ],
            },
        },
        'docs.python.org': {
            regex: /^\/(?<version>[^/]*)\/(?<path>.*)/,
            template: '/${version}/${path}',
            options: {
                version: ['3', '3.9', '3.8', '3.7', '3.6', '3.5', '2.7'],
            },
            moves: [
                {
                    version: '3.5',
                    before: 'library/sets.html',
                    after: 'library/stdtypes.html#set-types-set-frozenset',
                },
                {
                    version: '3.5',
                    before: 'library/stringio.html',
                    after: 'library/io.html#io.StringIO',
                },
            ],
        },
    }
}

export default SiteConfig.getInstance()
