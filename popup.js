var bg = browser.extension.getBackgroundPage();
var anchor = document.getElementById('addon-list');

function addRow(extension) {
    var li = document.createElement('li');
    li.innerText = extension.name;
    anchor.appendChild(li);
}

browser.tabs.query({currentWindow: true, active: true})
.then(tabs => {
    var tab = tabs[0];
    var result = bg.findExtensionsForURL(tab.url);
    result.then(extensions => { 
        for (let extension of extensions) {
            addRow(extension);
        }
    });
});