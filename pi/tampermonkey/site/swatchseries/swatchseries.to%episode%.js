/// <reference path="../../customTypes/index.d.ts" />
/* global IMPORT,menu */

/**
* @typedef {{ link:string,priority:number}} videoLink
*/

let buttonsfornextinstance = 'nextbuttons';
sc.g.a('linktable')
    .then(async function watchSeriesEpisode() {

        await reqS('Storage/crossDomainStorage');

        sc.CD.s(buttonsfornextinstance, new Array(0));
        let nextButton = sc.g.C('npbutton button-next');
        if(nextButton) {
            if(nextButton.length) {
                nextButton = nextButton[0];
            }
            sc.CD.p(buttonsfornextinstance, ['next', nextButton.href, location.href], new Array(0));
        }
        else {
            //await sc.S.Storage_crossDomainStorage.s("autoplay", false);
        }
        let previousButton = sc.g.C('npbutton button-previous');
        if(previousButton) {
            if(previousButton.length) {
                previousButton = previousButton[0];
            }
            sc.CD.p(buttonsfornextinstance, ['previous', previousButton.href, location.href], new Array(0));
        }
        sc.CD.p(buttonsfornextinstance, [{ addVideoButtons: true }]);
        var parent = sc.g.C('nextprev');
        if(!parent) {
            parent = sc.g.C('channel-title');
        }
        if(parent.length) {
            parent = parent[0];
        }

        sc.menu.addToMenu({
            name: 'autoplay',
            mouseOver: () => {
                sc.CD.s('autoplay', true);
                setlink();
            }
        });

        var btn = {};// parent.appendChild(document.createElement("a")); //find.C("npbutton button-next")[0].cloneNode(true)
        btn.innerText = 'Autoplay';
        btn.className = 'npbutton';

        // btn.style.backgroundImage = "http://static.mywatchseries.to/templates/default/images/hd.png";
        // btn.style.paddingLeft = "7px";
        //btn.style.paddingRight = "7px";

        if(sc.CD.g('autoplay', false) || location.hash.indexOf('autoplay') > -1) {
            //setlink();
        }
    });

async function setlink() {
    let next = await reqS('Videos/next');
    history.pushState(null, document.title, location.href);
    /*G.p(sc.c.sI.GS.eventstorage, {
         title: "watching series",
         body: document.title.replace("Watch Online ", "").replace(" - Watch Series", ""),
         host: "log",
         timeout: 10,
         url: location.href,
         iurl: "",
         fnc: null,
         timestamp: sc.T.n()
        });
    */
    let container = sc.g('tbody');
    /**@type {Array<string>} */
    var excludedLinks = sc.CD.g('exclude', []);
    if(container) {
        //----------------------------------------------------------------------------------------
        /**
         * @type {Array<videoLink>}
         */
        let linkarray = [
            { link: 'download_link_movpod.in ', priority: 55 },
            { link: 'download_link_openload.co ', priority: 70 },
            { link: 'download_link_powvideo.net ', priority: 80 },
            { link: 'download_link_vidtodo.com ', priority: 200 }
        ]; //, "download_link_thevideo.me ""download_link_nowvideo.sx ",
        let sorted = linkarray.sort((p, a) => a.priority - p.priority);
        var opened = false;
        /**@type {Array<HTMLElement & {children:Array<any>}>} */
        var list = [...container.children];
        if(excludedLinks.length > 0) {
            debugger;
            let last = list.find(link => link.children[1].children[0].href === excludedLinks[excludedLinks.length - 1]);
            if(last) {
                let nextType = linkarray.find(linkType => linkType.link !== last.className);
                if(nextType) {
                    if(next(nextType, list, excludedLinks)) {
                        opened = true;
                    }
                }
            }
        }
        if(!opened) {
            for(let link of sorted) {
                if(next(link, list, excludedLinks)) {
                    opened = true;
                    break;
                }
                if(opened) {
                    break;
                }
            }
        }
        if(!opened) {
            if(list.length === 0) {
                alert('no videos found');
            }
            alert('no hoster linked');
        }
    }
    else {
        console.log('no links for this episode');
        try {
            location.href = sc.g.C('npbutton button-next')[0].href;
        }
        catch(error) {
            //
        }
    }
}