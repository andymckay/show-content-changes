var domains = new Map();
var allURLs = new Array();
var allHTTP = new Array();
var allHTTPS = new Array();

function listExtensions() {
    browser.management.getAll()
    .then(results => {
        for (let result of results) {
            if ('hostPermissions' in result) {
                for (let host of result.hostPermissions) {
                    if (host.startsWith('moz-extension://')) {
                        continue;
                    }
                    if ((host === '<all_urls>') || (host === '*://*/*')) {
                        allURLs.push(result.id);
                        continue;
                    }
                    if (host === 'http://*/*') {
                        allHTTP.push(result.id);
                        continue;
                    }
                    if (host === 'https://*/*') {
                        allHTTPS.push(result.id);
                        continue;
                    }
                    let [protocol, _, domain, path] = host.split('/');
                    if (!domains[domain]) {
                        domains[domain] = [result.id];
                    }
                    else if (!domains[domain].includes(result.id)) {
                        domains[domain].push(result.id);
                    }
                }
            }
        }
        console.log(domains);
    })
}

function findExtensionIdsForURL(tabURL) {
    let ids = [];
    if (tabURL.startsWith('moz-extension://') || tabURL.startsWith('about:')) {
        return ids;
    }

    if (tabURL.startsWith('https://addons.mozilla.org') || tabURL.startsWith('https://testpilot.firefox.com')) {
        return ids;
    }

    let urlObj = new URL(tabURL);
    ids = ids.concat(allURLs);

    if (urlObj.protocol === 'http') {
        ids = ids.concat(allHTTP);
    }

    if (urlObj.protocol === 'https') {
        ids = ids.concat(allHTTPS);
    }
    
    for (let domain of Object.keys(domains)) {
        if (domain === urlObj.host) {
            ids = ids.concat(domains[domain]);
        }
    }
    return ids;
}

function findExtensionsForURL(tabURL) {
    let ids = findExtensionIdsForURL(tabURL);
    let extensionsFiltered = [];
    return new Promise((resolve, reject) => {
        browser.management.getAll()
        .then(extensions => {
            for (let extension of extensions) {
                if (ids.includes(extension.id)) {
                    extensionsFiltered.push(extension);
                }
            }
        resolve(extensionsFiltered);
        });
    })
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    let count = findExtensionIdsForURL(tab.url).length;
    if (count) {
        browser.pageAction.show(tab.id);
        browser.pageAction.setTitle({tabId: tab.id, title: `Extensions affecting this page: ${count.toString()}`});
    }
})

listExtensions();