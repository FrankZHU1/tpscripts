// ==UserScript==
// @name         RequestProvider
// @namespace    http://tampermonkey.net/
// @version      0.002
// @description  try to take over the world!
// @author       You
// @match        http://*
// @match        file:///*/**
// @match        http://*/*
// @match        about:*
// @match        https://*/*
// @exclude      http://fritz.box/*
// @connect *
// @grant GM_setValue
// @grant GM_getValue
// @grant unsafeWindow
// @grant GM_addValueChangeListener
// @grant GM_removeValueChangeListener
// @grant GM_getResourceURL
// @grant GM_getResourceText
// @grant GM_download
// @grant GM_notification
// @grant GM_openInTab
// @grant window.close
// @grant window.open
// @grant GM_registerMenuCommand
// @grant GM_getTabs
// @grant GM_getTab
// @grant GM_saveTab
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @require https://raspberrypi.e6azumuvyiabvs9s.myfritz.net/tm/libs/require.js
// ==/UserScript==

if(location.href.includes('http://localhost:4200/') || location.href.includes('http://localhost:4280/site/') || (inFrame() && !shouldRunInFrame())) {
    // @ts-ignore
    return;
}

function inFrame() {
    try {
        return window.self !== window.top;
    }
    catch(e) {
        return true;
    }
}
function shouldRunInFrame() {
    const link = location.href;
    if(link.includes('novelplanet.me/v')) {
        return true;
    }
    return false;
}

console.log('running script');

window.top.backendUrl = 'https://raspberrypi.e6azumuvyiabvs9s.myfritz.net/tm';
//window.top.backendUrl = 'http://localhost:4280'
unsafeWindow.scriptContent = '';
document.window = window;
(function ev() {
    if(!document.body) {
        setTimeout(ev, 500);
    } else {
        req(`${window.backendUrl}?url=${location.href}`);
    }
})();
