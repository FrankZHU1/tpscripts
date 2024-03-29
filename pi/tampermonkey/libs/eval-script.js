
/**
 * @template V
 */
class EvalScript {
    /**
     * @template { Array<keyof import('./require').RequireMap> } LIB
     * @typedef EvalScriptOptions
     * @property {(obj:Partial<V>)=>boolean|void} [reset]
     * @property {(resolver:<T>(obj:T)=>any,set:Partial<V>)=>Promise<boolean|void>} [run] if true waits for manual call to finish
     * @property {()=>void} [afterReset]
     *
     * @param {EvalScriptOptions<?>} options
     * @param {string} [url]
     */
    constructor(url, options = {}) {
        this.url = url;
        /**@type {CustomHTMLscript}*/
        // @ts-ignore
        this.script = document.currentScript || document.props.evalScripts[this.url];
        if(this.script) {
            this.script.reset = () => this.reset.call(this);
        }
        this.callback = options.run;
        this.resetFunction = options.reset;
        this.afterReset = options.afterReset;
        /**@type {Partial<V>} */
        this.options = {};
        this.onload = null;
        this.loaded = false;
        ///**@type {Array<keyof import('./require').RequireMap>} */
        //this.libraries = options.libraries || [];
        this.context = { test: 123 };
        this.run();
        for(let propName in this) {
            if(propName === 'onload') {
                continue;
            }
            if(document.currentScript) {
                // @ts-ignore
                document.currentScript[propName] = this[propName];
            } else if(document.props.evalScripts[this.url]) {
                // @ts-ignore
                document.props.evalScripts[this.url][propName] = this[propName];
            }
        }
    }

    set() {
        return this.options;
    }

    reset() {
        if(!this.resetFunction) {
            return;
        }
        return this.resetFunction(this.options);
    }
    async run() {
        const result = await new Promise(
            async resolver => {
                let resolvedLibs = {};
                /*if (this.libraries.length > 0) {
                    const libs = await Promise.all(this.libraries.map(async lib => {
                        //map also returns index which is incompatible with optionsl boolean param
                        return reqS(lib);
                    }));
                    for (let lib of libs) {
                        for (let fnc in lib) {
                            if (fnc !== 'context') {
                                resolvedLibs[fnc] = lib[fnc];
                            }
                        }
                    }
                }*/
                if(this.callback) {
                    if(!await this.callback.call(window, resolver, this.options)) {
                        setTimeout(() => {
                            this.finish(undefined);
                            resolver({ notAsync: true });
                        }, 0);
                    } else {
                        this.script.isAsync = true;
                    }
                } else {
                    resolver();
                }
            }).catch(e => { debugger; });
        if(!result || !result.notAsync) {
            this.finish(result, true);

        }
    }
    /**
     * @template T
     * @param {T & {context?:any}|{context?:any}} arg
     * @param {*} async
     */
    finish(arg, async = false) {
        if(this.loaded) {
            return;
        }
        this.loaded = true;
        if(arg) {
            arg.context = this;
        } else {
            arg = { context: this };
        }
        finished(arg, async, this.script);
    }

    dispatchEvent(loadEvent) {
        this.onload({ ...loadEvent, target: this });
    }
}
// @ts-ignore
window.EvalScript = EvalScript;