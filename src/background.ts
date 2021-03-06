import Sites from './sites'
import {blog} from './util'
import {browser, Runtime, WebRequest} from 'webextension-polyfill-ts'
import pdata = require('./../package.json')
import manifest = require('./../manifest.json')
import {SiteDefinition} from './site_types'

setUp()

async function setUp(): Promise<void> {
    await ensureConfVersion()
    await Sites.getInstance()

    // If page has been visited (via localStorage cache) and we're going to redirect anyways, do it immediately.
    browser.webRequest.onBeforeRequest.addListener(
        checkRedirectCache,
        {urls: manifest.content_scripts[0].matches, types: ['main_frame']},
        ['blocking']
    )

    browser.runtime.onMessage.addListener(MessageHandler)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function MessageHandler(message: any, sender: Runtime.MessageSender) {
    if (message.action === 'checkForRedirect') {
        await checkForRedirect(Sites.getInstanceLocal(), new URL(sender.tab!.url!), sender.tab!.id!)
    } else if (message.action === 'changeSetting') {
        const [sites, tab] = await Promise.all([
            Sites.getInstance(),
            browser.tabs.get(message.tabID),
        ])
        await sites.updateValue(new URL(message.site), message.name, message.value)
        await checkForRedirect(sites, new URL(tab.url!), tab.id!)
    }
}

function checkRedirectCache({url}: {url: string}): WebRequest.BlockingResponse {
    const oldURLObject = new URL(url)
    const siteDef = Sites.getInstanceLocal().getSite(oldURLObject)
    if (!siteDef) return {}

    const newUrl = getRedirectURL(siteDef, oldURLObject)

    return siteDef.settings.enabled &&
        oldURLObject.href !== newUrl &&
        localStorage.getItem(`cache-${newUrl}`)
        ? {redirectUrl: newUrl}
        : {}
}

async function ensureConfVersion(): Promise<void> {
    const {confVersion} = await browser.storage.local.get('confVersion')
    if (confVersion !== pdata.version) {
        await browser.storage.local.clear()
        await browser.storage.local.set({confVersion: pdata.version})
    }
}

function getRedirectURL(siteDef: SiteDefinition, oldURL: URL): string {
    const {protocol, host} = oldURL
    const matches = new RegExp(siteDef.regex).exec(oldURL.pathname + oldURL.search + oldURL.hash)
    const {lang, version, path, ...extra_groups} = matches?.groups || {}

    if (matches) {
        let new_template = siteDef.template
            .replace('${lang}', siteDef.settings.lang)
            .replace('${version}', siteDef.settings.version)
            .replace('${path}', rewritePath(siteDef, version, siteDef.settings.version, path))

        for (const [name, value] of Object.entries(extra_groups)) {
            new_template = new_template.replace(`\${${name}}`, value)
        }

        return `${protocol}//${host}` + new_template
    }

    return oldURL.href
}

function rewritePath(
    {moves = [], options: {version: versions}}: SiteDefinition,
    oldVersion: string,
    newVersion: string,
    path: string
): string {
    const move = moves.find(
        ({version: moveVersion, before}) =>
            versions.indexOf(oldVersion) > versions.indexOf(moveVersion) &&
            versions.indexOf(newVersion) <= versions.indexOf(moveVersion) &&
            path === before
    )

    return move ? move.after : path
}

async function checkForRedirect(sites: Sites, oldURL: URL, tabId: number): Promise<void> {
    await sites.checkForDynamicConfig(oldURL)
    const siteDef = sites.getSite(oldURL)
    if (!siteDef) return
    browser.pageAction.show(tabId)

    if (siteDef.settings.enabled) {
        browser.pageAction.setIcon({path: 'icons/icon16.png', tabId: tabId})
        const newUrl = getRedirectURL(siteDef, oldURL)
        if (oldURL.href !== newUrl) {
            const response = await fetch(newUrl, {method: 'HEAD'})
            if (response.ok) {
                localStorage.setItem(`cache-${newUrl}`, '1')
                await browser.tabs.update(tabId, {url: newUrl})
            } else {
                browser.pageAction.setIcon({path: 'icons/icon16y.png', tabId: tabId})
                blog(`HEAD request error: ${response.statusText}`)
            }
        }
    } else {
        browser.pageAction.setIcon({path: 'icons/icon16b.png', tabId: tabId})
    }
}
