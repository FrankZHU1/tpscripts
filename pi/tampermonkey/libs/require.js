/// <reference path="./require.d.ts" />
console.log('LOADING REQUIRE');
/**
 *
 * @param {string} path
 * @param {boolean} [cache]
 */
async function req(path, cache = true) {
    let stack = '';
    try {
        path['stack']();
    } catch(e) {
        stack = e.stack;
    }
    if(!document.props) {
        document.props = {
            canInject: true,
            canInjectText: true,
            evalScripts: {}
        };
    }
    return new Promise(async (resolve) => {
        let onScriptLoad = ((resolver) => {
            return (e) => {
                //console.log('resolver ' + (e.target.source || e.target.src));
                if(!e.target.isAsync || e.isAsync) {
                    if(!e.target.loaded || !e.target.args) {
                        e.target.loaded = true;
                        e.target.args = e.args;
                        //console.log("resolving for " + (e.target.source || e.target.src) + (e.isAsync ? " async" : ""));
                        if((e.target.source || e.target.src) === 'http://localhost:4280/req.php?url=DOM/CircularMenu') {
                            //debugger;
                        }
                        resolver(e.args);
                    } else {
                        //console.log('target already loaded ' + (e.target.source || e.target.src));
                        resolver(e.target.args);
                    }
                } else {
                    //console.log("got standard finish for async target NOT RESOLVING " + (e.target.source || e.target.src));
                }
            };
        });
        if(cache) {
            /**@type {Array<CustomHTMLscript>} */
            // @ts-ignore
            let rootElements = document.querySelectorAll('script');

            for(let injectedScript of [...rootElements]) {
                if(injectedScript.source === path || injectedScript.src === path) {
                    if(injectedScript.loaded) {
                        console.log('resolving from cache ' + (injectedScript.source || injectedScript.src));
                        resolve(injectedScript.args);
                    } else {
                        injectedScript.addEventListener('load', onScriptLoad(resolve));
                    }
                    return;
                }
            }
            for(let scr of Object.entries(document.props.evalScripts || {})
                .map(o => o[1])) {
                /**@type {CustomEvalScript} */
                let cScript = scr;
                if(cScript.src === path) {
                    if(cScript.loaded) {
                        console.log('resolving from cache ' + (cScript.source || cScript.src));
                        resolve(cScript.args);
                    } else {
                        cScript.addEventListener('load', onScriptLoad(resolve));
                    }
                    return;
                }
            }
        }
        if(document.props.canInject === true) {
            injectScriptNyUrl(path);
        } else if(document.props.canInjectText) {
            // @ts-ignore
            injectSCriptByText({ src: path, resolve: resolve });
        } else {
            // @ts-ignore
            injectByEval({ src: path, resolve: resolve });
        }
        /**
         * @param {CustomHTMLscript} scr
         */
        function injectByEval(scr) {
            scr.src = scr.src || scr.source;
            function evalText(text, url) {
                if(url.includes('http://localhost:4280?url=')) {
                    window['scriptContent'] = text;
                }
                /**@type {CustomEvalScript } */
                const customEvalScript = {
                    src: url,
                    resolvers: [onScriptLoad(scr.resolve)],
                    /**@param {CustomEvalScript } scrO*/
                    dispatchEvent: (e, scrO) => {
                        if(!scrO.loaded) {
                            scrO.loaded = true;
                            scrO.args = e.args;
                        }
                        scrO.resolvers.forEach(res => {
                            res({ ...e, target: {} });
                        });
                    },
                    remove: () => { return; },
                    addEventListener: (e) => {
                        //tslint:disable-next-line
                        this.resolvers.push(e);
                    },
                    stack
                };
                document.props.evalScripts[url] = customEvalScript;
                const evalScr = eval.call(window, text.replace('new EvalScript(\'\'', `new EvalScript('${url}'`));
                if(!evalScr || (evalScr.name && evalScr.name === 'EvalScript')) {
                    document.props.evalScripts[url].loaded = true;
                    scr.resolve();
                    return;
                }
                if(!evalScr.constructor || !(evalScr.constructor.name === 'EvalScript')) {
                    document.props.evalScripts[url].args = evalScr;
                    scr.resolve(evalScr);
                }
            }
            if(scr.textContent) {
                evalText(scr.textContent, scr.src);
                return;
            }
            GM_xmlhttpRequest({
                url: scr.src,
                method: 'GET',
                onload: (e) => evalText(e.responseText, scr.src),
                onerror: (e) => {
                    debugger;
                    handleError(e);
                },
                onabort: (e) => {
                    debugger;
                    handleError(e);
                },
                ontimeout: (e) => { debugger; }
            });
        }

        function injectScriptNyUrl(scriptPath) {
            /**
             * @type {HTMLScriptElement & CustomScript}
             */
            let injectingScript = document.createElement('script');
            injectingScript.src = scriptPath;

            injectingScript.onload = onScriptLoad(resolve);

            injectingScript.stack = stack;
            injectingScript.resolve = resolve;
            window.onerror = (/**@type Event */e) => {
                if(e.target === injectingScript) {
                    console.log(`urlInjectFailed for ${injectingScript.src} >>>>> TEXT-INJECT`);
                    document.props.canInject = false;
                }
            };
            /**
            * @param {any} e
            */
            injectingScript.onerror = (e) => {
                if(e.eventPhase === 2) {
                    injectSCriptByText(e.target);

                } else {
                    handleError(e);
                }
            };
            try {
                document.body.appendChild(injectingScript);
                setTimeout(() => {
                    if(!injectingScript.loaded) {
                        if(!document.querySelector('tampermonkey_base_container')) {
                            document.props.canInject = false;
                            injectSCriptByText(injectingScript);
                        }
                    }
                }, 2000);
            } catch(e) {
                injectSCriptByText(injectingScript);
            }

        }

        /**
         * @param {CustomHTMLscript} failedScriptElement
         */
        function injectSCriptByText(failedScriptElement) {

            /**
             * @type {CustomHTMLscript}
             */
            let errorFixScript = document.createElement('script');
            errorFixScript.onload = onScriptLoad(failedScriptElement.resolve);
            console.log('blocked ? injecting extension ' + path);
            errorFixScript.source = failedScriptElement.src;
            errorFixScript.stack = stack;
            window.onerror = (/**@type {Event} */e) => {
                /**@type {EventTarget & {errorCallback?:Function}} */
                const target = e.target;

                if(target.errorCallback) {
                    console.error('textInjectFailed');
                    document.props.canInjectText = false;
                    target.errorCallback(e.target);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }

            };
            /**
             * @type {EventTarget & CustomScript}
             */
            errorFixScript.resolve = resolve;

            GM_xmlhttpRequest({
                url: path,
                method: 'GET',
                onload: (e) => {
                    errorFixScript.textContent = e.responseText;
                    if(path.includes('http://localhost:4280?url=')) {
                        window['scriptContent'] = errorFixScript.textContent;
                    }
                    errorFixScript.onerror = /**@param {any} errorEvent */errorEvent => {
                        document.props.canInjectText = false;
                        injectByEval(errorEvent.target);
                    };
                    document.body.appendChild(errorFixScript);
                    errorFixScript.onload = onScriptLoad(errorFixScript.resolve);
                    console.log('calling standard finish for ' + errorFixScript.source);
                    setTimeout(() => {
                        finished(undefined, false, errorFixScript);
                    }, 1);

                },
                onerror: (e) => {
                    debugger;
                    handleError(e);
                },
                onabort: (e) => {
                    debugger;
                    handleError(e);
                },
                ontimeout: (e) => { debugger; }
            });
        }
    });
}
window.req = req;
//random change
//createElement<K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K];

/**
 * inject script with path as url from local backend
 * @type {import('./require').reqSType};
 */
var reqS = async function reqSImpl(path) {
    path = 'http://localhost:4280/req.php?url=' + path;
    return req(path);
};
window.reqS = reqS;
/**
 * @param {*} content
 * @param {*} async
 * @param {*} currentScript
 */
function finished(content, async = false, currentScript = document.currentScript) {
    //console.log("finishing for " + (currentScript.source || currentScript.src));

    /**
     * @type {Event & {args?:any,isAsync?:boolean}}
     */
    let event = new Event('load');
    event.args = content;
    event.isAsync = async;
    currentScript.dispatchEvent(event, currentScript);
}
window.finished = finished;