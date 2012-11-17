// EventListener | @jon_neal | MIT/GPL2
/*globals Window, HTMLDocument, Element */
(function () {
    'use strict';

    if (this.addEventListener || !this.Element) {
        return;
    }

    var registry = [], 
        /**
        * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
        * Available via the MIT or new BSD license.
        * see: http://github.com/requirejs/domReady for details
        */
        domReady = (function () {

        var isTop, testDiv, scrollIntervalId,
            isBrowser = typeof window !== "undefined" && window.document,
            isPageLoaded = !isBrowser,
            doc = isBrowser ? document : null,
            readyCalls = [];

        function runCallbacks(callbacks) {
            var i;
            for (i = 0; i < callbacks.length; i += 1) {
                callbacks[i](doc);
            }
        }

        function callReady() {
            var callbacks = readyCalls;

            if (isPageLoaded) {
                //Call the DOM ready callbacks
                if (callbacks.length) {
                    readyCalls = [];
                    runCallbacks(callbacks);
                }
            }
        }

        /**
         * Sets the page as loaded.
         */
        function pageLoaded() {
            if (!isPageLoaded) {
                isPageLoaded = true;
                if (scrollIntervalId) {
                    clearInterval(scrollIntervalId);
                }

                callReady();
            }
        }

        if (isBrowser) {
            if (document.addEventListener) {
                //Standards. Hooray! Assumption here that if standards based,
                //it knows about DOMContentLoaded.
                document.addEventListener("DOMContentLoaded", pageLoaded, false);
                window.addEventListener("load", pageLoaded, false);
            } else if (window.attachEvent) {
                window.attachEvent("onload", pageLoaded);

                testDiv = document.createElement('div');
                try {
                    isTop = window.frameElement === null;
                } catch (e) {}

                //DOMContentLoaded approximation that uses a doScroll, as found by
                //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
                //but modified by other contributors, including jdalton
                if (testDiv.doScroll && isTop && window.external) {
                    scrollIntervalId = setInterval(function () {
                        try {
                            testDiv.doScroll();
                            pageLoaded();
                        } catch (e) {}
                    }, 30);
                }
            }

            //Check if document already complete, and if so, just trigger page load
            //listeners. Latest webkit browsers also use "interactive", and
            //will fire the onDOMContentLoaded before "interactive" but not after
            //entering "interactive" or "complete". More details:
            //http://dev.w3.org/html5/spec/the-end.html#the-end
            //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
            //Hmm, this is more complicated on further use, see "firing too early"
            //bug: https://github.com/requirejs/domReady/issues/1
            //so removing the || document.readyState === "interactive" test.
            //There is still a window.onload binding that should get fired if
            //DOMContentLoaded is missed.
            if (document.readyState === "complete") {
                pageLoaded();
            }
        }

        /**
         * Registers a callback for DOM ready. If DOM is already ready, the
         * callback is called immediately.
         * @param {Function} callback
         */
        function domReady(callback) {
            if (isPageLoaded) {
                callback(doc);
            } else {
                readyCalls.push(callback);
            }
            return domReady;
        }

        return domReady;
    }());

    function addToPrototype(name, method) {
        Window.prototype[name] = HTMLDocument.prototype[name] = Element.prototype[name] = method;
    }

    addToPrototype("addEventListener", function (type, listener) {
        var target = this;

        registry.unshift({
            __listener: function (event) {
                event.currentTarget = target;
                event.pageX = event.clientX + document.documentElement.scrollLeft;
                event.pageY = event.clientY + document.documentElement.scrollTop;
                event.preventDefault = function () { event.returnValue = false; };
                event.relatedTarget = event.fromElement || null;
                event.stopPropagation = function () { event.cancelBubble = true; };
                event.relatedTarget = event.fromElement || null;
                event.target = event.srcElement || target;
                event.timeStamp = +new Date();

                listener.call(target, event);
            },
            listener: listener,
            target: target,
            type: type
        });

        if (type === 'DOMContentLoaded') {
            domReady(registry[0].__listener);
        }
        else {
            this.attachEvent("on" + type, registry[0].__listener);
        }
    });

    addToPrototype("removeEventListener", function (type, listener) {
        var index, length = registry.length;
        for (index = 0; index < length; ++index) {
            if (registry[index].target === this && registry[index].type === type && registry[index].listener === listener) {
                return this.detachEvent("on" + type, registry.splice(index, 1)[0].__listener);
            }
        }
    });

    addToPrototype("dispatchEvent", function (eventObject) {
        var index, length;
        try {
            return this.fireEvent("on" + eventObject.type, eventObject);
        } catch (error) {
            for (index = 0, length = registry.length; index < length; ++index) {
                if (registry[index].target === this && registry[index].type === eventObject.type) {
                    registry[index].call(this, eventObject);
                }
            }
        }
    });
}());
