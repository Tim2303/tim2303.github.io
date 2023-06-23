(function () {
    'use strict';

    const PACKET_TYPES = Object.create(null); // no Map = no polyfill
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    const PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(key => {
        PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    const ERROR_PACKET = { type: "error", data: "parser error" };

    const withNativeBlob$1 = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
    // ArrayBuffer.isView method is not defined in IE10
    const isView$1 = obj => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj && obj.buffer instanceof ArrayBuffer;
    };
    const encodePacket = ({ type, data }, supportsBinary, callback) => {
        if (withNativeBlob$1 && data instanceof Blob) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(data, callback);
            }
        }
        else if (withNativeArrayBuffer$2 &&
            (data instanceof ArrayBuffer || isView$1(data))) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(new Blob([data]), callback);
            }
        }
        // plain string
        return callback(PACKET_TYPES[type] + (data || ""));
    };
    const encodeBlobAsBase64 = (data, callback) => {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const content = fileReader.result.split(",")[1];
            callback("b" + (content || ""));
        };
        return fileReader.readAsDataURL(data);
    };

    // imported from https://github.com/socketio/base64-arraybuffer
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    // Use a lookup table to find the index.
    const lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup$1[chars.charCodeAt(i)] = i;
    }
    const decode$1 = (base64) => {
        let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }
        const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
        for (i = 0; i < len; i += 4) {
            encoded1 = lookup$1[base64.charCodeAt(i)];
            encoded2 = lookup$1[base64.charCodeAt(i + 1)];
            encoded3 = lookup$1[base64.charCodeAt(i + 2)];
            encoded4 = lookup$1[base64.charCodeAt(i + 3)];
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return arraybuffer;
    };

    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
    const decodePacket = (encodedPacket, binaryType) => {
        if (typeof encodedPacket !== "string") {
            return {
                type: "message",
                data: mapBinary(encodedPacket, binaryType)
            };
        }
        const type = encodedPacket.charAt(0);
        if (type === "b") {
            return {
                type: "message",
                data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
            };
        }
        const packetType = PACKET_TYPES_REVERSE[type];
        if (!packetType) {
            return ERROR_PACKET;
        }
        return encodedPacket.length > 1
            ? {
                type: PACKET_TYPES_REVERSE[type],
                data: encodedPacket.substring(1)
            }
            : {
                type: PACKET_TYPES_REVERSE[type]
            };
    };
    const decodeBase64Packet = (data, binaryType) => {
        if (withNativeArrayBuffer$1) {
            const decoded = decode$1(data);
            return mapBinary(decoded, binaryType);
        }
        else {
            return { base64: true, data }; // fallback for old browsers
        }
    };
    const mapBinary = (data, binaryType) => {
        switch (binaryType) {
            case "blob":
                return data instanceof ArrayBuffer ? new Blob([data]) : data;
            case "arraybuffer":
            default:
                return data; // assuming the data is already an ArrayBuffer
        }
    };

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
    const encodePayload = (packets, callback) => {
        // some packets may be added to the array while encoding, so the initial length must be saved
        const length = packets.length;
        const encodedPackets = new Array(length);
        let count = 0;
        packets.forEach((packet, i) => {
            // force base64 encoding for binary packets
            encodePacket(packet, false, encodedPacket => {
                encodedPackets[i] = encodedPacket;
                if (++count === length) {
                    callback(encodedPackets.join(SEPARATOR));
                }
            });
        });
    };
    const decodePayload = (encodedPayload, binaryType) => {
        const encodedPackets = encodedPayload.split(SEPARATOR);
        const packets = [];
        for (let i = 0; i < encodedPackets.length; i++) {
            const decodedPacket = decodePacket(encodedPackets[i], binaryType);
            packets.push(decodedPacket);
            if (decodedPacket.type === "error") {
                break;
            }
        }
        return packets;
    };
    const protocol$1 = 4;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    // alias used for reserved events (protected method)
    Emitter.prototype.emitReserved = Emitter.prototype.emit;

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };

    const globalThisShim = (() => {
        if (typeof self !== "undefined") {
            return self;
        }
        else if (typeof window !== "undefined") {
            return window;
        }
        else {
            return Function("return this")();
        }
    })();

    function pick(obj, ...attr) {
        return attr.reduce((acc, k) => {
            if (obj.hasOwnProperty(k)) {
                acc[k] = obj[k];
            }
            return acc;
        }, {});
    }
    // Keep a reference to the real timeout functions so they can be used when overridden
    const NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
    const NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
    function installTimerFunctions(obj, opts) {
        if (opts.useNativeTimers) {
            obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
            obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
        }
        else {
            obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
            obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
        }
    }
    // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
    const BASE64_OVERHEAD = 1.33;
    // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
    function byteLength(obj) {
        if (typeof obj === "string") {
            return utf8Length(obj);
        }
        // arraybuffer or blob
        return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
    }
    function utf8Length(str) {
        let c = 0, length = 0;
        for (let i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 0x80) {
                length += 1;
            }
            else if (c < 0x800) {
                length += 2;
            }
            else if (c < 0xd800 || c >= 0xe000) {
                length += 3;
            }
            else {
                i++;
                length += 4;
            }
        }
        return length;
    }

    class TransportError extends Error {
        constructor(reason, description, context) {
            super(reason);
            this.description = description;
            this.context = context;
            this.type = "TransportError";
        }
    }
    class Transport extends Emitter {
        /**
         * Transport abstract constructor.
         *
         * @param {Object} opts - options
         * @protected
         */
        constructor(opts) {
            super();
            this.writable = false;
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.query = opts.query;
            this.socket = opts.socket;
        }
        /**
         * Emits an error.
         *
         * @param {String} reason
         * @param description
         * @param context - the error context
         * @return {Transport} for chaining
         * @protected
         */
        onError(reason, description, context) {
            super.emitReserved("error", new TransportError(reason, description, context));
            return this;
        }
        /**
         * Opens the transport.
         */
        open() {
            this.readyState = "opening";
            this.doOpen();
            return this;
        }
        /**
         * Closes the transport.
         */
        close() {
            if (this.readyState === "opening" || this.readyState === "open") {
                this.doClose();
                this.onClose();
            }
            return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         */
        send(packets) {
            if (this.readyState === "open") {
                this.write(packets);
            }
        }
        /**
         * Called upon open
         *
         * @protected
         */
        onOpen() {
            this.readyState = "open";
            this.writable = true;
            super.emitReserved("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @protected
         */
        onData(data) {
            const packet = decodePacket(data, this.socket.binaryType);
            this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @protected
         */
        onPacket(packet) {
            super.emitReserved("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @protected
         */
        onClose(details) {
            this.readyState = "closed";
            super.emitReserved("close", details);
        }
        /**
         * Pauses the transport, in order not to lose packets during an upgrade.
         *
         * @param onPause
         */
        pause(onPause) { }
    }

    // imported from https://github.com/unshiftio/yeast
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''), length = 64, map = {};
    let seed = 0, i = 0, prev;
    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode$1(num) {
        let encoded = '';
        do {
            encoded = alphabet[num % length] + encoded;
            num = Math.floor(num / length);
        } while (num > 0);
        return encoded;
    }
    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
        const now = encode$1(+new Date());
        if (now !== prev)
            return seed = 0, prev = now;
        return now + '.' + encode$1(seed++);
    }
    //
    // Map each character to its index.
    //
    for (; i < length; i++)
        map[alphabet[i]] = i;

    // imported from https://github.com/galkn/querystring
    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    function encode(obj) {
        let str = '';
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (str.length)
                    str += '&';
                str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
        }
        return str;
    }
    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */
    function decode(qs) {
        let qry = {};
        let pairs = qs.split('&');
        for (let i = 0, l = pairs.length; i < l; i++) {
            let pair = pairs[i].split('=');
            qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return qry;
    }

    // imported from https://github.com/component/has-cors
    let value = false;
    try {
        value = typeof XMLHttpRequest !== 'undefined' &&
            'withCredentials' in new XMLHttpRequest();
    }
    catch (err) {
        // if XMLHttp support is disabled in IE then it will throw
        // when trying to create
    }
    const hasCORS = value;

    // browser shim for xmlhttprequest module
    function XHR(opts) {
        const xdomain = opts.xdomain;
        // XMLHttpRequest can be disabled on IE
        try {
            if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
                return new XMLHttpRequest();
            }
        }
        catch (e) { }
        if (!xdomain) {
            try {
                return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
            }
            catch (e) { }
        }
    }

    function empty() { }
    const hasXHR2 = (function () {
        const xhr = new XHR({
            xdomain: false,
        });
        return null != xhr.responseType;
    })();
    class Polling extends Transport {
        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @package
         */
        constructor(opts) {
            super(opts);
            this.polling = false;
            if (typeof location !== "undefined") {
                const isSSL = "https:" === location.protocol;
                let port = location.port;
                // some user agents have empty `location.port`
                if (!port) {
                    port = isSSL ? "443" : "80";
                }
                this.xd =
                    (typeof location !== "undefined" &&
                        opts.hostname !== location.hostname) ||
                        port !== opts.port;
                this.xs = opts.secure !== isSSL;
            }
            /**
             * XHR supports binary
             */
            const forceBase64 = opts && opts.forceBase64;
            this.supportsBinary = hasXHR2 && !forceBase64;
        }
        get name() {
            return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @protected
         */
        doOpen() {
            this.poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} onPause - callback upon buffers are flushed and transport is paused
         * @package
         */
        pause(onPause) {
            this.readyState = "pausing";
            const pause = () => {
                this.readyState = "paused";
                onPause();
            };
            if (this.polling || !this.writable) {
                let total = 0;
                if (this.polling) {
                    total++;
                    this.once("pollComplete", function () {
                        --total || pause();
                    });
                }
                if (!this.writable) {
                    total++;
                    this.once("drain", function () {
                        --total || pause();
                    });
                }
            }
            else {
                pause();
            }
        }
        /**
         * Starts polling cycle.
         *
         * @private
         */
        poll() {
            this.polling = true;
            this.doPoll();
            this.emitReserved("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @protected
         */
        onData(data) {
            const callback = (packet) => {
                // if its the first message we consider the transport open
                if ("opening" === this.readyState && packet.type === "open") {
                    this.onOpen();
                }
                // if its a close packet, we close the ongoing requests
                if ("close" === packet.type) {
                    this.onClose({ description: "transport closed by the server" });
                    return false;
                }
                // otherwise bypass onData and handle the message
                this.onPacket(packet);
            };
            // decode payload
            decodePayload(data, this.socket.binaryType).forEach(callback);
            // if an event did not trigger closing
            if ("closed" !== this.readyState) {
                // if we got data we're not polling
                this.polling = false;
                this.emitReserved("pollComplete");
                if ("open" === this.readyState) {
                    this.poll();
                }
            }
        }
        /**
         * For polling, send a close packet.
         *
         * @protected
         */
        doClose() {
            const close = () => {
                this.write([{ type: "close" }]);
            };
            if ("open" === this.readyState) {
                close();
            }
            else {
                // in case we're trying to close while
                // handshaking is in progress (GH-164)
                this.once("open", close);
            }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} packets - data packets
         * @protected
         */
        write(packets) {
            this.writable = false;
            encodePayload(packets, (data) => {
                this.doWrite(data, () => {
                    this.writable = true;
                    this.emitReserved("drain");
                });
            });
        }
        /**
         * Generates uri for connection.
         *
         * @private
         */
        uri() {
            let query = this.query || {};
            const schema = this.opts.secure ? "https" : "http";
            let port = "";
            // cache busting is forced
            if (false !== this.opts.timestampRequests) {
                query[this.opts.timestampParam] = yeast();
            }
            if (!this.supportsBinary && !query.sid) {
                query.b64 = 1;
            }
            // avoid port if default for schema
            if (this.opts.port &&
                (("https" === schema && Number(this.opts.port) !== 443) ||
                    ("http" === schema && Number(this.opts.port) !== 80))) {
                port = ":" + this.opts.port;
            }
            const encodedQuery = encode(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (schema +
                "://" +
                (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                port +
                this.opts.path +
                (encodedQuery.length ? "?" + encodedQuery : ""));
        }
        /**
         * Creates a request.
         *
         * @param {String} method
         * @private
         */
        request(opts = {}) {
            Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
            return new Request(this.uri(), opts);
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @private
         */
        doWrite(data, fn) {
            const req = this.request({
                method: "POST",
                data: data,
            });
            req.on("success", fn);
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr post error", xhrStatus, context);
            });
        }
        /**
         * Starts a poll cycle.
         *
         * @private
         */
        doPoll() {
            const req = this.request();
            req.on("data", this.onData.bind(this));
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr poll error", xhrStatus, context);
            });
            this.pollXhr = req;
        }
    }
    class Request extends Emitter {
        /**
         * Request constructor
         *
         * @param {Object} options
         * @package
         */
        constructor(uri, opts) {
            super();
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.method = opts.method || "GET";
            this.uri = uri;
            this.async = false !== opts.async;
            this.data = undefined !== opts.data ? opts.data : null;
            this.create();
        }
        /**
         * Creates the XHR object and sends the request.
         *
         * @private
         */
        create() {
            const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
            opts.xdomain = !!this.opts.xd;
            opts.xscheme = !!this.opts.xs;
            const xhr = (this.xhr = new XHR(opts));
            try {
                xhr.open(this.method, this.uri, this.async);
                try {
                    if (this.opts.extraHeaders) {
                        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                        for (let i in this.opts.extraHeaders) {
                            if (this.opts.extraHeaders.hasOwnProperty(i)) {
                                xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                            }
                        }
                    }
                }
                catch (e) { }
                if ("POST" === this.method) {
                    try {
                        xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                    }
                    catch (e) { }
                }
                try {
                    xhr.setRequestHeader("Accept", "*/*");
                }
                catch (e) { }
                // ie6 check
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = this.opts.withCredentials;
                }
                if (this.opts.requestTimeout) {
                    xhr.timeout = this.opts.requestTimeout;
                }
                xhr.onreadystatechange = () => {
                    if (4 !== xhr.readyState)
                        return;
                    if (200 === xhr.status || 1223 === xhr.status) {
                        this.onLoad();
                    }
                    else {
                        // make sure the `error` event handler that's user-set
                        // does not throw in the same tick and gets caught here
                        this.setTimeoutFn(() => {
                            this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                        }, 0);
                    }
                };
                xhr.send(this.data);
            }
            catch (e) {
                // Need to defer since .create() is called directly from the constructor
                // and thus the 'error' event can only be only bound *after* this exception
                // occurs.  Therefore, also, we cannot throw here at all.
                this.setTimeoutFn(() => {
                    this.onError(e);
                }, 0);
                return;
            }
            if (typeof document !== "undefined") {
                this.index = Request.requestsCount++;
                Request.requests[this.index] = this;
            }
        }
        /**
         * Called upon error.
         *
         * @private
         */
        onError(err) {
            this.emitReserved("error", err, this.xhr);
            this.cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @private
         */
        cleanup(fromError) {
            if ("undefined" === typeof this.xhr || null === this.xhr) {
                return;
            }
            this.xhr.onreadystatechange = empty;
            if (fromError) {
                try {
                    this.xhr.abort();
                }
                catch (e) { }
            }
            if (typeof document !== "undefined") {
                delete Request.requests[this.index];
            }
            this.xhr = null;
        }
        /**
         * Called upon load.
         *
         * @private
         */
        onLoad() {
            const data = this.xhr.responseText;
            if (data !== null) {
                this.emitReserved("data", data);
                this.emitReserved("success");
                this.cleanup();
            }
        }
        /**
         * Aborts the request.
         *
         * @package
         */
        abort() {
            this.cleanup();
        }
    }
    Request.requestsCount = 0;
    Request.requests = {};
    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */
    if (typeof document !== "undefined") {
        // @ts-ignore
        if (typeof attachEvent === "function") {
            // @ts-ignore
            attachEvent("onunload", unloadHandler);
        }
        else if (typeof addEventListener === "function") {
            const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
            addEventListener(terminationEvent, unloadHandler, false);
        }
    }
    function unloadHandler() {
        for (let i in Request.requests) {
            if (Request.requests.hasOwnProperty(i)) {
                Request.requests[i].abort();
            }
        }
    }

    const nextTick = (() => {
        const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
        if (isPromiseAvailable) {
            return (cb) => Promise.resolve().then(cb);
        }
        else {
            return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
        }
    })();
    const WebSocket = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
    const usingBrowserWebSocket = true;
    const defaultBinaryType = "arraybuffer";

    // detect ReactNative environment
    const isReactNative = typeof navigator !== "undefined" &&
        typeof navigator.product === "string" &&
        navigator.product.toLowerCase() === "reactnative";
    class WS extends Transport {
        /**
         * WebSocket transport constructor.
         *
         * @param {Object} opts - connection options
         * @protected
         */
        constructor(opts) {
            super(opts);
            this.supportsBinary = !opts.forceBase64;
        }
        get name() {
            return "websocket";
        }
        doOpen() {
            if (!this.check()) {
                // let probe timeout
                return;
            }
            const uri = this.uri();
            const protocols = this.opts.protocols;
            // React Native only supports the 'headers' option, and will print a warning if anything else is passed
            const opts = isReactNative
                ? {}
                : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
            if (this.opts.extraHeaders) {
                opts.headers = this.opts.extraHeaders;
            }
            try {
                this.ws =
                    usingBrowserWebSocket && !isReactNative
                        ? protocols
                            ? new WebSocket(uri, protocols)
                            : new WebSocket(uri)
                        : new WebSocket(uri, protocols, opts);
            }
            catch (err) {
                return this.emitReserved("error", err);
            }
            this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
            this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @private
         */
        addEventListeners() {
            this.ws.onopen = () => {
                if (this.opts.autoUnref) {
                    this.ws._socket.unref();
                }
                this.onOpen();
            };
            this.ws.onclose = (closeEvent) => this.onClose({
                description: "websocket connection closed",
                context: closeEvent,
            });
            this.ws.onmessage = (ev) => this.onData(ev.data);
            this.ws.onerror = (e) => this.onError("websocket error", e);
        }
        write(packets) {
            this.writable = false;
            // encodePacket efficient as it uses WS framing
            // no need for encodePayload
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                const lastPacket = i === packets.length - 1;
                encodePacket(packet, this.supportsBinary, (data) => {
                    // always create a new object (GH-437)
                    const opts = {};
                    // Sometimes the websocket has already been closed but the browser didn't
                    // have a chance of informing us about it yet, in that case send will
                    // throw an error
                    try {
                        if (usingBrowserWebSocket) {
                            // TypeError is thrown when passing the second argument on Safari
                            this.ws.send(data);
                        }
                    }
                    catch (e) {
                    }
                    if (lastPacket) {
                        // fake drain
                        // defer to next tick to allow Socket to clear writeBuffer
                        nextTick(() => {
                            this.writable = true;
                            this.emitReserved("drain");
                        }, this.setTimeoutFn);
                    }
                });
            }
        }
        doClose() {
            if (typeof this.ws !== "undefined") {
                this.ws.close();
                this.ws = null;
            }
        }
        /**
         * Generates uri for connection.
         *
         * @private
         */
        uri() {
            let query = this.query || {};
            const schema = this.opts.secure ? "wss" : "ws";
            let port = "";
            // avoid port if default for schema
            if (this.opts.port &&
                (("wss" === schema && Number(this.opts.port) !== 443) ||
                    ("ws" === schema && Number(this.opts.port) !== 80))) {
                port = ":" + this.opts.port;
            }
            // append timestamp to URI
            if (this.opts.timestampRequests) {
                query[this.opts.timestampParam] = yeast();
            }
            // communicate binary support capabilities
            if (!this.supportsBinary) {
                query.b64 = 1;
            }
            const encodedQuery = encode(query);
            const ipv6 = this.opts.hostname.indexOf(":") !== -1;
            return (schema +
                "://" +
                (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
                port +
                this.opts.path +
                (encodedQuery.length ? "?" + encodedQuery : ""));
        }
        /**
         * Feature detection for WebSocket.
         *
         * @return {Boolean} whether this transport is available.
         * @private
         */
        check() {
            return !!WebSocket;
        }
    }

    const transports = {
        websocket: WS,
        polling: Polling,
    };

    // imported from https://github.com/galkn/parseuri
    /**
     * Parses a URI
     *
     * Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
     *
     * See:
     * - https://developer.mozilla.org/en-US/docs/Web/API/URL
     * - https://caniuse.com/url
     * - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
     *
     * History of the parse() method:
     * - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
     * - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
     * - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    const parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];
    function parse(str) {
        const src = str, b = str.indexOf('['), e = str.indexOf(']');
        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }
        let m = re.exec(str || ''), uri = {}, i = 14;
        while (i--) {
            uri[parts[i]] = m[i] || '';
        }
        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }
        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);
        return uri;
    }
    function pathNames(obj, path) {
        const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
        if (path.slice(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.slice(-1) == '/') {
            names.splice(names.length - 1, 1);
        }
        return names;
    }
    function queryKey(uri, query) {
        const data = {};
        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });
        return data;
    }

    let Socket$1 = class Socket extends Emitter {
        /**
         * Socket constructor.
         *
         * @param {String|Object} uri - uri or options
         * @param {Object} opts - options
         */
        constructor(uri, opts = {}) {
            super();
            this.writeBuffer = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = null;
            }
            if (uri) {
                uri = parse(uri);
                opts.hostname = uri.host;
                opts.secure = uri.protocol === "https" || uri.protocol === "wss";
                opts.port = uri.port;
                if (uri.query)
                    opts.query = uri.query;
            }
            else if (opts.host) {
                opts.hostname = parse(opts.host).host;
            }
            installTimerFunctions(this, opts);
            this.secure =
                null != opts.secure
                    ? opts.secure
                    : typeof location !== "undefined" && "https:" === location.protocol;
            if (opts.hostname && !opts.port) {
                // if no port is specified manually, use the protocol default
                opts.port = this.secure ? "443" : "80";
            }
            this.hostname =
                opts.hostname ||
                    (typeof location !== "undefined" ? location.hostname : "localhost");
            this.port =
                opts.port ||
                    (typeof location !== "undefined" && location.port
                        ? location.port
                        : this.secure
                            ? "443"
                            : "80");
            this.transports = opts.transports || ["polling", "websocket"];
            this.writeBuffer = [];
            this.prevBufferLen = 0;
            this.opts = Object.assign({
                path: "/engine.io",
                agent: false,
                withCredentials: false,
                upgrade: true,
                timestampParam: "t",
                rememberUpgrade: false,
                addTrailingSlash: true,
                rejectUnauthorized: true,
                perMessageDeflate: {
                    threshold: 1024,
                },
                transportOptions: {},
                closeOnBeforeunload: true,
            }, opts);
            this.opts.path =
                this.opts.path.replace(/\/$/, "") +
                    (this.opts.addTrailingSlash ? "/" : "");
            if (typeof this.opts.query === "string") {
                this.opts.query = decode(this.opts.query);
            }
            // set on handshake
            this.id = null;
            this.upgrades = null;
            this.pingInterval = null;
            this.pingTimeout = null;
            // set on heartbeat
            this.pingTimeoutTimer = null;
            if (typeof addEventListener === "function") {
                if (this.opts.closeOnBeforeunload) {
                    // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                    // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                    // closed/reloaded)
                    this.beforeunloadEventListener = () => {
                        if (this.transport) {
                            // silently close the transport
                            this.transport.removeAllListeners();
                            this.transport.close();
                        }
                    };
                    addEventListener("beforeunload", this.beforeunloadEventListener, false);
                }
                if (this.hostname !== "localhost") {
                    this.offlineEventListener = () => {
                        this.onClose("transport close", {
                            description: "network connection lost",
                        });
                    };
                    addEventListener("offline", this.offlineEventListener, false);
                }
            }
            this.open();
        }
        /**
         * Creates transport of the given type.
         *
         * @param {String} name - transport name
         * @return {Transport}
         * @private
         */
        createTransport(name) {
            const query = Object.assign({}, this.opts.query);
            // append engine.io protocol identifier
            query.EIO = protocol$1;
            // transport name
            query.transport = name;
            // session id if we already have one
            if (this.id)
                query.sid = this.id;
            const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
                query,
                socket: this,
                hostname: this.hostname,
                secure: this.secure,
                port: this.port,
            });
            return new transports[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @private
         */
        open() {
            let transport;
            if (this.opts.rememberUpgrade &&
                Socket.priorWebsocketSuccess &&
                this.transports.indexOf("websocket") !== -1) {
                transport = "websocket";
            }
            else if (0 === this.transports.length) {
                // Emit error on next tick so it can be listened to
                this.setTimeoutFn(() => {
                    this.emitReserved("error", "No transports available");
                }, 0);
                return;
            }
            else {
                transport = this.transports[0];
            }
            this.readyState = "opening";
            // Retry with the next transport if the transport is disabled (jsonp: false)
            try {
                transport = this.createTransport(transport);
            }
            catch (e) {
                this.transports.shift();
                this.open();
                return;
            }
            transport.open();
            this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @private
         */
        setTransport(transport) {
            if (this.transport) {
                this.transport.removeAllListeners();
            }
            // set up transport
            this.transport = transport;
            // set up transport listeners
            transport
                .on("drain", this.onDrain.bind(this))
                .on("packet", this.onPacket.bind(this))
                .on("error", this.onError.bind(this))
                .on("close", (reason) => this.onClose("transport close", reason));
        }
        /**
         * Probes a transport.
         *
         * @param {String} name - transport name
         * @private
         */
        probe(name) {
            let transport = this.createTransport(name);
            let failed = false;
            Socket.priorWebsocketSuccess = false;
            const onTransportOpen = () => {
                if (failed)
                    return;
                transport.send([{ type: "ping", data: "probe" }]);
                transport.once("packet", (msg) => {
                    if (failed)
                        return;
                    if ("pong" === msg.type && "probe" === msg.data) {
                        this.upgrading = true;
                        this.emitReserved("upgrading", transport);
                        if (!transport)
                            return;
                        Socket.priorWebsocketSuccess = "websocket" === transport.name;
                        this.transport.pause(() => {
                            if (failed)
                                return;
                            if ("closed" === this.readyState)
                                return;
                            cleanup();
                            this.setTransport(transport);
                            transport.send([{ type: "upgrade" }]);
                            this.emitReserved("upgrade", transport);
                            transport = null;
                            this.upgrading = false;
                            this.flush();
                        });
                    }
                    else {
                        const err = new Error("probe error");
                        // @ts-ignore
                        err.transport = transport.name;
                        this.emitReserved("upgradeError", err);
                    }
                });
            };
            function freezeTransport() {
                if (failed)
                    return;
                // Any callback called by transport should be ignored since now
                failed = true;
                cleanup();
                transport.close();
                transport = null;
            }
            // Handle any error that happens while probing
            const onerror = (err) => {
                const error = new Error("probe error: " + err);
                // @ts-ignore
                error.transport = transport.name;
                freezeTransport();
                this.emitReserved("upgradeError", error);
            };
            function onTransportClose() {
                onerror("transport closed");
            }
            // When the socket is closed while we're probing
            function onclose() {
                onerror("socket closed");
            }
            // When the socket is upgraded while we're probing
            function onupgrade(to) {
                if (transport && to.name !== transport.name) {
                    freezeTransport();
                }
            }
            // Remove all listeners on the transport and on self
            const cleanup = () => {
                transport.removeListener("open", onTransportOpen);
                transport.removeListener("error", onerror);
                transport.removeListener("close", onTransportClose);
                this.off("close", onclose);
                this.off("upgrading", onupgrade);
            };
            transport.once("open", onTransportOpen);
            transport.once("error", onerror);
            transport.once("close", onTransportClose);
            this.once("close", onclose);
            this.once("upgrading", onupgrade);
            transport.open();
        }
        /**
         * Called when connection is deemed open.
         *
         * @private
         */
        onOpen() {
            this.readyState = "open";
            Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
            this.emitReserved("open");
            this.flush();
            // we check for `readyState` in case an `open`
            // listener already closed the socket
            if ("open" === this.readyState && this.opts.upgrade) {
                let i = 0;
                const l = this.upgrades.length;
                for (; i < l; i++) {
                    this.probe(this.upgrades[i]);
                }
            }
        }
        /**
         * Handles a packet.
         *
         * @private
         */
        onPacket(packet) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                this.emitReserved("packet", packet);
                // Socket is live - any packet counts
                this.emitReserved("heartbeat");
                switch (packet.type) {
                    case "open":
                        this.onHandshake(JSON.parse(packet.data));
                        break;
                    case "ping":
                        this.resetPingTimeout();
                        this.sendPacket("pong");
                        this.emitReserved("ping");
                        this.emitReserved("pong");
                        break;
                    case "error":
                        const err = new Error("server error");
                        // @ts-ignore
                        err.code = packet.data;
                        this.onError(err);
                        break;
                    case "message":
                        this.emitReserved("data", packet.data);
                        this.emitReserved("message", packet.data);
                        break;
                }
            }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @private
         */
        onHandshake(data) {
            this.emitReserved("handshake", data);
            this.id = data.sid;
            this.transport.query.sid = data.sid;
            this.upgrades = this.filterUpgrades(data.upgrades);
            this.pingInterval = data.pingInterval;
            this.pingTimeout = data.pingTimeout;
            this.maxPayload = data.maxPayload;
            this.onOpen();
            // In case open handler closes socket
            if ("closed" === this.readyState)
                return;
            this.resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @private
         */
        resetPingTimeout() {
            this.clearTimeoutFn(this.pingTimeoutTimer);
            this.pingTimeoutTimer = this.setTimeoutFn(() => {
                this.onClose("ping timeout");
            }, this.pingInterval + this.pingTimeout);
            if (this.opts.autoUnref) {
                this.pingTimeoutTimer.unref();
            }
        }
        /**
         * Called on `drain` event
         *
         * @private
         */
        onDrain() {
            this.writeBuffer.splice(0, this.prevBufferLen);
            // setting prevBufferLen = 0 is very important
            // for example, when upgrading, upgrade packet is sent over,
            // and a nonzero prevBufferLen could cause problems on `drain`
            this.prevBufferLen = 0;
            if (0 === this.writeBuffer.length) {
                this.emitReserved("drain");
            }
            else {
                this.flush();
            }
        }
        /**
         * Flush write buffers.
         *
         * @private
         */
        flush() {
            if ("closed" !== this.readyState &&
                this.transport.writable &&
                !this.upgrading &&
                this.writeBuffer.length) {
                const packets = this.getWritablePackets();
                this.transport.send(packets);
                // keep track of current length of writeBuffer
                // splice writeBuffer and callbackBuffer on `drain`
                this.prevBufferLen = packets.length;
                this.emitReserved("flush");
            }
        }
        /**
         * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
         * long-polling)
         *
         * @private
         */
        getWritablePackets() {
            const shouldCheckPayloadSize = this.maxPayload &&
                this.transport.name === "polling" &&
                this.writeBuffer.length > 1;
            if (!shouldCheckPayloadSize) {
                return this.writeBuffer;
            }
            let payloadSize = 1; // first packet type
            for (let i = 0; i < this.writeBuffer.length; i++) {
                const data = this.writeBuffer[i].data;
                if (data) {
                    payloadSize += byteLength(data);
                }
                if (i > 0 && payloadSize > this.maxPayload) {
                    return this.writeBuffer.slice(0, i);
                }
                payloadSize += 2; // separator + packet type
            }
            return this.writeBuffer;
        }
        /**
         * Sends a message.
         *
         * @param {String} msg - message.
         * @param {Object} options.
         * @param {Function} callback function.
         * @return {Socket} for chaining.
         */
        write(msg, options, fn) {
            this.sendPacket("message", msg, options, fn);
            return this;
        }
        send(msg, options, fn) {
            this.sendPacket("message", msg, options, fn);
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} type: packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} fn - callback function.
         * @private
         */
        sendPacket(type, data, options, fn) {
            if ("function" === typeof data) {
                fn = data;
                data = undefined;
            }
            if ("function" === typeof options) {
                fn = options;
                options = null;
            }
            if ("closing" === this.readyState || "closed" === this.readyState) {
                return;
            }
            options = options || {};
            options.compress = false !== options.compress;
            const packet = {
                type: type,
                data: data,
                options: options,
            };
            this.emitReserved("packetCreate", packet);
            this.writeBuffer.push(packet);
            if (fn)
                this.once("flush", fn);
            this.flush();
        }
        /**
         * Closes the connection.
         */
        close() {
            const close = () => {
                this.onClose("forced close");
                this.transport.close();
            };
            const cleanupAndClose = () => {
                this.off("upgrade", cleanupAndClose);
                this.off("upgradeError", cleanupAndClose);
                close();
            };
            const waitForUpgrade = () => {
                // wait for upgrade to finish since we can't send packets while pausing a transport
                this.once("upgrade", cleanupAndClose);
                this.once("upgradeError", cleanupAndClose);
            };
            if ("opening" === this.readyState || "open" === this.readyState) {
                this.readyState = "closing";
                if (this.writeBuffer.length) {
                    this.once("drain", () => {
                        if (this.upgrading) {
                            waitForUpgrade();
                        }
                        else {
                            close();
                        }
                    });
                }
                else if (this.upgrading) {
                    waitForUpgrade();
                }
                else {
                    close();
                }
            }
            return this;
        }
        /**
         * Called upon transport error
         *
         * @private
         */
        onError(err) {
            Socket.priorWebsocketSuccess = false;
            this.emitReserved("error", err);
            this.onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @private
         */
        onClose(reason, description) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                // clear timers
                this.clearTimeoutFn(this.pingTimeoutTimer);
                // stop event from firing again for transport
                this.transport.removeAllListeners("close");
                // ensure transport won't stay open
                this.transport.close();
                // ignore further transport communication
                this.transport.removeAllListeners();
                if (typeof removeEventListener === "function") {
                    removeEventListener("beforeunload", this.beforeunloadEventListener, false);
                    removeEventListener("offline", this.offlineEventListener, false);
                }
                // set ready state
                this.readyState = "closed";
                // clear session id
                this.id = null;
                // emit close event
                this.emitReserved("close", reason, description);
                // clean buffers after, so users can still
                // grab the buffers on `close` event
                this.writeBuffer = [];
                this.prevBufferLen = 0;
            }
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} upgrades - server upgrades
         * @private
         */
        filterUpgrades(upgrades) {
            const filteredUpgrades = [];
            let i = 0;
            const j = upgrades.length;
            for (; i < j; i++) {
                if (~this.transports.indexOf(upgrades[i]))
                    filteredUpgrades.push(upgrades[i]);
            }
            return filteredUpgrades;
        }
    };
    Socket$1.protocol = protocol$1;

    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            obj = parse(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }

    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        delete packet.attachments; // no longer useful
        return packet;
    }
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder === true) {
            const isIndexValid = typeof data.num === "number" &&
                data.num >= 0 &&
                data.num < buffers.length;
            if (isIndexValid) {
                return buffers[data.num]; // appropriate buffer (should be natural order anyway)
            }
            else {
                throw new Error("illegal attachments");
            }
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }

    /**
     * These strings must not be used as event names, as they have a special meaning.
     */
    const RESERVED_EVENTS$1 = [
        "connect",
        "connect_error",
        "disconnect",
        "disconnecting",
        "newListener",
        "removeListener", // used by the Node.js EventEmitter
    ];
    /**
     * Protocol version.
     *
     * @public
     */
    const protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType || (PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encoder constructor
         *
         * @param {function} replacer - custom replacer to pass down to JSON.parse
         */
        constructor(replacer) {
            this.replacer = replacer;
        }
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (hasBinary(obj)) {
                    return this.encodeAsBinary({
                        type: obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK,
                        nsp: obj.nsp,
                        data: obj.data,
                        id: obj.id,
                    });
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data, this.replacer);
            }
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    // see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
    function isObject(value) {
        return Object.prototype.toString.call(value) === "[object Object]";
    }
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends Emitter {
        /**
         * Decoder constructor
         *
         * @param {function} reviver - custom reviver to pass down to JSON.stringify
         */
        constructor(reviver) {
            super();
            this.reviver = reviver;
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                if (this.reconstructor) {
                    throw new Error("got plaintext data when reconstructing a packet");
                }
                packet = this.decodeString(obj);
                const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
                if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
                    packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emitReserved("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emitReserved("decoded", packet);
                }
            }
            else if (isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emitReserved("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = this.tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            return p;
        }
        tryParse(str) {
            try {
                return JSON.parse(str, this.reviver);
            }
            catch (e) {
                return false;
            }
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return isObject(payload);
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || isObject(payload);
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return (Array.isArray(payload) &&
                        (typeof payload[0] === "number" ||
                            (typeof payload[0] === "string" &&
                                RESERVED_EVENTS$1.indexOf(payload[0]) === -1)));
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
                this.reconstructor = null;
            }
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }

    var parser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Decoder: Decoder,
        Encoder: Encoder,
        get PacketType () { return PacketType; },
        protocol: protocol
    });

    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }

    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    /**
     * A Socket is the fundamental class for interacting with the server.
     *
     * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log("connected");
     * });
     *
     * // send an event to the server
     * socket.emit("foo", "bar");
     *
     * socket.on("foobar", () => {
     *   // an event was received from the server
     * });
     *
     * // upon disconnection
     * socket.on("disconnect", (reason) => {
     *   console.log(`disconnected due to ${reason}`);
     * });
     */
    class Socket extends Emitter {
        /**
         * `Socket` constructor.
         */
        constructor(io, nsp, opts) {
            super();
            /**
             * Whether the socket is currently connected to the server.
             *
             * @example
             * const socket = io();
             *
             * socket.on("connect", () => {
             *   console.log(socket.connected); // true
             * });
             *
             * socket.on("disconnect", () => {
             *   console.log(socket.connected); // false
             * });
             */
            this.connected = false;
            /**
             * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
             * be transmitted by the server.
             */
            this.recovered = false;
            /**
             * Buffer for packets received before the CONNECT packet
             */
            this.receiveBuffer = [];
            /**
             * Buffer for packets that will be sent once the socket is connected
             */
            this.sendBuffer = [];
            /**
             * The queue of packets to be sent with retry in case of failure.
             *
             * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
             * @private
             */
            this._queue = [];
            /**
             * A sequence to generate the ID of the {@link QueuedPacket}.
             * @private
             */
            this._queueSeq = 0;
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            this._opts = Object.assign({}, opts);
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Whether the socket is currently disconnected
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log(socket.disconnected); // false
         * });
         *
         * socket.on("disconnect", () => {
         *   console.log(socket.disconnected); // true
         * });
         */
        get disconnected() {
            return !this.connected;
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on(io, "open", this.onopen.bind(this)),
                on(io, "packet", this.onpacket.bind(this)),
                on(io, "error", this.onerror.bind(this)),
                on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects.
         *
         * @example
         * const socket = io();
         *
         * console.log(socket.active); // true
         *
         * socket.on("disconnect", (reason) => {
         *   if (reason === "io server disconnect") {
         *     // the disconnection was initiated by the server, you need to manually reconnect
         *     console.log(socket.active); // false
         *   }
         *   // else the socket will automatically try to reconnect
         *   console.log(socket.active); // true
         * });
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @example
         * const socket = io({
         *   autoConnect: false
         * });
         *
         * socket.connect();
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for {@link connect()}.
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * This method mimics the WebSocket.send() method.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
         *
         * @example
         * socket.send("hello");
         *
         * // this is equivalent to
         * socket.emit("message", "hello");
         *
         * @return self
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @example
         * socket.emit("hello", "world");
         *
         * // all serializable datastructures are supported (no need to call JSON.stringify)
         * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
         *
         * // with an acknowledgement from the server
         * socket.emit("hello", "world", (val) => {
         *   // ...
         * });
         *
         * @return self
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev.toString() + '" is a reserved event name');
            }
            args.unshift(ev);
            if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
                this._addToQueue(args);
                return this;
            }
            const packet = {
                type: PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                const id = this.ids++;
                const ack = args.pop();
                this._registerAckCallback(id, ack);
                packet.id = id;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) ;
            else if (this.connected) {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * @private
         */
        _registerAckCallback(id, ack) {
            var _a;
            const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
            if (timeout === undefined) {
                this.acks[id] = ack;
                return;
            }
            // @ts-ignore
            const timer = this.io.setTimeoutFn(() => {
                delete this.acks[id];
                for (let i = 0; i < this.sendBuffer.length; i++) {
                    if (this.sendBuffer[i].id === id) {
                        this.sendBuffer.splice(i, 1);
                    }
                }
                ack.call(this, new Error("operation has timed out"));
            }, timeout);
            this.acks[id] = (...args) => {
                // @ts-ignore
                this.io.clearTimeoutFn(timer);
                ack.apply(this, [null, ...args]);
            };
        }
        /**
         * Emits an event and waits for an acknowledgement
         *
         * @example
         * // without timeout
         * const response = await socket.emitWithAck("hello", "world");
         *
         * // with a specific timeout
         * try {
         *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
         * } catch (err) {
         *   // the server did not acknowledge the event in the given delay
         * }
         *
         * @return a Promise that will be fulfilled when the server acknowledges the event
         */
        emitWithAck(ev, ...args) {
            // the timeout flag is optional
            const withErr = this.flags.timeout !== undefined || this._opts.ackTimeout !== undefined;
            return new Promise((resolve, reject) => {
                args.push((arg1, arg2) => {
                    if (withErr) {
                        return arg1 ? reject(arg1) : resolve(arg2);
                    }
                    else {
                        return resolve(arg1);
                    }
                });
                this.emit(ev, ...args);
            });
        }
        /**
         * Add the packet to the queue.
         * @param args
         * @private
         */
        _addToQueue(args) {
            let ack;
            if (typeof args[args.length - 1] === "function") {
                ack = args.pop();
            }
            const packet = {
                id: this._queueSeq++,
                tryCount: 0,
                pending: false,
                args,
                flags: Object.assign({ fromQueue: true }, this.flags),
            };
            args.push((err, ...responseArgs) => {
                if (packet !== this._queue[0]) {
                    // the packet has already been acknowledged
                    return;
                }
                const hasError = err !== null;
                if (hasError) {
                    if (packet.tryCount > this._opts.retries) {
                        this._queue.shift();
                        if (ack) {
                            ack(err);
                        }
                    }
                }
                else {
                    this._queue.shift();
                    if (ack) {
                        ack(null, ...responseArgs);
                    }
                }
                packet.pending = false;
                return this._drainQueue();
            });
            this._queue.push(packet);
            this._drainQueue();
        }
        /**
         * Send the first packet of the queue, and wait for an acknowledgement from the server.
         * @param force - whether to resend a packet that has not been acknowledged yet
         *
         * @private
         */
        _drainQueue(force = false) {
            if (!this.connected || this._queue.length === 0) {
                return;
            }
            const packet = this._queue[0];
            if (packet.pending && !force) {
                return;
            }
            packet.pending = true;
            packet.tryCount++;
            this.flags = packet.flags;
            this.emit.apply(this, packet.args);
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this._sendConnectPacket(data);
                });
            }
            else {
                this._sendConnectPacket(this.auth);
            }
        }
        /**
         * Sends a CONNECT packet to initiate the Socket.IO session.
         *
         * @param data
         * @private
         */
        _sendConnectPacket(data) {
            this.packet({
                type: PacketType.CONNECT,
                data: this._pid
                    ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data)
                    : data,
            });
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @param description
         * @private
         */
        onclose(reason, description) {
            this.connected = false;
            delete this.id;
            this.emitReserved("disconnect", reason, description);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        this.onconnect(packet.data.sid, packet.data.pid);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case PacketType.CONNECT_ERROR:
                    this.destroy();
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            if (null != packet.id) {
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
            if (this._pid && args.length && typeof args[args.length - 1] === "string") {
                this._lastOffset = args[args.length - 1];
            }
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                self.packet({
                    type: PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id, pid) {
            this.id = id;
            this.recovered = pid && this._pid === pid;
            this._pid = pid; // defined only if connection state recovery is enabled
            this.connected = true;
            this.emitBuffered();
            this.emitReserved("connect");
            this._drainQueue(true);
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            });
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually. In that case, the socket will not try to reconnect.
         *
         * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
         *
         * @example
         * const socket = io();
         *
         * socket.on("disconnect", (reason) => {
         *   // console.log(reason); prints "io client disconnect"
         * });
         *
         * socket.disconnect();
         *
         * @return self
         */
        disconnect() {
            if (this.connected) {
                this.packet({ type: PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for {@link disconnect()}.
         *
         * @return self
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @example
         * socket.compress(false).emit("hello");
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @example
         * socket.volatile.emit("hello"); // the server may or may not receive it
         *
         * @returns self
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * @example
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         *
         * @returns self
         */
        timeout(timeout) {
            this.flags.timeout = timeout;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @example
         * socket.onAny((event, ...args) => {
         *   console.log(`got ${event}`);
         * });
         *
         * @param listener
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @example
         * socket.prependAny((event, ...args) => {
         *   console.log(`got event ${event}`);
         * });
         *
         * @param listener
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`got event ${event}`);
         * }
         *
         * socket.onAny(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAny(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAny();
         *
         * @param listener
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAny() {
            return this._anyListeners || [];
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.onAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        onAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.prependAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        prependAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`sent event ${event}`);
         * }
         *
         * socket.onAnyOutgoing(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAnyOutgoing(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAnyOutgoing();
         *
         * @param [listener] - the catch-all listener (optional)
         */
        offAnyOutgoing(listener) {
            if (!this._anyOutgoingListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyOutgoingListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyOutgoingListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAnyOutgoing() {
            return this._anyOutgoingListeners || [];
        }
        /**
         * Notify the listeners for each packet sent
         *
         * @param packet
         *
         * @private
         */
        notifyOutgoingListeners(packet) {
            if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
                const listeners = this._anyOutgoingListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, packet.data);
                }
            }
        }
    }

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */
    function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 10000;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
    }
    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */
    Backoff.prototype.duration = function () {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
            var rand = Math.random();
            var deviation = Math.floor(rand * this.jitter * ms);
            ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
    };
    /**
     * Reset the number of attempts.
     *
     * @api public
     */
    Backoff.prototype.reset = function () {
        this.attempts = 0;
    };
    /**
     * Set the minimum duration
     *
     * @api public
     */
    Backoff.prototype.setMin = function (min) {
        this.ms = min;
    };
    /**
     * Set the maximum duration
     *
     * @api public
     */
    Backoff.prototype.setMax = function (max) {
        this.max = max;
    };
    /**
     * Set the jitter
     *
     * @api public
     */
    Backoff.prototype.setJitter = function (jitter) {
        this.jitter = jitter;
    };

    class Manager extends Emitter {
        constructor(uri, opts) {
            var _a;
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            installTimerFunctions(this, opts);
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
            this.backoff = new Backoff({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || parser;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            if (~this._readyState.indexOf("open"))
                return this;
            this.engine = new Socket$1(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = on(socket, "error", (err) => {
                self.cleanup();
                self._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = this.setTimeoutFn(() => {
                    openSubDestroy();
                    socket.close();
                    // @ts-ignore
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            try {
                this.decoder.add(data);
            }
            catch (e) {
                this.onclose("parse error", e);
            }
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
            nextTick(() => {
                this.emitReserved("packet", packet);
            }, this.setTimeoutFn);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket = this.nsps[nsp];
            if (!socket) {
                socket = new Socket(this, nsp, opts);
                this.nsps[nsp] = socket;
            }
            else if (this._autoConnect && !socket.active) {
                socket.connect();
            }
            return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            this.skipReconnect = true;
            this._reconnecting = false;
            this.onclose("forced close");
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason, description) {
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason, description);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                this._reconnecting = true;
                const timer = this.setTimeoutFn(() => {
                    if (self.skipReconnect)
                        return;
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }

    /**
     * Managers cache.
     */
    const cache = {};
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url(uri, opts.path || "/socket.io");
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            io = new Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                cache[id] = new Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
    // namespace (e.g. `io.connect(...)`), for backward compatibility
    Object.assign(lookup, {
        Manager,
        Socket,
        io: lookup,
        connect: lookup,
    });

    // Contains current player state in game.
    class State {
        static WAITING = new State("WAITING");
        static ANGLE_CHOOSE = new State("ANGLE");
        static SPEED_CHOOSE = new State("SPEED");

        constructor(name) {
            this.name = name;
        }
    } // End of State class.

    // Contains room data.
    class Data {
        constructor() {
            this.roomId = null;    // Current room ID.
            this.playerId = null;  // Current player ID.
            this.position = null;  // Current player position.
            this.side = "n";       // Current player map side.
            this.state = null;     // Current player state.
            this.speed = 0;        // Current player bullet speed.
            this.isShot = false;   // Current player shot draw flag.
            this.startShot = 0;    // Current player shot start time.
            this.ePos = null;      // Enemy position in room.
            this.eSpeed = 0;       // Enemy bullet speed.
            this.eSinAngle = null; // Enemy sin angle.
            this.eCosAngle = null; // Enemy cos angle.
            this.eIsShot = false;  // Enemy shot draw flag.
            this.eStartShot = 0;   // Enemy shot start time.
        }

        setAngle(mouseX, mouseY) {
            // Sin
            this.sinAngle = (mouseY - (this.position[1] + 10)) /
            Math.sqrt((mouseX - (this.position[0] + 10)) ** 2 + (mouseY - (this.position[1] + 10)) ** 2);
            // Cos
            this.cosAngle = (mouseX - (this.position[0] + 10)) /
            Math.sqrt((mouseX - (this.position[0] + 10)) ** 2 + (mouseY - (this.position[1] + 10)) ** 2);
        }
    } // End of Data class.

    // Set player data from message function.
    function setRoomData(roomData, dataArray, socket) {
      // Room ID.
      roomData.roomId = dataArray[0];
      console.log(`Your room id: ${roomData.roomId}`);

      // Player HP.
      roomData.myHp = 1500;

      // Player ID.
      roomData.playerId = socket.id;

      // Position.
      roomData.position = [parseFloat(dataArray[1]), parseFloat(dataArray[2])];
      console.log(`Your position: ${roomData.position}`);

      // Player state and side.
      if (dataArray[3] == 1) {
        roomData.side = "l";
        roomData.state = State.ANGLE_CHOOSE;
      } else {
        roomData.side = "r";
        roomData.state = State.WAITING;
      }

      // Enemy position.
      roomData.ePos = [parseFloat(dataArray[4]), parseFloat(dataArray[5])];
      console.log(`Enemy position: ${roomData.ePos}`);
    } // End of setRoomData function.

    /* FILE NAME: vec3.js
     * PROGRAMMER: AG2
     * LAST UPDATE: 03.06.2023
     * PURPOSE: 3D math vector implementation module.
     */

    /***
     * Vector with 3 components module
     ***/

    /* Vector/point representation type */
    class _vec3 {
      constructor(x, y, z) {
        if (x == undefined) {
          this.x = 0;
          this.y = 0;
          this.z = 0;
        } else if (typeof x == "object") {
          if (x.length == 3) {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
          } else {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
          }
        } else {
          if (y == undefined && z == undefined) {
            this.x = x;
            this.y = x;
            this.z = x;
          } else {
            this.x = x;
            this.y = y;
            this.z = z;
          }
        }
      }

      /* Set vector function */
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
      }
      /* Add two vectors function */
      add(vec) {
        return vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
      }
      /* Sub two vectors function */
      sub(vec) {
        return vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
      }
      /* Multiplu vector by a number function */
      mulNum(n) {
        return vec3(this.x * n, this.y * n, this.z * n);
      }
      /* Divise vector by a number function */
      divNum(n) {
        return vec3(this.x / n, this.y / n, this.z / n);
      }
      /* Negative vector function */
      negative() {
        return vec3(-this.x, -this.y, -this.z);
      }
      /* Dot productof vectors function */
      dot(vec) {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z;
      }
      /* Cross product of vectors function */
      cross(vec) {
        return vec3(
          this.y * vec.z - this.z * vec.y,
          -(this.x * vec.z - this.z * vec.x),
          this.x * vec.y - this.y * vec.x
        );
      }
      /* Count lenght of vector function */
      len() {
        let length = this.dot(this);

        if (length == 1 || length == 0) {
          return length;
        }
        return Math.sqrt(length);
      }
      /* Normalize vector function */
      normalize() {
        let length = this.dot(this);

        if (length == 1 || length == 0) {
          return vec3(this);
        }
        length = Math.sqrt(length);
        return vec3(this.x / length, this.y / length, this.z / length);
      }
      /* Transform point of vector function */
      transform(mat) {
        return vec3(
          this.x * mat.a[0][0] +
            this.y * mat.a[1][0] +
            this.z * mat.a[2][0] +
            mat.a[3][0],
          this.x * mat.a[0][1] +
            this.y * mat.a[1][1] +
            this.z * mat.a[2][1] +
            mat.a[3][1],
          this.x * mat.a[0][2] +
            this.y * mat.a[1][2] +
            this.z * mat.a[2][2] +
            mat[3][3]
        );
      }
      /* Transform vector function */
      transform(mat) {
        return vec3(
          this.x * mat.a[0][0] + this.y * mat.a[1][0] + this.z * mat.a[2][0],
          this.x * mat.a[0][1] + this.y * mat.a[1][1] + this.z * mat.a[2][1],
          this.x * mat.a[0][2] + this.y * mat.a[1][2] + this.z * mat.a[2][2]
        );
      }
      /* Vector by matrix multiplication (with homogenious devide) function */
      vecMulMatr(mat) {
        let w =
          this.x * mat.a[0][3] +
          this.y * mat.a[1][3] +
          this.z * mat.a[2][3] +
          mat.a[3][3];

        return vec3(
          (this.x * mat.a[0][0] +
            this.y * mat.a[1][0] +
            this.z * mat.a[2][0] +
            mat.a[3][0]) /
            w,
          (this.x * mat.a[0][1] +
            this.y * mat.a[1][1] +
            this.z * mat.a[2][1] +
            mat.a[3][1]) /
            w,
          (this.x * mat.a[0][2] +
            this.y * mat.a[1][2] +
            this.z * mat.a[2][2] +
            mat.a[3][2]) /
            w
        );
      }
      /* Reset vector to array functions */
      toArray() {
        return [this.x, this.y, this.z];
      }
    }

    function vec3(...args) {
      return new _vec3(...args);
    }
    /*
    let v1 = new vec3(0, 0, 0);
    let v2 = new vec3(5, 6, 7);
    let v3 = new vec3(8, 9, 10);
    let v4 = new vec3(11, 12, 13);
    let v5 = new vec3(14, 15, 16);
    let v6 = new vec3(17, 18, 19);

    console.log(v1.dot(v2));
    console.log(v1.sub(v2));
    console.log(v6.negative());
    console.log(v1.divNum(2));
    console.log(v1.len());
    console.log(v3.normalize());
    */

    /* END OF 'vec3.js' FILE */

    /* FILE NAME: matr4.js
     * PROGRAMMER: AG2
     * LAST UPDATE: 06.06.2023
     * PURPOSE: 3D math matrix implementation module.
     */


    /***
     * Matrix module
     ***/

    /* Matrix representation type */
    class _mat4 {
      addMethod(obj, name, func) {
        var old = obj[name];

        obj[name] = (...args) => {
          if (func.length == args.length) {
            return func.apply(obj, args);
          } else if (typeof old == "function") {
            return old.apply(obj, args);
          }
        };
      }

      constructor(a = null) {
        if (a == null) {
          this.a = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
          ];
        } else if (typeof a == "object" && a.length == 4) {
          this.a = a;
        } else {
          this.a = a.a;
        }
        this.addMethod(this, "setTranslate", (dx, dy, dz) => {
          this.a = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [dx, dy, dz, 1],
          ];
          return this;
        });
        this.addMethod(this, "setTranslate", (v) => {
          return this.setTranslate(v.x, v.y, v.z);
        });
        this.addMethod(this, "translate", (dx, dy, dz) => {
          this.mul([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [dx, dy, dz, 1],
          ]);
          return this;
        });
        this.addMethod(this, "translate", (v) => {
          return this.translate(v.x, v.y, v.z);
        });

        /* Scale functions */
        this.addMethod(this, "setScale", (sx, sy, sz) => {
          this.m = [
            [sx, 0, 0, 0],
            [0, sy, 0, 0],
            [0, 0, sz, 0],
            [0, 0, 0, 1],
          ];
          return this;
        });
        this.addMethod(this, "setScale", (v) => {
          if (typeof v == "object") {
            return this.setScale(v.x, v.y, v.z);
          }
          return this.setScale(v, v, v);
        });
        this.addMethod(this, "scale", (sx, sy, sz) => {
          this.mul([
            [sx, 0, 0, 0],
            [0, sy, 0, 0],
            [0, 0, sz, 0],
            [0, 0, 0, 1],
          ]);
          return this;
        });
        this.addMethod(this, "scale", (v) => {
          if (typeof v == "object") {
            return this.scale(v.x, v.y, v.z);
          }
          return this.scale(v, v, v);
        });
      } // End of 'constructor' function

      setRotate(AngleInDegree, R) {
        let a = AngleInDegree * Math.PI,
          sine = Math.sin(a),
          cosine = Math.cos(a);
        let x = 0,
          y = 0,
          z = 1;
        if (typeof R == "object") {
          if (R.length == 3) {
            x = R[0];
            y = R[1];
            z = R[2];
          } else {
            x = R.x;
            y = R.y;
            z = R.z;
          }
        }
        // Vector normalize
        let len = x * x + y * y + z * z;
        if (len != 0 && len != 1) {
          len = Math.sqrt(len);
          x /= len;
          y /= len;
          z /= len;
        }
        this.a[0][0] = cosine + x * x * (1 - cosine);
        this.a[0][1] = x * y * (1 - cosine) + z * sine;
        this.a[0][2] = x * z * (1 - cosine) - y * sine;
        this.a[0][3] = 0;
        this.a[1][0] = y * x * (1 - cosine) - z * sine;
        this.a[1][1] = cosine + y * y * (1 - cosine);
        this.a[1][2] = y * z * (1 - cosine) + x * sine;
        this.a[1][3] = 0;
        this.a[2][0] = z * x * (1 - cosine) + y * sine;
        this.a[2][1] = z * y * (1 - cosine) - x * sine;
        this.a[2][2] = cosine + z * z * (1 - cosine);
        this.a[2][3] = 0;
        this.a[3][0] = 0;
        this.a[3][1] = 0;
        this.a[3][2] = 0;
        this.a[3][3] = 1;
        return this;
      }

      rotate(AngleInDegree, R) {
        return this.mul(mat4().setRotate(AngleInDegree, R));
      }

      transpose() {
        let r = [[], [], [], []];

        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            r[i][j] = this.a[j][i];
          }
        }
        return mat4(r);
      }

      mul(a) {
        let matr;
        if (a.length == 4) {
          matr = a;
        } else {
          matr = a.a;
        }
        this.a = [
          [
            this.a[0][0] * matr[0][0] +
              this.a[0][1] * matr[1][0] +
              this.a[0][2] * matr[2][0] +
              this.a[0][3] * matr[3][0],
            this.a[0][0] * matr[0][1] +
              this.a[0][1] * matr[1][1] +
              this.a[0][2] * matr[2][1] +
              this.a[0][3] * matr[3][1],
            this.a[0][0] * matr[0][2] +
              this.a[0][1] * matr[1][2] +
              this.a[0][2] * matr[2][2] +
              this.a[0][3] * matr[3][2],
            this.a[0][0] * matr[0][3] +
              this.a[0][1] * matr[1][3] +
              this.a[0][2] * matr[2][3] +
              this.a[0][3] * matr[3][3],
          ],
          [
            this.a[1][0] * matr[0][0] +
              this.a[1][1] * matr[1][0] +
              this.a[1][2] * matr[2][0] +
              this.a[1][3] * matr[3][0],
            this.a[1][0] * matr[0][1] +
              this.a[1][1] * matr[1][1] +
              this.a[1][2] * matr[2][1] +
              this.a[1][3] * matr[3][1],
            this.a[1][0] * matr[0][2] +
              this.a[1][1] * matr[1][2] +
              this.a[1][2] * matr[2][2] +
              this.a[1][3] * matr[3][2],
            this.a[1][0] * matr[0][3] +
              this.a[1][1] * matr[1][3] +
              this.a[1][2] * matr[2][3] +
              this.a[1][3] * matr[3][3],
          ],
          [
            this.a[2][0] * matr[0][0] +
              this.a[2][1] * matr[1][0] +
              this.a[2][2] * matr[2][0] +
              this.a[2][3] * matr[3][0],
            this.a[2][0] * matr[0][1] +
              this.a[2][1] * matr[1][1] +
              this.a[2][2] * matr[2][1] +
              this.a[2][3] * matr[3][1],
            this.a[2][0] * matr[0][2] +
              this.a[2][1] * matr[1][2] +
              this.a[2][2] * matr[2][2] +
              this.a[2][3] * matr[3][2],
            this.a[2][0] * matr[0][3] +
              this.a[2][1] * matr[1][3] +
              this.a[2][2] * matr[2][3] +
              this.a[2][3] * matr[3][3],
          ],
          [
            this.a[3][0] * matr[0][0] +
              this.a[3][1] * matr[1][0] +
              this.a[3][2] * matr[2][0] +
              this.a[3][3] * matr[3][0],
            this.a[3][0] * matr[0][1] +
              this.a[3][1] * matr[1][1] +
              this.a[3][2] * matr[2][1] +
              this.a[3][3] * matr[3][1],
            this.a[3][0] * matr[0][2] +
              this.a[3][1] * matr[1][2] +
              this.a[3][2] * matr[2][2] +
              this.a[3][3] * matr[3][2],
            this.a[3][0] * matr[0][3] +
              this.a[3][1] * matr[1][3] +
              this.a[3][2] * matr[2][3] +
              this.a[3][3] * matr[3][3],
          ],
        ];
        return this;
      }

      determ3x3(A11, A12, A13, A21, A22, A23, A31, A32, A33) {
        return (
          A11 * A22 * A33 -
          A11 * A23 * A32 -
          A12 * A21 * A33 +
          A12 * A23 * A31 +
          A13 * A21 * A32 -
          A13 * A22 * A31
        );
      }

      determ() {
        let det =
          this.a[0][0] *
            this.determ3x3(
              this.a[1][1],
              this.a[1][2],
              this.a[1][3],
              this.a[2][1],
              this.a[2][2],
              this.a[2][3],
              this.a[3][1],
              this.a[3][2],
              this.a[3][3]
            ) -
          this.a[0][1] *
            this.determ3x3(
              this.a[1][0],
              this.a[1][2],
              this.a[1][3],
              this.a[2][0],
              this.a[2][2],
              this.a[2][3],
              this.a[3][0],
              this.a[3][2],
              this.a[3][3]
            ) +
          this.a[0][2] *
            this.determ3x3(
              this.a[1][0],
              this.a[1][1],
              this.a[1][3],
              this.a[2][0],
              this.a[2][1],
              this.a[2][3],
              this.a[3][0],
              this.a[3][1],
              this.a[3][3]
            ) -
          this.a[0][3] *
            this.determ3x3(
              this.a[1][0],
              this.a[1][1],
              this.a[1][2],
              this.a[2][0],
              this.a[2][1],
              this.a[2][2],
              this.a[3][0],
              this.a[3][1],
              this.a[3][2]
            );

        return det;
      }

      inverse() {
        let r = [[], [], [], []];
        let det = this.determ();

        if (det == 0) {
          let a = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
          ];

          return mat4(a);
        }

        /* Build adjoint matrix */
        r[0][0] =
          this.determ3x3(
            this.a[1][1],
            this.a[1][2],
            this.a[1][3],
            this.a[2][1],
            this.a[2][2],
            this.a[2][3],
            this.a[3][1],
            this.a[3][2],
            this.a[3][3]
          ) / det;
        r[1][0] =
          -this.determ3x3(
            this.a[1][0],
            this.a[1][2],
            this.a[1][3],
            this.a[2][0],
            this.a[2][2],
            this.a[2][3],
            this.a[3][0],
            this.a[3][2],
            this.a[3][3]
          ) / det;
        r[2][0] =
          this.determ3x3(
            this.a[1][0],
            this.a[1][1],
            this.a[1][3],
            this.a[2][0],
            this.a[2][1],
            this.a[2][3],
            this.a[3][0],
            this.a[3][1],
            this.a[3][3]
          ) / det;
        r[3][0] =
          -this.determ3x3(
            this.a[1][0],
            this.a[1][1],
            this.a[1][2],
            this.a[2][0],
            this.a[2][1],
            this.a[2][2],
            this.a[3][0],
            this.a[3][1],
            this.a[3][2]
          ) / det;

        r[0][1] =
          -this.determ3x3(
            this.a[0][1],
            this.a[0][2],
            this.a[0][3],
            this.a[2][1],
            this.a[2][2],
            this.a[2][3],
            this.a[3][1],
            this.a[3][2],
            this.a[3][3]
          ) / det;
        r[1][1] =
          this.determ3x3(
            this.a[0][0],
            this.a[0][2],
            this.a[0][3],
            this.a[2][0],
            this.a[2][2],
            this.a[2][3],
            this.a[3][0],
            this.a[3][2],
            this.a[3][3]
          ) / det;
        r[2][1] =
          -this.determ3x3(
            this.a[0][0],
            this.a[0][1],
            this.a[0][3],
            this.a[2][0],
            this.a[2][1],
            this.a[2][3],
            this.a[3][0],
            this.a[3][1],
            this.a[3][3]
          ) / det;
        r[3][1] =
          this.determ3x3(
            this.a[0][0],
            this.a[0][1],
            this.a[0][2],
            this.a[2][0],
            this.a[2][1],
            this.a[2][2],
            this.a[3][0],
            this.a[3][1],
            this.a[3][2]
          ) / det;

        r[0][2] =
          this.determ3x3(
            this.a[0][1],
            this.a[0][2],
            this.a[0][3],
            this.a[1][1],
            this.a[1][2],
            this.a[1][3],
            this.a[3][1],
            this.a[3][2],
            this.a[3][3]
          ) / det;
        r[1][2] =
          -this.determ3x3(
            this.a[0][0],
            this.a[0][2],
            this.a[0][3],
            this.a[1][0],
            this.a[1][2],
            this.a[1][3],
            this.a[3][0],
            this.a[3][2],
            this.a[3][3]
          ) / det;
        r[2][2] =
          this.determ3x3(
            this.a[0][0],
            this.a[0][1],
            this.a[0][3],
            this.a[1][0],
            this.a[1][1],
            this.a[1][3],
            this.a[3][0],
            this.a[3][1],
            this.a[3][3]
          ) / det;
        r[3][2] =
          -this.determ3x3(
            this.a[0][0],
            this.a[0][1],
            this.a[0][2],
            this.a[1][0],
            this.a[1][1],
            this.a[1][2],
            this.a[3][0],
            this.a[3][1],
            this.a[3][2]
          ) / det;

        r[0][3] =
          -this.determ3x3(
            this.a[0][1],
            this.a[0][2],
            this.a[0][3],
            this.a[1][1],
            this.a[1][2],
            this.a[1][3],
            this.a[2][1],
            this.a[2][2],
            this.a[2][3]
          ) / det;

        r[1][3] =
          this.determ3x3(
            this.a[0][0],
            this.a[0][2],
            this.a[0][3],
            this.a[1][0],
            this.a[1][2],
            this.a[1][3],
            this.a[2][0],
            this.a[2][2],
            this.a[2][3]
          ) / det;
        r[2][3] =
          -this.determ3x3(
            this.a[0][0],
            this.a[0][1],
            this.a[0][3],
            this.a[1][0],
            this.a[1][1],
            this.a[1][3],
            this.a[2][0],
            this.a[2][1],
            this.a[2][3]
          ) / det;
        r[3][3] =
          this.determ3x3(
            this.a[0][0],
            this.a[0][1],
            this.a[0][2],
            this.a[1][0],
            this.a[1][1],
            this.a[1][2],
            this.a[2][0],
            this.a[2][1],
            this.a[2][2]
          ) / det;
        this.m = r;
        return this;
      }

      setIdentity() {
        this.a = [
          [1, 0, 0, 0],
          [0, 1, 0, 0],
          [0, 0, 1, 0],
          [0, 0, 0, 1],
        ];
        return this;
      }

      setView(Loc, At, Up1) {
        let Dir = At.sub(Loc).normalize(),
          Right = Dir.cross(Up1).normalize(),
          Up = Right.cross(Dir).normalize();
        this.a = [
          [Right.x, Up.x, -Dir.x, 0],
          [Right.y, Up.y, -Dir.y, 0],
          [Right.z, Up.z, -Dir.z, 0],
          [-Loc.dot(Right), -Loc.dot(Up), Loc.dot(Dir), 1],
        ];
        return this;
      }

      setOrtho(Left, Right, Bottom, Top, Near, Far) {
        this.a = [
          [2 / (Right - Left), 0, 0, 0],
          [0, 2 / (Top - Bottom), 0, 0],
          [0, 0, -2 / (Far - Near), 0],
          [
            -(Right + Left) / (Right - Left),
            -(Top + Bottom) / (Top - Bottom),
            -(Far + Near) / (Far - Near),
            1,
          ],
        ];
        return this;
      }

      setFrustum(Left, Right, Bottom, Top, Near, Far) {
        this.a = [
          [(2 * Near) / (Right - Left), 0, 0, 0],
          [0, (2 * Near) / (Top - Bottom), 0, 0],
          [
            (Right + Left) / (Right - Left),
            (Top + Bottom) / (Top - Bottom),
            -(Far + Near) / (Far - Near),
            -1,
          ],
          [0, 0, (-2 * Near * Far) / (Far - Near), 0],
        ];
        return this;
      }

      view(Loc, At, Up1) {
        return this.mul(mat4().setView(Loc, At, Up1));
      }

      ortho(Left, Right, Bottom, Top, Near, Far) {
        return this.mul(mat4().setOrtho(Left, Right, Bottom, Top, Near, Far));
      }

      frustum(Left, Right, Bottom, Top, Near, Far) {
        return this.mul(mat4().setFrustum(Left, Right, Bottom, Top, Near, Far));
      }

      transform(V) {
        let w =
          V.x * this.m[0][3] +
          V.y * this.m[1][3] +
          V.z * this.m[2][3] +
          this.m[3][3];

        return vec3(
          (V.x * this.m[0][0] +
            V.y * this.m[1][0] +
            V.z * this.m[2][0] +
            this.m[3][0]) /
            w,
          (V.x * this.m[0][1] +
            V.y * this.m[1][1] +
            V.z * this.m[2][1] +
            this.m[3][1]) /
            w,
          (V.x * this.m[0][2] +
            V.y * this.m[1][2] +
            V.z * this.m[2][2] +
            this.m[3][2]) /
            w
        );
      }

      transformVector(V) {
        return vec3(
          V.x * this.a[0][0] + V.y * this.a[1][0] + V.z * this.a[2][0],
          V.x * this.a[0][1] + V.y * this.a[1][1] + V.z * this.a[2][1],
          V.x * this.a[0][2] + V.y * this.a[1][2] + V.z * this.a[2][2]
        );
      }

      transformPoint(V) {
        return vec3(
          V.x * this.a[0][0] +
            V.y * this.a[1][0] +
            V.z * this.a[2][0] +
            this.a[3][0],
          V.x * this.a[0][1] +
            V.y * this.a[1][1] +
            V.z * this.a[2][1] +
            this.a[3][1],
          V.x * this.a[0][2] +
            V.y * this.a[1][2] +
            V.z * this.a[2][2] +
            this.a[3][2]
        );
      }

      toArray() {
        return [].concat(...this.a);
      } // End of 'toArray' function
    }

    function mat4(...args) {
      return new _mat4(...args);
    }

    // Multiply two matrixes function
    function MatrMulMatr2(m1, m2) {
      return mat4(m1).mul(m2);
    }

    /* END OF 'matr4.js' FILE */

    /* FILE NAME: camera.js
     * PROGRAMMER: AG2
     * LAST UPDATE: 06.06.2023
     * PURPOSE: 3D math camera implementation module.
     */


    class _camera {
      constructor() {
        // Projection properties
        this.projSize = 0.1; // Project plane fit square
        this.projDist = 0.1; // Distance to project plane from viewer (near)
        this.projFarClip = 2000; // Distance to project far clip plane (far)

        // Local size data
        this.frameW = 30; // Frame width
        this.frameH = 30; // Frame height

        // Matrices
        this.matrView = mat4(); // View coordinate system matrix
        this.matrProj = mat4(); // Projection coordinate system matrix
        this.matrVP = mat4(); // View and projection matrix precalculate value

        // Set camera default settings
        this.loc = vec3(); // Camera location
        this.at = vec3(); // Camera destination
        this.dir = vec3(); // Camera Direction
        this.up = vec3(); // Camera UP direction
        this.right = vec3(); // Camera RIGHT direction
        this.setDef();
      } // End of 'constructor' function

      // Camera parmeters setting function
      set(loc, at, up) {
        this.matrView.setView(loc, at, up);
        this.loc = vec3(loc);
        this.at = vec3(at);
        this.dir.set(
          -this.matrView.a[0][2],
          -this.matrView.a[1][2],
          -this.matrView.a[2][2]
        );
        this.up.set(
          this.matrView.a[0][1],
          this.matrView.a[1][1],
          this.matrView.a[2][1]
        );
        this.right.set(
          this.matrView.a[0][0],
          this.matrView.a[1][0],
          this.matrView.a[2][0]
        );
        this.matrVP = mat4(this.matrView).mul(this.matrProj);
      } // End of 'set' function

      // Projection parameters setting function.
      setProj(projSize, projDist, projFarClip) {
        let rx = projSize,
          ry = projSize;

        this.projDist = projDist;
        this.projSize = projSize;
        this.projFarClip = projFarClip;

        // Correct aspect ratio
        if (this.frameW > this.frameH) rx *= this.frameW / this.frameH;
        else ry *= this.frameH / this.frameW;
        this.matrProj.setFrustum(
          -rx / 2.0,
          rx / 2.0,
          -ry / 2.0,
          ry / 2.0,
          projDist,
          projFarClip
        );

        // pre-calculate view * proj matrix
        this.matrVP = mat4(this.matrView).mul(this.matrProj);
      } // End of 'setProj' function

      // Resize camera and projection function.
      setSize(frameW, frameH) {
        if (frameW < 1) frameW = 1;
        if (frameH < 1) frameH = 1;
        this.frameW = frameW;
        this.frameH = frameH;
        // Reset projection with new render window size
        this.setProj(this.projSize, this.projDist, this.projFarClip);
      } // End of 'setSize' function

      // Camera set default values function.
      setDef() {
        this.loc.set(0, 0, 20);
        this.at.set(0, 0, 0);
        this.dir.set(0, 0, -1);
        this.up.set(0, 1, 0);
        this.right.set(1, 0, 0);

        this.projDist = 0.1;
        this.projSize = 0.1;
        this.projFarClip = 6000;

        this.frameW = 47;
        this.frameH = 47;

        this.set(this.loc, this.at, this.up);
        this.setProj(this.projSize, this.projDist, this.projFarClip);
        this.setSize(this.frameW, this.frameH);
      } // End of 'setDef' function
    } // End of 'camera' class

    function camera(...args) {
      return new _camera(args);
    } // End of 'mat4' function

    /* END OF 'camera.js' FILE */

    // Prims module.

    /***
     * Primitives module
     ***/

    // Primitives representation type.
    class prim {
      constructor(gl, type, V, I, shdprogram) {
        if (V != undefined) {
          this.vBuf = gl.createBuffer();
          this.va = gl.createVertexArray();

          gl.bindVertexArray(this.va);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);

          gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 10 * 4, 0); // position 
          gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 10 * 4, 4 * 3); // color
          gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 10 * 4, 4 * 7); // normal
          
          // Include the necessary attributes (layout)
          gl.enableVertexAttribArray(0);
          gl.enableVertexAttribArray(1);
          gl.enableVertexAttribArray(2);
          // Close vertex array
          gl.bindVertexArray(null);
        }
        if (I != null) {
          // Index data
          this.iBuf = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuf);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(I), gl.STATIC_DRAW);
          // gl.bindBuffer(0);
          this.numOfElements = I.length;
        } else {
          this.numOfElements = V.length;
        }
        this.trans = mat4().setIdentity();
        this.type = type;
        this.shdprogram = shdprogram;
        this.gl = gl;
      }
      /* Draw primitive function */
      draw(cam, world, timeFromStart) {
        let w = MatrMulMatr2(this.trans, world);
        let winw = mat4(w).inverse().transpose();
        let wvp = mat4(w).mul(cam.matrVP);

        this.gl.useProgram(this.shdprogram);
        this.gl.bindVertexArray(this.va);

        // Matrix WVP
        let locWVP = this.gl.getUniformLocation(this.shdprogram, "MatrWVP");
        if (locWVP != null) {
          this.gl.uniformMatrix4fv(locWVP, false, new Float32Array(wvp.toArray()));
        }
        // Matrix W
        let locW = this.gl.getUniformLocation(this.shdprogram, "MatrW");
        if (locW != null) {
          this.gl.uniformMatrix4fv(locW, false, new Float32Array(w.toArray()));
        }
        // Matrix Inverse
        let locInv = this.gl.getUniformLocation(this.shdprogram, "MatrWInv");
        if (locInv != null) {
          this.gl.uniformMatrix4fv(locInv, false, new Float32Array(winw.toArray()));
        }
        // Time
        const timeFromProgramBegin = Date.now() - timeFromStart;
        const locTime = this.gl.getUniformLocation(this.shdprogram, "Time");
        if (locTime != null) {
          this.gl.uniform1f(locTime, timeFromProgramBegin / 1000.0);
        }

        if (this.iBuf != undefined) {
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.iBuf);
          this.gl.drawElements(
            this.type,
            this.numOfElements,
            this.gl.UNSIGNED_INT,
            0
          );
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        } else {
          this.gl.drawArrays(this.type, 0, this.numOfElements);
        }

        this.gl.bindVertexArray(null);
        this.gl.useProgram(null);
      }
    }

    /* END OF 'rndprim.js' FILE */

    /* FILE NAME: buffer.js
     * PROGRAMMER: AG2
     * LAST UPDATE: 13.06.2023
     * PURPOSE: Buffers module - helps for main.js.
     */

    // FORMAT:
    // Position     Color          Normals

    /***
     * Surface data
     ***/
    let surfaceData = [
      -1.5, 0, 0,       0.15, 0.42, 0.36, 1,   0, 0, 1,
      -1.5, 0.5, 0,     0.15, 0.42, 0.36, 1,   0, 0, 1,
      1.5, 0.5, 0,      0.15, 0.42, 0.36, 1,   0, 0, 1,
      1.5, 0, 0,        0.15, 0.42, 0.36, 1,   0, 0, 1,

      -0.5, 0.5, 0,     0.15, 0.42, 0.36, 1,   0, 0, 1,
      -0.5, 1.5, 0,     0.15, 0.42, 0.36, 1,   0, 0, 1,
      0.5, 1.5, 0,      0.15, 0.42, 0.36, 1,   0, 0, 1,
      0.5, 0.5, 0,      0.15, 0.42, 0.36, 1,   0, 0, 1
    ];

    let surfaceInd = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,];

    /*** 
     * Player tank data
     ***/
    let x = 1, y = 1;
    const h = document.getElementById("game").clientHeight;
    const w = document.getElementById("game").clientWidth;  
    if (h > w) {
      y *= (w / h);
    }
    else if (w > h) {
      x *= (h / w);
    }
    let artData = [
      -1 * x, -0.5 * y, 0,   0, 1, 0, 1,  0, 0, 1, 
      -0.5 * x, 0.5 * y, 0,  0, 1, 0, 1,  0, 0, 1, 
      0.5 * x, 0.5 * y, 0,   0, 1, 0, 1,  0, 0, 1, 
      1 * x, -0.5 * y, 0,    0, 1, 0, 1,  0, 0, 1, 
      0.75 * x, 1 * y, 0,    0, 1, 0, 1,  0, 0, 1, 
      1 * x, 0.5 * y, 0,     0, 1, 0, 1,  0, 0, 1,
    ];

    let artInd = [0, 1, 2, 2, 4, 5, 0, 2, 3];

    let artEnData = [
      -1 * x, -0.5 * y, 0,   1, 0, 0, 1,  0, 0, 1, 
      -0.5 * x, 0.5 * y, 0,  1, 0, 0, 1,  0, 0, 1, 
      0.5 * x, 0.5 * y, 0,   1, 0, 0, 1,  0, 0, 1, 
      1 * x, -0.5 * y, 0,    1, 0, 0, 1,  0, 0, 1, 
      -0.75 * x, 1 * y, 0,   1, 0, 0, 1,  0, 0, 1, 
      -1 * x, 0.5 * y, 0,    1, 0, 0, 1,  0, 0, 1,
    ];

    let artEnInd = [0, 1, 2, 1, 4, 5, 0, 2, 3];

    /***
     * Square data
     ***/
    let squareData = [
      -0.1 * x, -0.1 * y, 0,   0, 1, 1, 1,   0, 0, 1, 
      -0.1 * x, 0.1 * y, 0,    0, 1, 1, 1,   0, 0, 1, 
      0.1 * x, 0.1 * y, 0,     0, 1, 1, 1,   0, 0, 1, 
      0.1 * x, -0.1 * y, 0,    0, 1, 1, 1,   0, 0, 1,
    ];

    let squareInd = [0, 1, 2, 0, 2, 3];

    /* END OF 'buffers.js' FILE */

    /// Main output module.

    // Read text from file by URL function.
    async function fetchResource(resURL) {
      try {
          const response = await fetch(resURL);
          const text = await response.text();

          return text;
      } catch(err) {
          console.error(err);
      }
    }

    // Load shader function.
    function loadShader(gl, type, source) {
      const shader = gl.createShader(type);

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error load shader" + gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    // Draw bullet shot and colision with enemy tank.
    // (x1, y1) - start position of bullet
    // (x2, y2) - enemy's tank position.
    // flag (bool) - (true): draw flying bullet, (false): bullet is not moving.
    function shotAndColision(x1, y1, speed, sin, cos, x2, y2, time, cam, prim, flag) {
      let delta = 7;

      if (flag === true) {
        let A = 2; // acceleration
        let Sx = speed * cos * time; // Proj of speed on Ox
        let Sy = (speed * sin - A * time) * time; // Proj of speed on Oy

        if (y1 + Sy < -10 ||
        (x1 + Sx > -0.5 * delta && x1 + Sx < 0.5 * delta && y1 + Sy < 1.5 * delta - 10)) {
          Sy = 0;
          Sx = 0;
          prim.draw(cam, mat4().translate(x1, y1, 0));
          return 0;
        }
        prim.draw(cam, mat4().translate(x1 + Sx, y1 + Sy, 0));

        if (
          x1 + Sx <= x2 + 0.5 &&
          x1 + Sx >= x2 - 0.5 &&
          y1 + Sy <= y2 + 0.5 &&
          y1 + Sy >= y2 - 0.5
        ) {
          Sy = 0;
          Sx = 0;
          // alert("Столкновение");
          return 1;
        }
        return -1;
      } else {
        prim.draw(cam, mat4().translate(x1, y1, 0));
        return -1;
      }
    }

    // Local room data.
    let roomDataGL;
    let leftFlag = false, rightFlag = false;
    let leftStartTime, rightStartTime;
    let leftSin, leftCos;
    let rightSin, rightCos;
    let leftSpeed, rightSpeed;

    function getRoomDataGL(roomData) {
      roomDataGL = roomData;

      if (roomDataGL == undefined) {
        leftFlag = false;
        rightFlag = false;
        leftStartTime = 0;
        rightStartTime = 0;
        return;
      }

      // Copy data to local class.
      if (roomDataGL.side == "r") {
        // Shot flag
        rightFlag = roomDataGL.isShot;
        leftFlag = roomDataGL.eIsShot;
        // Shot start time
        rightStartTime = roomDataGL.startShot;
        leftStartTime = roomDataGL.eStartShot;
        // Shot angle
        rightSin = roomDataGL.sinAngle;
        rightCos = roomDataGL.cosAngle;
        leftSin = roomDataGL.eSinAngle;
        leftCos = roomDataGL.eCosAngle;
        // Speed
        rightSpeed = roomData.speed;
        leftSpeed = roomData.eSpeed;
      } else {
        // Shot flag
        rightFlag = roomDataGL.eIsShot;
        leftFlag = roomDataGL.isShot;
        // Shot start time
        rightStartTime = roomDataGL.eStartShot;
        leftStartTime = roomDataGL.startShot;
        // Shot angle
        leftSin = roomDataGL.sinAngle;
        leftCos = roomDataGL.cosAngle;
        rightSin = roomDataGL.eSinAngle;
        rightCos = roomDataGL.eCosAngle;
        // Speed
        rightSpeed = roomData.eSpeed;
        leftSpeed = roomData.speed;
      }
    }

    /* GL initialization function */
    function initGL() {
      const canvas = document.getElementById("game");
      const gl = canvas.getContext("webgl2");

      // Get load shaders promises.
      let vsPr = fetchResource("./shaders/vert.glsl");
      let fsPr = fetchResource("./shaders/frag.glsl");

      Promise.all([vsPr, fsPr]).then((res) => {
        // Shader initialization.
        const vertexSh = loadShader(gl, gl.VERTEX_SHADER, res[0]);
        const fragmentSh = loadShader(gl, gl.FRAGMENT_SHADER, res[1]);
        const shdprogram = gl.createProgram();

        gl.attachShader(shdprogram, vertexSh);
        gl.attachShader(shdprogram, fragmentSh);
        gl.linkProgram(shdprogram);

        // Enable openGL functions.
        gl.enable(gl.DEPTH_TEST);

        if (!gl.getProgramParameter(shdprogram, gl.LINK_STATUS)) {
          alert("Error in program");
        }

        // Load surface.
        let surfaceAg = new prim(gl, gl.TRIANGLES, surfaceData, surfaceInd, shdprogram);

        // Load models.
        let leftTank = new prim(gl, gl.TRIANGLES, artData, artInd, shdprogram);
        let rightTank = new prim(gl, gl.TRIANGLES, artEnData, artEnInd, shdprogram);

        let leftBullet = new prim(gl, gl.TRIANGLES, squareData, squareInd, shdprogram);
        let rightBullet = new prim(gl, gl.TRIANGLES, squareData, squareInd, shdprogram);

        let cam = camera();

        // Players coords.
        let rightPosX, rightPosY;
        let leftPosX, leftPosY;

        if (roomDataGL.side == "r") {
          rightPosX = roomDataGL.position[0];
          rightPosY = roomDataGL.position[1];
          leftPosX = roomDataGL.ePos[0];
          leftPosY = roomDataGL.ePos[1];
          rightSpeed = roomDataGL.speed;
          leftSpeed = roomDataGL.eSpeed;
        } else {
          rightPosX = roomDataGL.ePos[0];
          rightPosY = roomDataGL.ePos[1];
          leftPosX = roomDataGL.position[0];
          leftPosY = roomDataGL.position[1];
          rightSpeed = roomDataGL.eSpeed;
          leftSpeed = roomDataGL.speed;
        }

        let timeFromStart = Date.now();
        const drawRender = () => {
          if (roomDataGL == undefined) {
            gl.clearColor(0.3, 0.3, 0.4, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
          }

          gl.clearColor(0.3, 0.47, 0.8, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);

          let rTime = (Date.now() - rightStartTime) / 1000.0;
          let lTime = (Date.now() - leftStartTime) / 1000.0;

          // Surface drawing.
          surfaceAg.draw(cam, mat4().scale(7, 7, 7).translate(0, -10, 0), timeFromStart);

          // Left side.
          leftTank.draw(cam, mat4().translate(leftPosX, leftPosY, 0), timeFromStart);
          if (shotAndColision(leftPosX + 0.5, leftPosY + 0.8,  // Bullet start position.
              leftSpeed, leftSin, leftCos,                     // Bullet speed.
              rightPosX, rightPosY,                            // Enemy position.
              lTime, cam, leftBullet, leftFlag) != -1) {       // Time, camera, primitive, shootFlag.
            leftFlag = false;
          }

          // Right side.
          rightTank.draw(cam, mat4().translate(rightPosX, rightPosY, 0), timeFromStart);
          if (shotAndColision(rightPosX - 0.5, rightPosY + 0.8,    // Bullet start position.
              rightSpeed, rightSin, rightCos,                      // Bullet speed.
              leftPosX, leftPosY,                                  // Enemy position.
              rTime, cam, rightBullet, rightFlag) != -1) {         // Time, camera, primitive, shootFlag.
            rightFlag = false;
          }

          window.requestAnimationFrame(drawRender);
        };
        
        if (roomDataGL != undefined) {
          drawRender();
        }
      });
    }

    // END OF 'main.js' FILE.

    // Output result of game.
    function gameResult(res) {
      if (res == 1) {
        document.getElementById("game-res").innerText = "You won!!!";
        setTimeout(() => {
          document.getElementById("game-res").innerText = "";
        }, 2000);
      } else {
        document.getElementById("game-res").innerText = "You lose";
        setTimeout(() => {
          document.getElementById("game-res").innerText = "";
        }, 2000);
      }
    } 

    // Update UI upper zone with statistics.
    function updateUpperUI(id) {
      if (id == 1) {
        document.getElementById("room-info").innerText = `Room ID: ${roomData.roomId}\n
          Your ID: ${roomData.playerId}`;
        document.getElementById("small-info").innerText = `Your HP: ${roomData.myHp}\n
          Your pos: ${roomData.position[0]}:${roomData.position[1]}\n
          You are ${roomData.side == "l" ? "green" : "red"} player`;
      } else if (id == 0) {
        document.getElementById("room-info").innerText = "Waiting for opponent...";
        document.getElementById("small-info").innerText = "";
      } else if (id == 2) {
        document.getElementById("room-info").innerText = "You are in lobby";
        document.getElementById("small-info").innerText = "";
      }
    }

    // Update UI down zone with turn or shoot success.
    function updateDownUI(id, msg) {
      if (id == "turn") {
        document.getElementById("turn-info").innerText = msg;
      } else if (id == "success") {
        document.getElementById("shoot-info").innerText = msg;
        setTimeout(() => {
          document.getElementById("shoot-info").innerText = "";
        }, 1500);
      }
    }

    // Local room data.
    let roomData = new Data();
    let lobbyFlag = 1;

    // Client-side.
    async function main() {
      const socket = lookup();

      ////////////////////// User connected.
      socket.on("connect", () => {

        // Room created, have opponent, get start data, initialize canvas webGL, set UI.
        socket.on("Found room", (dataArray) => {
          setRoomData(roomData, dataArray, socket);
          getRoomDataGL(roomData);
          initGL();
          updateDownUI("turn", roomData.state == State.ANGLE_CHOOSE
          ? "It's your turn to make move!"
          : "Wait for opponent");
          updateUpperUI(1);
        });

        // Send request to join vaiters room.
        document.getElementById("join").addEventListener("click", (e) => {
          if (lobbyFlag != 0) {
            lobbyFlag = 0;
            socket.emit("Join waiters", '');
          }
        });

        // Output current angle.
        document.getElementById("game").addEventListener("mousemove", (e) => {
          if (roomData.state == State.ANGLE_CHOOSE) { // Set shoot angle.
            let myCan = document.getElementById("game");
            let mouseX = (e.pageX - e.target.offsetLeft) / myCan.clientWidth * 20;
            let mouseY = 20 - (e.pageY - e.target.offsetTop) / myCan.clientHeight * 20;

            roomData.setAngle(mouseX, mouseY);
            document.getElementById("angle").innerText = `Sin: ${roomData.sinAngle.toFixed(4)}\nCos: ${roomData.cosAngle.toFixed(4)}`;
          }
        });

        // Send data about shoot to server.
        document.getElementById("game").addEventListener("click", (e) => {
          if (roomData.state == State.ANGLE_CHOOSE) { // Set shoot angle.
            let myCan = document.getElementById("game");
            roomData.setAngle(
              (e.pageX - e.target.offsetLeft) / myCan.clientWidth * 20,
              20 - (e.pageY - e.target.offsetTop) / myCan.clientHeight * 20);
            roomData.state = State.SPEED_CHOOSE;
          } else if (roomData.state == State.SPEED_CHOOSE) { // Set shoot speed.

            // const time = Date.now() - startTime;
            // roomData.speed = (Math.abs(Math.sin(time)) * 15 + 5) * 0 + 10;
            roomData.speed = document.getElementById("speed").value;
            roomData.startShot = Date.now();

            // Give shoot data to server.
            roomData.isShot = true;
            socket.emit("Shoot data", [roomData.roomId, roomData.speed, roomData.sinAngle, roomData.cosAngle, roomData.startShot]);
            getRoomDataGL(roomData);

            roomData.state = State.WAITING;
            updateDownUI("turn", "Wait for opponent");
          }
        });

        // Send data about button click to server (moving).

        // Room disbanded - lost opponent/You are new player.
        socket.on("No opponent", () => {
          getRoomDataGL(undefined);
          roomData.roomId = 0;
          roomData.state = State.WAITING;
          updateUpperUI(0);
          updateDownUI("turn", "");
        });

        // Lost room, move to lobby.
        socket.on("Lost room", () => {
          getRoomDataGL(undefined);
          roomData.roomId = 0;
          roomData.state = State.WAITING;
          lobbyFlag = 1;
          updateUpperUI(2);
          updateDownUI("turn", "");
        });

        // Result of player shoot.
        socket.on("Self shoot res", (res) => {
          setTimeout(() => {
            updateDownUI("success", res[0] == true ? "Success" : "Missed");
          }, res[1] * 1000);
        });

        // Enemy have no hp.
        socket.on("End game", (res) => {
          getRoomDataGL(undefined);
          roomData.roomId = 0;
          roomData.state = State.WAITING;
          lobbyFlag = 1;
          updateUpperUI(2);
          updateDownUI("turn", "");
          gameResult(1);
        });

        // Result of enemy shoot.
        socket.on("Damage", (res) => {
          setTimeout(() => {
            if (Number(res[0])) {
              roomData.myHp -= 100;
            }
            updateUpperUI(1);
            // Ckeck if player have no hp.
            if (roomData.myHp <= 0) {
              socket.emit("Game over", roomData.roomId);
              getRoomDataGL(undefined);
              roomData.roomId = 0;
              lobbyFlag = 1;
              updateUpperUI(2);
              updateDownUI("turn", "");
              gameResult(0);
            }
          }, res[1] * 1000);
        });

        // PLayer's turn to make move and enemy shoot result.
        socket.on("Changed turn", (dataArray) => {
          updateDownUI("turn", "Now it's your turn");
          roomData.state = State.ANGLE_CHOOSE;
          roomData.eSinAngle = dataArray[2];
          roomData.eCosAngle = dataArray[3];
          roomData.eSpeed = dataArray[1];
          roomData.eIsShot = true;
          roomData.eStartShot = dataArray[4];
          getRoomDataGL(roomData); // Give room data to openGL canvas.
        });
      });

      // Player disconnected from server.
      socket.on("disconnect", () => {
        socket.on("MessageFromServer", (msg) => {
          console.log(msg);
        });
      });
    }

    window.addEventListener("load", () => {
      main();
    });

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vY29tbW9ucy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9lbmNvZGVQYWNrZXQuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9jb250cmliL2Jhc2U2NC1hcnJheWJ1ZmZlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9kZWNvZGVQYWNrZXQuYnJvd3Nlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9Ac29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4Lm1qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9nbG9iYWxUaGlzLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdXRpbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi95ZWFzdC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL3BhcnNlcXMuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9oYXMtY29ycy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3htbGh0dHByZXF1ZXN0LmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy9wb2xsaW5nLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvd2Vic29ja2V0LWNvbnN0cnVjdG9yLmJyb3dzZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy93ZWJzb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9jb250cmliL3BhcnNldXJpLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3NvY2tldC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS91cmwuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLXBhcnNlci9idWlsZC9lc20vaXMtYmluYXJ5LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1wYXJzZXIvYnVpbGQvZXNtL2JpbmFyeS5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tcGFyc2VyL2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9vbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9zb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9iYWNrbzIuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vbWFuYWdlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tY2xpZW50L2J1aWxkL2VzbS9pbmRleC5qcyIsIi4uL2NsaWVudC9jbGFzc2VzLmpzIiwiLi4vY2xpZW50L3V0aWxzLmpzIiwiLi4vY2xpZW50L210aC92ZWMzLmpzIiwiLi4vY2xpZW50L210aC9tYXRyNC5qcyIsIi4uL2NsaWVudC9tdGgvY2FtZXJhLmpzIiwiLi4vY2xpZW50L3JuZC9ybmRwcmltLmpzIiwiLi4vY2xpZW50L2RhdGEvYnVmZmVycy5qcyIsIi4uL2NsaWVudC9nYW1lX2VuZ2luZS5qcyIsIi4uL2NsaWVudC9jbGllbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgUEFDS0VUX1RZUEVTID0gT2JqZWN0LmNyZWF0ZShudWxsKTsgLy8gbm8gTWFwID0gbm8gcG9seWZpbGxcblBBQ0tFVF9UWVBFU1tcIm9wZW5cIl0gPSBcIjBcIjtcblBBQ0tFVF9UWVBFU1tcImNsb3NlXCJdID0gXCIxXCI7XG5QQUNLRVRfVFlQRVNbXCJwaW5nXCJdID0gXCIyXCI7XG5QQUNLRVRfVFlQRVNbXCJwb25nXCJdID0gXCIzXCI7XG5QQUNLRVRfVFlQRVNbXCJtZXNzYWdlXCJdID0gXCI0XCI7XG5QQUNLRVRfVFlQRVNbXCJ1cGdyYWRlXCJdID0gXCI1XCI7XG5QQUNLRVRfVFlQRVNbXCJub29wXCJdID0gXCI2XCI7XG5jb25zdCBQQUNLRVRfVFlQRVNfUkVWRVJTRSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5PYmplY3Qua2V5cyhQQUNLRVRfVFlQRVMpLmZvckVhY2goa2V5ID0+IHtcbiAgICBQQUNLRVRfVFlQRVNfUkVWRVJTRVtQQUNLRVRfVFlQRVNba2V5XV0gPSBrZXk7XG59KTtcbmNvbnN0IEVSUk9SX1BBQ0tFVCA9IHsgdHlwZTogXCJlcnJvclwiLCBkYXRhOiBcInBhcnNlciBlcnJvclwiIH07XG5leHBvcnQgeyBQQUNLRVRfVFlQRVMsIFBBQ0tFVF9UWVBFU19SRVZFUlNFLCBFUlJPUl9QQUNLRVQgfTtcbiIsImltcG9ydCB7IFBBQ0tFVF9UWVBFUyB9IGZyb20gXCIuL2NvbW1vbnMuanNcIjtcbmNvbnN0IHdpdGhOYXRpdmVCbG9iID0gdHlwZW9mIEJsb2IgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICh0eXBlb2YgQmxvYiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoQmxvYikgPT09IFwiW29iamVjdCBCbG9iQ29uc3RydWN0b3JdXCIpO1xuY29uc3Qgd2l0aE5hdGl2ZUFycmF5QnVmZmVyID0gdHlwZW9mIEFycmF5QnVmZmVyID09PSBcImZ1bmN0aW9uXCI7XG4vLyBBcnJheUJ1ZmZlci5pc1ZpZXcgbWV0aG9kIGlzIG5vdCBkZWZpbmVkIGluIElFMTBcbmNvbnN0IGlzVmlldyA9IG9iaiA9PiB7XG4gICAgcmV0dXJuIHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IEFycmF5QnVmZmVyLmlzVmlldyhvYmopXG4gICAgICAgIDogb2JqICYmIG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcjtcbn07XG5jb25zdCBlbmNvZGVQYWNrZXQgPSAoeyB0eXBlLCBkYXRhIH0sIHN1cHBvcnRzQmluYXJ5LCBjYWxsYmFjaykgPT4ge1xuICAgIGlmICh3aXRoTmF0aXZlQmxvYiAmJiBkYXRhIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICBpZiAoc3VwcG9ydHNCaW5hcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVCbG9iQXNCYXNlNjQoZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHdpdGhOYXRpdmVBcnJheUJ1ZmZlciAmJlxuICAgICAgICAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzVmlldyhkYXRhKSkpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQmxvYkFzQmFzZTY0KG5ldyBCbG9iKFtkYXRhXSksIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBwbGFpbiBzdHJpbmdcbiAgICByZXR1cm4gY2FsbGJhY2soUEFDS0VUX1RZUEVTW3R5cGVdICsgKGRhdGEgfHwgXCJcIikpO1xufTtcbmNvbnN0IGVuY29kZUJsb2JBc0Jhc2U2NCA9IChkYXRhLCBjYWxsYmFjaykgPT4ge1xuICAgIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZmlsZVJlYWRlci5yZXN1bHQuc3BsaXQoXCIsXCIpWzFdO1xuICAgICAgICBjYWxsYmFjayhcImJcIiArIChjb250ZW50IHx8IFwiXCIpKTtcbiAgICB9O1xuICAgIHJldHVybiBmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZGF0YSk7XG59O1xuZXhwb3J0IGRlZmF1bHQgZW5jb2RlUGFja2V0O1xuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vYmFzZTY0LWFycmF5YnVmZmVyXG5jb25zdCBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcbi8vIFVzZSBhIGxvb2t1cCB0YWJsZSB0byBmaW5kIHRoZSBpbmRleC5cbmNvbnN0IGxvb2t1cCA9IHR5cGVvZiBVaW50OEFycmF5ID09PSAndW5kZWZpbmVkJyA/IFtdIDogbmV3IFVpbnQ4QXJyYXkoMjU2KTtcbmZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICBsb29rdXBbY2hhcnMuY2hhckNvZGVBdChpKV0gPSBpO1xufVxuZXhwb3J0IGNvbnN0IGVuY29kZSA9IChhcnJheWJ1ZmZlcikgPT4ge1xuICAgIGxldCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKSwgaSwgbGVuID0gYnl0ZXMubGVuZ3RoLCBiYXNlNjQgPSAnJztcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDMpIHtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2ldID4+IDJdO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbKChieXRlc1tpXSAmIDMpIDw8IDQpIHwgKGJ5dGVzW2kgKyAxXSA+PiA0KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2kgKyAxXSAmIDE1KSA8PCAyKSB8IChieXRlc1tpICsgMl0gPj4gNildO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaSArIDJdICYgNjNdO1xuICAgIH1cbiAgICBpZiAobGVuICUgMyA9PT0gMikge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAxKSArICc9JztcbiAgICB9XG4gICAgZWxzZSBpZiAobGVuICUgMyA9PT0gMSkge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAyKSArICc9PSc7XG4gICAgfVxuICAgIHJldHVybiBiYXNlNjQ7XG59O1xuZXhwb3J0IGNvbnN0IGRlY29kZSA9IChiYXNlNjQpID0+IHtcbiAgICBsZXQgYnVmZmVyTGVuZ3RoID0gYmFzZTY0Lmxlbmd0aCAqIDAuNzUsIGxlbiA9IGJhc2U2NC5sZW5ndGgsIGksIHAgPSAwLCBlbmNvZGVkMSwgZW5jb2RlZDIsIGVuY29kZWQzLCBlbmNvZGVkNDtcbiAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAxXSA9PT0gJz0nKSB7XG4gICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAyXSA9PT0gJz0nKSB7XG4gICAgICAgICAgICBidWZmZXJMZW5ndGgtLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBhcnJheWJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXJMZW5ndGgpLCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICAgICAgZW5jb2RlZDEgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSldO1xuICAgICAgICBlbmNvZGVkMiA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpICsgMSldO1xuICAgICAgICBlbmNvZGVkMyA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpICsgMildO1xuICAgICAgICBlbmNvZGVkNCA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpICsgMyldO1xuICAgICAgICBieXRlc1twKytdID0gKGVuY29kZWQxIDw8IDIpIHwgKGVuY29kZWQyID4+IDQpO1xuICAgICAgICBieXRlc1twKytdID0gKChlbmNvZGVkMiAmIDE1KSA8PCA0KSB8IChlbmNvZGVkMyA+PiAyKTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDMgJiAzKSA8PCA2KSB8IChlbmNvZGVkNCAmIDYzKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5YnVmZmVyO1xufTtcbiIsImltcG9ydCB7IEVSUk9SX1BBQ0tFVCwgUEFDS0VUX1RZUEVTX1JFVkVSU0UgfSBmcm9tIFwiLi9jb21tb25zLmpzXCI7XG5pbXBvcnQgeyBkZWNvZGUgfSBmcm9tIFwiLi9jb250cmliL2Jhc2U2NC1hcnJheWJ1ZmZlci5qc1wiO1xuY29uc3Qgd2l0aE5hdGl2ZUFycmF5QnVmZmVyID0gdHlwZW9mIEFycmF5QnVmZmVyID09PSBcImZ1bmN0aW9uXCI7XG5jb25zdCBkZWNvZGVQYWNrZXQgPSAoZW5jb2RlZFBhY2tldCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGlmICh0eXBlb2YgZW5jb2RlZFBhY2tldCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBtYXBCaW5hcnkoZW5jb2RlZFBhY2tldCwgYmluYXJ5VHlwZSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdHlwZSA9IGVuY29kZWRQYWNrZXQuY2hhckF0KDApO1xuICAgIGlmICh0eXBlID09PSBcImJcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBkZWNvZGVCYXNlNjRQYWNrZXQoZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSksIGJpbmFyeVR5cGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHBhY2tldFR5cGUgPSBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXTtcbiAgICBpZiAoIXBhY2tldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIEVSUk9SX1BBQ0tFVDtcbiAgICB9XG4gICAgcmV0dXJuIGVuY29kZWRQYWNrZXQubGVuZ3RoID4gMVxuICAgICAgICA/IHtcbiAgICAgICAgICAgIHR5cGU6IFBBQ0tFVF9UWVBFU19SRVZFUlNFW3R5cGVdLFxuICAgICAgICAgICAgZGF0YTogZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSlcbiAgICAgICAgfVxuICAgICAgICA6IHtcbiAgICAgICAgICAgIHR5cGU6IFBBQ0tFVF9UWVBFU19SRVZFUlNFW3R5cGVdXG4gICAgICAgIH07XG59O1xuY29uc3QgZGVjb2RlQmFzZTY0UGFja2V0ID0gKGRhdGEsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUFycmF5QnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBkZWNvZGUoZGF0YSk7XG4gICAgICAgIHJldHVybiBtYXBCaW5hcnkoZGVjb2RlZCwgYmluYXJ5VHlwZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4geyBiYXNlNjQ6IHRydWUsIGRhdGEgfTsgLy8gZmFsbGJhY2sgZm9yIG9sZCBicm93c2Vyc1xuICAgIH1cbn07XG5jb25zdCBtYXBCaW5hcnkgPSAoZGF0YSwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIHN3aXRjaCAoYmluYXJ5VHlwZSkge1xuICAgICAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgICAgICAgcmV0dXJuIGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciA/IG5ldyBCbG9iKFtkYXRhXSkgOiBkYXRhO1xuICAgICAgICBjYXNlIFwiYXJyYXlidWZmZXJcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBkYXRhOyAvLyBhc3N1bWluZyB0aGUgZGF0YSBpcyBhbHJlYWR5IGFuIEFycmF5QnVmZmVyXG4gICAgfVxufTtcbmV4cG9ydCBkZWZhdWx0IGRlY29kZVBhY2tldDtcbiIsImltcG9ydCBlbmNvZGVQYWNrZXQgZnJvbSBcIi4vZW5jb2RlUGFja2V0LmpzXCI7XG5pbXBvcnQgZGVjb2RlUGFja2V0IGZyb20gXCIuL2RlY29kZVBhY2tldC5qc1wiO1xuY29uc3QgU0VQQVJBVE9SID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMCk7IC8vIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9EZWxpbWl0ZXIjQVNDSUlfZGVsaW1pdGVkX3RleHRcbmNvbnN0IGVuY29kZVBheWxvYWQgPSAocGFja2V0cywgY2FsbGJhY2spID0+IHtcbiAgICAvLyBzb21lIHBhY2tldHMgbWF5IGJlIGFkZGVkIHRvIHRoZSBhcnJheSB3aGlsZSBlbmNvZGluZywgc28gdGhlIGluaXRpYWwgbGVuZ3RoIG11c3QgYmUgc2F2ZWRcbiAgICBjb25zdCBsZW5ndGggPSBwYWNrZXRzLmxlbmd0aDtcbiAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgcGFja2V0cy5mb3JFYWNoKChwYWNrZXQsIGkpID0+IHtcbiAgICAgICAgLy8gZm9yY2UgYmFzZTY0IGVuY29kaW5nIGZvciBiaW5hcnkgcGFja2V0c1xuICAgICAgICBlbmNvZGVQYWNrZXQocGFja2V0LCBmYWxzZSwgZW5jb2RlZFBhY2tldCA9PiB7XG4gICAgICAgICAgICBlbmNvZGVkUGFja2V0c1tpXSA9IGVuY29kZWRQYWNrZXQ7XG4gICAgICAgICAgICBpZiAoKytjb3VudCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZW5jb2RlZFBhY2tldHMuam9pbihTRVBBUkFUT1IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuY29uc3QgZGVjb2RlUGF5bG9hZCA9IChlbmNvZGVkUGF5bG9hZCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGNvbnN0IGVuY29kZWRQYWNrZXRzID0gZW5jb2RlZFBheWxvYWQuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBjb25zdCBwYWNrZXRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWNvZGVkUGFja2V0ID0gZGVjb2RlUGFja2V0KGVuY29kZWRQYWNrZXRzW2ldLCBiaW5hcnlUeXBlKTtcbiAgICAgICAgcGFja2V0cy5wdXNoKGRlY29kZWRQYWNrZXQpO1xuICAgICAgICBpZiAoZGVjb2RlZFBhY2tldC50eXBlID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYWNrZXRzO1xufTtcbmV4cG9ydCBjb25zdCBwcm90b2NvbCA9IDQ7XG5leHBvcnQgeyBlbmNvZGVQYWNrZXQsIGVuY29kZVBheWxvYWQsIGRlY29kZVBhY2tldCwgZGVjb2RlUGF5bG9hZCB9O1xuIiwiLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBFbWl0dGVyKG9iaikge1xuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcbn1cblxuLyoqXG4gKiBNaXhpbiB0aGUgZW1pdHRlciBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG1peGluKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gRW1pdHRlci5wcm90b3R5cGUpIHtcbiAgICBvYmpba2V5XSA9IEVtaXR0ZXIucHJvdG90eXBlW2tleV07XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBMaXN0ZW4gb24gdGhlIGdpdmVuIGBldmVudGAgd2l0aCBgZm5gLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uID1cbkVtaXR0ZXIucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gICh0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSB8fCBbXSlcbiAgICAucHVzaChmbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGRzIGFuIGBldmVudGAgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgYSBzaW5nbGVcbiAqIHRpbWUgdGhlbiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIGZ1bmN0aW9uIG9uKCkge1xuICAgIHRoaXMub2ZmKGV2ZW50LCBvbik7XG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIG9uLmZuID0gZm47XG4gIHRoaXMub24oZXZlbnQsIG9uKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGBldmVudGAgb3IgYWxsXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vZmYgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgLy8gYWxsXG4gIGlmICgwID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9jYWxsYmFja3MgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHNwZWNpZmljIGV2ZW50XG4gIHZhciBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuICBpZiAoIWNhbGxiYWNrcykgcmV0dXJuIHRoaXM7XG5cbiAgLy8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICBpZiAoMSA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyByZW1vdmUgc3BlY2lmaWMgaGFuZGxlclxuICB2YXIgY2I7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2IgPSBjYWxsYmFja3NbaV07XG4gICAgaWYgKGNiID09PSBmbiB8fCBjYi5mbiA9PT0gZm4pIHtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgZXZlbnQgc3BlY2lmaWMgYXJyYXlzIGZvciBldmVudCB0eXBlcyB0aGF0IG5vXG4gIC8vIG9uZSBpcyBzdWJzY3JpYmVkIGZvciB0byBhdm9pZCBtZW1vcnkgbGVhay5cbiAgaWYgKGNhbGxiYWNrcy5sZW5ndGggPT09IDApIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFbWl0IGBldmVudGAgd2l0aCB0aGUgZ2l2ZW4gYXJncy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7TWl4ZWR9IC4uLlxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuXG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gIH1cblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGFsaWFzIHVzZWQgZm9yIHJlc2VydmVkIGV2ZW50cyAocHJvdGVjdGVkIG1ldGhvZClcbkVtaXR0ZXIucHJvdG90eXBlLmVtaXRSZXNlcnZlZCA9IEVtaXR0ZXIucHJvdG90eXBlLmVtaXQ7XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW107XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XG59O1xuIiwiZXhwb3J0IGNvbnN0IGdsb2JhbFRoaXNTaGltID0gKCgpID0+IHtcbiAgICBpZiAodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCk7XG4gICAgfVxufSkoKTtcbiIsImltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi9nbG9iYWxUaGlzLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gcGljayhvYmosIC4uLmF0dHIpIHtcbiAgICByZXR1cm4gYXR0ci5yZWR1Y2UoKGFjYywgaykgPT4ge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICBhY2Nba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG59XG4vLyBLZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSByZWFsIHRpbWVvdXQgZnVuY3Rpb25zIHNvIHRoZXkgY2FuIGJlIHVzZWQgd2hlbiBvdmVycmlkZGVuXG5jb25zdCBOQVRJVkVfU0VUX1RJTUVPVVQgPSBnbG9iYWxUaGlzLnNldFRpbWVvdXQ7XG5jb25zdCBOQVRJVkVfQ0xFQVJfVElNRU9VVCA9IGdsb2JhbFRoaXMuY2xlYXJUaW1lb3V0O1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxUaW1lckZ1bmN0aW9ucyhvYmosIG9wdHMpIHtcbiAgICBpZiAob3B0cy51c2VOYXRpdmVUaW1lcnMpIHtcbiAgICAgICAgb2JqLnNldFRpbWVvdXRGbiA9IE5BVElWRV9TRVRfVElNRU9VVC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgICAgICBvYmouY2xlYXJUaW1lb3V0Rm4gPSBOQVRJVkVfQ0xFQVJfVElNRU9VVC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb2JqLnNldFRpbWVvdXRGbiA9IGdsb2JhbFRoaXMuc2V0VGltZW91dC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgICAgICBvYmouY2xlYXJUaW1lb3V0Rm4gPSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgIH1cbn1cbi8vIGJhc2U2NCBlbmNvZGVkIGJ1ZmZlcnMgYXJlIGFib3V0IDMzJSBiaWdnZXIgKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NClcbmNvbnN0IEJBU0U2NF9PVkVSSEVBRCA9IDEuMzM7XG4vLyB3ZSBjb3VsZCBhbHNvIGhhdmUgdXNlZCBgbmV3IEJsb2IoW29ial0pLnNpemVgLCBidXQgaXQgaXNuJ3Qgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVMZW5ndGgob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHV0ZjhMZW5ndGgob2JqKTtcbiAgICB9XG4gICAgLy8gYXJyYXlidWZmZXIgb3IgYmxvYlxuICAgIHJldHVybiBNYXRoLmNlaWwoKG9iai5ieXRlTGVuZ3RoIHx8IG9iai5zaXplKSAqIEJBU0U2NF9PVkVSSEVBRCk7XG59XG5mdW5jdGlvbiB1dGY4TGVuZ3RoKHN0cikge1xuICAgIGxldCBjID0gMCwgbGVuZ3RoID0gMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHN0ci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBpZiAoYyA8IDB4ODApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgbGVuZ3RoICs9IDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyA8IDB4ZDgwMCB8fCBjID49IDB4ZTAwMCkge1xuICAgICAgICAgICAgbGVuZ3RoICs9IDM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBsZW5ndGggKz0gNDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGVuZ3RoO1xufVxuIiwiaW1wb3J0IHsgZGVjb2RlUGFja2V0IH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zIH0gZnJvbSBcIi4vdXRpbC5qc1wiO1xuY2xhc3MgVHJhbnNwb3J0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IocmVhc29uLCBkZXNjcmlwdGlvbiwgY29udGV4dCkge1xuICAgICAgICBzdXBlcihyZWFzb24pO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzY3JpcHRpb247XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMudHlwZSA9IFwiVHJhbnNwb3J0RXJyb3JcIjtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgVHJhbnNwb3J0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogVHJhbnNwb3J0IGFic3RyYWN0IGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIHRoaXMucXVlcnkgPSBvcHRzLnF1ZXJ5O1xuICAgICAgICB0aGlzLnNvY2tldCA9IG9wdHMuc29ja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb25cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICAgKiBAcGFyYW0gY29udGV4dCAtIHRoZSBlcnJvciBjb250ZXh0XG4gICAgICogQHJldHVybiB7VHJhbnNwb3J0fSBmb3IgY2hhaW5pbmdcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25FcnJvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSB7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIG5ldyBUcmFuc3BvcnRFcnJvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgdHJhbnNwb3J0LlxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICB0aGlzLmRvT3BlbigpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIHRoZSB0cmFuc3BvcnQuXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlbmluZ1wiIHx8IHRoaXMucmVhZHlTdGF0ZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZG9DbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIG11bHRpcGxlIHBhY2tldHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYWNrZXRzXG4gICAgICovXG4gICAgc2VuZChwYWNrZXRzKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICB0aGlzLndyaXRlKHBhY2tldHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBtaWdodCBoYXBwZW4gaWYgdGhlIHRyYW5zcG9ydCB3YXMgc2lsZW50bHkgY2xvc2VkIGluIHRoZSBiZWZvcmV1bmxvYWQgZXZlbnQgaGFuZGxlclxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIG9wZW5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbk9wZW4oKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlblwiO1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRGF0YShkYXRhKSB7XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IGRlY29kZVBhY2tldChkYXRhLCB0aGlzLnNvY2tldC5iaW5hcnlUeXBlKTtcbiAgICAgICAgdGhpcy5vblBhY2tldChwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBhIGRlY29kZWQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uUGFja2V0KHBhY2tldCkge1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRcIiwgcGFja2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25DbG9zZShkZXRhaWxzKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImNsb3NlXCIsIGRldGFpbHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXVzZXMgdGhlIHRyYW5zcG9ydCwgaW4gb3JkZXIgbm90IHRvIGxvc2UgcGFja2V0cyBkdXJpbmcgYW4gdXBncmFkZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvblBhdXNlXG4gICAgICovXG4gICAgcGF1c2Uob25QYXVzZSkgeyB9XG59XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS91bnNoaWZ0aW8veWVhc3Rcbid1c2Ugc3RyaWN0JztcbmNvbnN0IGFscGhhYmV0ID0gJzAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6LV8nLnNwbGl0KCcnKSwgbGVuZ3RoID0gNjQsIG1hcCA9IHt9O1xubGV0IHNlZWQgPSAwLCBpID0gMCwgcHJldjtcbi8qKlxuICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgc3BlY2lmaWVkIG51bWJlci5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbnVtIFRoZSBudW1iZXIgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG51bWJlci5cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGUobnVtKSB7XG4gICAgbGV0IGVuY29kZWQgPSAnJztcbiAgICBkbyB7XG4gICAgICAgIGVuY29kZWQgPSBhbHBoYWJldFtudW0gJSBsZW5ndGhdICsgZW5jb2RlZDtcbiAgICAgICAgbnVtID0gTWF0aC5mbG9vcihudW0gLyBsZW5ndGgpO1xuICAgIH0gd2hpbGUgKG51bSA+IDApO1xuICAgIHJldHVybiBlbmNvZGVkO1xufVxuLyoqXG4gKiBSZXR1cm4gdGhlIGludGVnZXIgdmFsdWUgc3BlY2lmaWVkIGJ5IHRoZSBnaXZlbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgaW50ZWdlciB2YWx1ZSByZXByZXNlbnRlZCBieSB0aGUgc3RyaW5nLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZShzdHIpIHtcbiAgICBsZXQgZGVjb2RlZCA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICBkZWNvZGVkID0gZGVjb2RlZCAqIGxlbmd0aCArIG1hcFtzdHIuY2hhckF0KGkpXTtcbiAgICB9XG4gICAgcmV0dXJuIGRlY29kZWQ7XG59XG4vKipcbiAqIFllYXN0OiBBIHRpbnkgZ3Jvd2luZyBpZCBnZW5lcmF0b3IuXG4gKlxuICogQHJldHVybnMge1N0cmluZ30gQSB1bmlxdWUgaWQuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24geWVhc3QoKSB7XG4gICAgY29uc3Qgbm93ID0gZW5jb2RlKCtuZXcgRGF0ZSgpKTtcbiAgICBpZiAobm93ICE9PSBwcmV2KVxuICAgICAgICByZXR1cm4gc2VlZCA9IDAsIHByZXYgPSBub3c7XG4gICAgcmV0dXJuIG5vdyArICcuJyArIGVuY29kZShzZWVkKyspO1xufVxuLy9cbi8vIE1hcCBlYWNoIGNoYXJhY3RlciB0byBpdHMgaW5kZXguXG4vL1xuZm9yICg7IGkgPCBsZW5ndGg7IGkrKylcbiAgICBtYXBbYWxwaGFiZXRbaV1dID0gaTtcbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2dhbGtuL3F1ZXJ5c3RyaW5nXG4vKipcbiAqIENvbXBpbGVzIGEgcXVlcnlzdHJpbmdcbiAqIFJldHVybnMgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKG9iaikge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBmb3IgKGxldCBpIGluIG9iaikge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aClcbiAgICAgICAgICAgICAgICBzdHIgKz0gJyYnO1xuICAgICAgICAgICAgc3RyICs9IGVuY29kZVVSSUNvbXBvbmVudChpKSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpbaV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59XG4vKipcbiAqIFBhcnNlcyBhIHNpbXBsZSBxdWVyeXN0cmluZyBpbnRvIGFuIG9iamVjdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBxc1xuICogQGFwaSBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUocXMpIHtcbiAgICBsZXQgcXJ5ID0ge307XG4gICAgbGV0IHBhaXJzID0gcXMuc3BsaXQoJyYnKTtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHBhaXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBsZXQgcGFpciA9IHBhaXJzW2ldLnNwbGl0KCc9Jyk7XG4gICAgICAgIHFyeVtkZWNvZGVVUklDb21wb25lbnQocGFpclswXSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pO1xuICAgIH1cbiAgICByZXR1cm4gcXJ5O1xufVxuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vY29tcG9uZW50L2hhcy1jb3JzXG5sZXQgdmFsdWUgPSBmYWxzZTtcbnRyeSB7XG4gICAgdmFsdWUgPSB0eXBlb2YgWE1MSHR0cFJlcXVlc3QgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xufVxuY2F0Y2ggKGVycikge1xuICAgIC8vIGlmIFhNTEh0dHAgc3VwcG9ydCBpcyBkaXNhYmxlZCBpbiBJRSB0aGVuIGl0IHdpbGwgdGhyb3dcbiAgICAvLyB3aGVuIHRyeWluZyB0byBjcmVhdGVcbn1cbmV4cG9ydCBjb25zdCBoYXNDT1JTID0gdmFsdWU7XG4iLCIvLyBicm93c2VyIHNoaW0gZm9yIHhtbGh0dHByZXF1ZXN0IG1vZHVsZVxuaW1wb3J0IHsgaGFzQ09SUyB9IGZyb20gXCIuLi9jb250cmliL2hhcy1jb3JzLmpzXCI7XG5pbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4uL2dsb2JhbFRoaXMuanNcIjtcbmV4cG9ydCBmdW5jdGlvbiBYSFIob3B0cykge1xuICAgIGNvbnN0IHhkb21haW4gPSBvcHRzLnhkb21haW47XG4gICAgLy8gWE1MSHR0cFJlcXVlc3QgY2FuIGJlIGRpc2FibGVkIG9uIElFXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAmJiAoIXhkb21haW4gfHwgaGFzQ09SUykpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZSkgeyB9XG4gICAgaWYgKCF4ZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGdsb2JhbFRoaXNbW1wiQWN0aXZlXCJdLmNvbmNhdChcIk9iamVjdFwiKS5qb2luKFwiWFwiKV0oXCJNaWNyb3NvZnQuWE1MSFRUUFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uL3RyYW5zcG9ydC5qc1wiO1xuaW1wb3J0IHsgeWVhc3QgfSBmcm9tIFwiLi4vY29udHJpYi95ZWFzdC5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSBcIi4uL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlUGF5bG9hZCwgZGVjb2RlUGF5bG9hZCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBYSFIgYXMgWE1MSHR0cFJlcXVlc3QgfSBmcm9tIFwiLi94bWxodHRwcmVxdWVzdC5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5pbXBvcnQgeyBpbnN0YWxsVGltZXJGdW5jdGlvbnMsIHBpY2sgfSBmcm9tIFwiLi4vdXRpbC5qc1wiO1xuaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuLi9nbG9iYWxUaGlzLmpzXCI7XG5mdW5jdGlvbiBlbXB0eSgpIHsgfVxuY29uc3QgaGFzWEhSMiA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KHtcbiAgICAgICAgeGRvbWFpbjogZmFsc2UsXG4gICAgfSk7XG4gICAgcmV0dXJuIG51bGwgIT0geGhyLnJlc3BvbnNlVHlwZTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgUG9sbGluZyBleHRlbmRzIFRyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogWEhSIFBvbGxpbmcgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgY29uc3RydWN0b3Iob3B0cykge1xuICAgICAgICBzdXBlcihvcHRzKTtcbiAgICAgICAgdGhpcy5wb2xsaW5nID0gZmFsc2U7XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzU1NMID0gXCJodHRwczpcIiA9PT0gbG9jYXRpb24ucHJvdG9jb2w7XG4gICAgICAgICAgICBsZXQgcG9ydCA9IGxvY2F0aW9uLnBvcnQ7XG4gICAgICAgICAgICAvLyBzb21lIHVzZXIgYWdlbnRzIGhhdmUgZW1wdHkgYGxvY2F0aW9uLnBvcnRgXG4gICAgICAgICAgICBpZiAoIXBvcnQpIHtcbiAgICAgICAgICAgICAgICBwb3J0ID0gaXNTU0wgPyBcIjQ0M1wiIDogXCI4MFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy54ZCA9XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmhvc3RuYW1lICE9PSBsb2NhdGlvbi5ob3N0bmFtZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgcG9ydCAhPT0gb3B0cy5wb3J0O1xuICAgICAgICAgICAgdGhpcy54cyA9IG9wdHMuc2VjdXJlICE9PSBpc1NTTDtcbiAgICAgICAgfVxuICAgICAgICAvKipcbiAgICAgICAgICogWEhSIHN1cHBvcnRzIGJpbmFyeVxuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgZm9yY2VCYXNlNjQgPSBvcHRzICYmIG9wdHMuZm9yY2VCYXNlNjQ7XG4gICAgICAgIHRoaXMuc3VwcG9ydHNCaW5hcnkgPSBoYXNYSFIyICYmICFmb3JjZUJhc2U2NDtcbiAgICB9XG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBcInBvbGxpbmdcIjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIHNvY2tldCAodHJpZ2dlcnMgcG9sbGluZykuIFdlIHdyaXRlIGEgUElORyBtZXNzYWdlIHRvIGRldGVybWluZVxuICAgICAqIHdoZW4gdGhlIHRyYW5zcG9ydCBpcyBvcGVuLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGRvT3BlbigpIHtcbiAgICAgICAgdGhpcy5wb2xsKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhdXNlcyBwb2xsaW5nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25QYXVzZSAtIGNhbGxiYWNrIHVwb24gYnVmZmVycyBhcmUgZmx1c2hlZCBhbmQgdHJhbnNwb3J0IGlzIHBhdXNlZFxuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgcGF1c2Uob25QYXVzZSkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcInBhdXNpbmdcIjtcbiAgICAgICAgY29uc3QgcGF1c2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcInBhdXNlZFwiO1xuICAgICAgICAgICAgb25QYXVzZSgpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5wb2xsaW5nIHx8ICF0aGlzLndyaXRhYmxlKSB7XG4gICAgICAgICAgICBsZXQgdG90YWwgPSAwO1xuICAgICAgICAgICAgaWYgKHRoaXMucG9sbGluZykge1xuICAgICAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwicG9sbENvbXBsZXRlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgLS10b3RhbCB8fCBwYXVzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLndyaXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdG90YWwrKztcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2UoXCJkcmFpblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhdXNlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhcnRzIHBvbGxpbmcgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHBvbGwoKSB7XG4gICAgICAgIHRoaXMucG9sbGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZG9Qb2xsKCk7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9sbFwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcmxvYWRzIG9uRGF0YSB0byBkZXRlY3QgcGF5bG9hZHMuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25EYXRhKGRhdGEpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAocGFja2V0KSA9PiB7XG4gICAgICAgICAgICAvLyBpZiBpdHMgdGhlIGZpcnN0IG1lc3NhZ2Ugd2UgY29uc2lkZXIgdGhlIHRyYW5zcG9ydCBvcGVuXG4gICAgICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSAmJiBwYWNrZXQudHlwZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgaXRzIGEgY2xvc2UgcGFja2V0LCB3ZSBjbG9zZSB0aGUgb25nb2luZyByZXF1ZXN0c1xuICAgICAgICAgICAgaWYgKFwiY2xvc2VcIiA9PT0gcGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoeyBkZXNjcmlwdGlvbjogXCJ0cmFuc3BvcnQgY2xvc2VkIGJ5IHRoZSBzZXJ2ZXJcIiB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgYnlwYXNzIG9uRGF0YSBhbmQgaGFuZGxlIHRoZSBtZXNzYWdlXG4gICAgICAgICAgICB0aGlzLm9uUGFja2V0KHBhY2tldCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIGRlY29kZSBwYXlsb2FkXG4gICAgICAgIGRlY29kZVBheWxvYWQoZGF0YSwgdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSkuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgICAgIC8vIGlmIGFuIGV2ZW50IGRpZCBub3QgdHJpZ2dlciBjbG9zaW5nXG4gICAgICAgIGlmIChcImNsb3NlZFwiICE9PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlIGdvdCBkYXRhIHdlJ3JlIG5vdCBwb2xsaW5nXG4gICAgICAgICAgICB0aGlzLnBvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9sbENvbXBsZXRlXCIpO1xuICAgICAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBvbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZvciBwb2xsaW5nLCBzZW5kIGEgY2xvc2UgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGRvQ2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy53cml0ZShbeyB0eXBlOiBcImNsb3NlXCIgfV0pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIGluIGNhc2Ugd2UncmUgdHJ5aW5nIHRvIGNsb3NlIHdoaWxlXG4gICAgICAgICAgICAvLyBoYW5kc2hha2luZyBpcyBpbiBwcm9ncmVzcyAoR0gtMTY0KVxuICAgICAgICAgICAgdGhpcy5vbmNlKFwib3BlblwiLCBjbG9zZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogV3JpdGVzIGEgcGFja2V0cyBwYXlsb2FkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gcGFja2V0cyAtIGRhdGEgcGFja2V0c1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICB3cml0ZShwYWNrZXRzKSB7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgZW5jb2RlUGF5bG9hZChwYWNrZXRzLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kb1dyaXRlKGRhdGEsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRyYWluXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgdXJpIGZvciBjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICB1cmkoKSB7XG4gICAgICAgIGxldCBxdWVyeSA9IHRoaXMucXVlcnkgfHwge307XG4gICAgICAgIGNvbnN0IHNjaGVtYSA9IHRoaXMub3B0cy5zZWN1cmUgPyBcImh0dHBzXCIgOiBcImh0dHBcIjtcbiAgICAgICAgbGV0IHBvcnQgPSBcIlwiO1xuICAgICAgICAvLyBjYWNoZSBidXN0aW5nIGlzIGZvcmNlZFxuICAgICAgICBpZiAoZmFsc2UgIT09IHRoaXMub3B0cy50aW1lc3RhbXBSZXF1ZXN0cykge1xuICAgICAgICAgICAgcXVlcnlbdGhpcy5vcHRzLnRpbWVzdGFtcFBhcmFtXSA9IHllYXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnN1cHBvcnRzQmluYXJ5ICYmICFxdWVyeS5zaWQpIHtcbiAgICAgICAgICAgIHF1ZXJ5LmI2NCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXZvaWQgcG9ydCBpZiBkZWZhdWx0IGZvciBzY2hlbWFcbiAgICAgICAgaWYgKHRoaXMub3B0cy5wb3J0ICYmXG4gICAgICAgICAgICAoKFwiaHR0cHNcIiA9PT0gc2NoZW1hICYmIE51bWJlcih0aGlzLm9wdHMucG9ydCkgIT09IDQ0MykgfHxcbiAgICAgICAgICAgICAgICAoXCJodHRwXCIgPT09IHNjaGVtYSAmJiBOdW1iZXIodGhpcy5vcHRzLnBvcnQpICE9PSA4MCkpKSB7XG4gICAgICAgICAgICBwb3J0ID0gXCI6XCIgKyB0aGlzLm9wdHMucG9ydDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbmNvZGVkUXVlcnkgPSBlbmNvZGUocXVlcnkpO1xuICAgICAgICBjb25zdCBpcHY2ID0gdGhpcy5vcHRzLmhvc3RuYW1lLmluZGV4T2YoXCI6XCIpICE9PSAtMTtcbiAgICAgICAgcmV0dXJuIChzY2hlbWEgK1xuICAgICAgICAgICAgXCI6Ly9cIiArXG4gICAgICAgICAgICAoaXB2NiA/IFwiW1wiICsgdGhpcy5vcHRzLmhvc3RuYW1lICsgXCJdXCIgOiB0aGlzLm9wdHMuaG9zdG5hbWUpICtcbiAgICAgICAgICAgIHBvcnQgK1xuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGggK1xuICAgICAgICAgICAgKGVuY29kZWRRdWVyeS5sZW5ndGggPyBcIj9cIiArIGVuY29kZWRRdWVyeSA6IFwiXCIpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZXF1ZXN0KG9wdHMgPSB7fSkge1xuICAgICAgICBPYmplY3QuYXNzaWduKG9wdHMsIHsgeGQ6IHRoaXMueGQsIHhzOiB0aGlzLnhzIH0sIHRoaXMub3B0cyk7XG4gICAgICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLnVyaSgpLCBvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhIHRvIHNlbmQuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGVkIHVwb24gZmx1c2guXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkb1dyaXRlKGRhdGEsIGZuKSB7XG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMucmVxdWVzdCh7XG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcS5vbihcInN1Y2Nlc3NcIiwgZm4pO1xuICAgICAgICByZXEub24oXCJlcnJvclwiLCAoeGhyU3RhdHVzLCBjb250ZXh0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoXCJ4aHIgcG9zdCBlcnJvclwiLCB4aHJTdGF0dXMsIGNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhcnRzIGEgcG9sbCBjeWNsZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZG9Qb2xsKCkge1xuICAgICAgICBjb25zdCByZXEgPSB0aGlzLnJlcXVlc3QoKTtcbiAgICAgICAgcmVxLm9uKFwiZGF0YVwiLCB0aGlzLm9uRGF0YS5iaW5kKHRoaXMpKTtcbiAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgKHhoclN0YXR1cywgY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKFwieGhyIHBvbGwgZXJyb3JcIiwgeGhyU3RhdHVzLCBjb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucG9sbFhociA9IHJlcTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgUmVxdWVzdCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHBhY2thZ2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih1cmksIG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICB0aGlzLm1ldGhvZCA9IG9wdHMubWV0aG9kIHx8IFwiR0VUXCI7XG4gICAgICAgIHRoaXMudXJpID0gdXJpO1xuICAgICAgICB0aGlzLmFzeW5jID0gZmFsc2UgIT09IG9wdHMuYXN5bmM7XG4gICAgICAgIHRoaXMuZGF0YSA9IHVuZGVmaW5lZCAhPT0gb3B0cy5kYXRhID8gb3B0cy5kYXRhIDogbnVsbDtcbiAgICAgICAgdGhpcy5jcmVhdGUoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgWEhSIG9iamVjdCBhbmQgc2VuZHMgdGhlIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNyZWF0ZSgpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHBpY2sodGhpcy5vcHRzLCBcImFnZW50XCIsIFwicGZ4XCIsIFwia2V5XCIsIFwicGFzc3BocmFzZVwiLCBcImNlcnRcIiwgXCJjYVwiLCBcImNpcGhlcnNcIiwgXCJyZWplY3RVbmF1dGhvcml6ZWRcIiwgXCJhdXRvVW5yZWZcIik7XG4gICAgICAgIG9wdHMueGRvbWFpbiA9ICEhdGhpcy5vcHRzLnhkO1xuICAgICAgICBvcHRzLnhzY2hlbWUgPSAhIXRoaXMub3B0cy54cztcbiAgICAgICAgY29uc3QgeGhyID0gKHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KG9wdHMpKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhoci5vcGVuKHRoaXMubWV0aG9kLCB0aGlzLnVyaSwgdGhpcy5hc3luYyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sgJiYgeGhyLnNldERpc2FibGVIZWFkZXJDaGVjayh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSBpbiB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGksIHRoaXMub3B0cy5leHRyYUhlYWRlcnNbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgaWYgKFwiUE9TVFwiID09PSB0aGlzLm1ldGhvZCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwidGV4dC9wbGFpbjtjaGFyc2V0PVVURi04XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQWNjZXB0XCIsIFwiKi8qXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgLy8gaWU2IGNoZWNrXG4gICAgICAgICAgICBpZiAoXCJ3aXRoQ3JlZGVudGlhbHNcIiBpbiB4aHIpIHtcbiAgICAgICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdGhpcy5vcHRzLndpdGhDcmVkZW50aWFscztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMucmVxdWVzdFRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB4aHIudGltZW91dCA9IHRoaXMub3B0cy5yZXF1ZXN0VGltZW91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKDQgIT09IHhoci5yZWFkeVN0YXRlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKDIwMCA9PT0geGhyLnN0YXR1cyB8fCAxMjIzID09PSB4aHIuc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25Mb2FkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIGBlcnJvcmAgZXZlbnQgaGFuZGxlciB0aGF0J3MgdXNlci1zZXRcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgdGhyb3cgaW4gdGhlIHNhbWUgdGljayBhbmQgZ2V0cyBjYXVnaHQgaGVyZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IodHlwZW9mIHhoci5zdGF0dXMgPT09IFwibnVtYmVyXCIgPyB4aHIuc3RhdHVzIDogMCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB4aHIuc2VuZCh0aGlzLmRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOZWVkIHRvIGRlZmVyIHNpbmNlIC5jcmVhdGUoKSBpcyBjYWxsZWQgZGlyZWN0bHkgZnJvbSB0aGUgY29uc3RydWN0b3JcbiAgICAgICAgICAgIC8vIGFuZCB0aHVzIHRoZSAnZXJyb3InIGV2ZW50IGNhbiBvbmx5IGJlIG9ubHkgYm91bmQgKmFmdGVyKiB0aGlzIGV4Y2VwdGlvblxuICAgICAgICAgICAgLy8gb2NjdXJzLiAgVGhlcmVmb3JlLCBhbHNvLCB3ZSBjYW5ub3QgdGhyb3cgaGVyZSBhdCBhbGwuXG4gICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGUpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy5pbmRleCA9IFJlcXVlc3QucmVxdWVzdHNDb3VudCsrO1xuICAgICAgICAgICAgUmVxdWVzdC5yZXF1ZXN0c1t0aGlzLmluZGV4XSA9IHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyLCB0aGlzLnhocik7XG4gICAgICAgIHRoaXMuY2xlYW51cCh0cnVlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYW5zIHVwIGhvdXNlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjbGVhbnVwKGZyb21FcnJvcikge1xuICAgICAgICBpZiAoXCJ1bmRlZmluZWRcIiA9PT0gdHlwZW9mIHRoaXMueGhyIHx8IG51bGwgPT09IHRoaXMueGhyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZW1wdHk7XG4gICAgICAgIGlmIChmcm9tRXJyb3IpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy54aHIuYWJvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBkZWxldGUgUmVxdWVzdC5yZXF1ZXN0c1t0aGlzLmluZGV4XTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnhociA9IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGxvYWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uTG9hZCgpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMueGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgaWYgKGRhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZGF0YVwiLCBkYXRhKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwic3VjY2Vzc1wiKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFib3J0cyB0aGUgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgYWJvcnQoKSB7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbn1cblJlcXVlc3QucmVxdWVzdHNDb3VudCA9IDA7XG5SZXF1ZXN0LnJlcXVlc3RzID0ge307XG4vKipcbiAqIEFib3J0cyBwZW5kaW5nIHJlcXVlc3RzIHdoZW4gdW5sb2FkaW5nIHRoZSB3aW5kb3cuIFRoaXMgaXMgbmVlZGVkIHRvIHByZXZlbnRcbiAqIG1lbW9yeSBsZWFrcyAoZS5nLiB3aGVuIHVzaW5nIElFKSBhbmQgdG8gZW5zdXJlIHRoYXQgbm8gc3B1cmlvdXMgZXJyb3IgaXNcbiAqIGVtaXR0ZWQuXG4gKi9cbmlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBhdHRhY2hFdmVudCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgYXR0YWNoRXZlbnQoXCJvbnVubG9hZFwiLCB1bmxvYWRIYW5kbGVyKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjb25zdCB0ZXJtaW5hdGlvbkV2ZW50ID0gXCJvbnBhZ2VoaWRlXCIgaW4gZ2xvYmFsVGhpcyA/IFwicGFnZWhpZGVcIiA6IFwidW5sb2FkXCI7XG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIodGVybWluYXRpb25FdmVudCwgdW5sb2FkSGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVubG9hZEhhbmRsZXIoKSB7XG4gICAgZm9yIChsZXQgaSBpbiBSZXF1ZXN0LnJlcXVlc3RzKSB7XG4gICAgICAgIGlmIChSZXF1ZXN0LnJlcXVlc3RzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBSZXF1ZXN0LnJlcXVlc3RzW2ldLmFib3J0KCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4uL2dsb2JhbFRoaXMuanNcIjtcbmV4cG9ydCBjb25zdCBuZXh0VGljayA9ICgoKSA9PiB7XG4gICAgY29uc3QgaXNQcm9taXNlQXZhaWxhYmxlID0gdHlwZW9mIFByb21pc2UgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgUHJvbWlzZS5yZXNvbHZlID09PSBcImZ1bmN0aW9uXCI7XG4gICAgaWYgKGlzUHJvbWlzZUF2YWlsYWJsZSkge1xuICAgICAgICByZXR1cm4gKGNiKSA9PiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGNiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiAoY2IsIHNldFRpbWVvdXRGbikgPT4gc2V0VGltZW91dEZuKGNiLCAwKTtcbiAgICB9XG59KSgpO1xuZXhwb3J0IGNvbnN0IFdlYlNvY2tldCA9IGdsb2JhbFRoaXMuV2ViU29ja2V0IHx8IGdsb2JhbFRoaXMuTW96V2ViU29ja2V0O1xuZXhwb3J0IGNvbnN0IHVzaW5nQnJvd3NlcldlYlNvY2tldCA9IHRydWU7XG5leHBvcnQgY29uc3QgZGVmYXVsdEJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4iLCJpbXBvcnQgeyBUcmFuc3BvcnQgfSBmcm9tIFwiLi4vdHJhbnNwb3J0LmpzXCI7XG5pbXBvcnQgeyBlbmNvZGUgfSBmcm9tIFwiLi4vY29udHJpYi9wYXJzZXFzLmpzXCI7XG5pbXBvcnQgeyB5ZWFzdCB9IGZyb20gXCIuLi9jb250cmliL3llYXN0LmpzXCI7XG5pbXBvcnQgeyBwaWNrIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGRlZmF1bHRCaW5hcnlUeXBlLCBuZXh0VGljaywgdXNpbmdCcm93c2VyV2ViU29ja2V0LCBXZWJTb2NrZXQsIH0gZnJvbSBcIi4vd2Vic29ja2V0LWNvbnN0cnVjdG9yLmpzXCI7XG5pbXBvcnQgeyBlbmNvZGVQYWNrZXQgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuLy8gZGV0ZWN0IFJlYWN0TmF0aXZlIGVudmlyb25tZW50XG5jb25zdCBpc1JlYWN0TmF0aXZlID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiBuYXZpZ2F0b3IucHJvZHVjdCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIG5hdmlnYXRvci5wcm9kdWN0LnRvTG93ZXJDYXNlKCkgPT09IFwicmVhY3RuYXRpdmVcIjtcbmV4cG9ydCBjbGFzcyBXUyBleHRlbmRzIFRyYW5zcG9ydCB7XG4gICAgLyoqXG4gICAgICogV2ViU29ja2V0IHRyYW5zcG9ydCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gY29ubmVjdGlvbiBvcHRpb25zXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIob3B0cyk7XG4gICAgICAgIHRoaXMuc3VwcG9ydHNCaW5hcnkgPSAhb3B0cy5mb3JjZUJhc2U2NDtcbiAgICB9XG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBcIndlYnNvY2tldFwiO1xuICAgIH1cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIGlmICghdGhpcy5jaGVjaygpKSB7XG4gICAgICAgICAgICAvLyBsZXQgcHJvYmUgdGltZW91dFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVyaSA9IHRoaXMudXJpKCk7XG4gICAgICAgIGNvbnN0IHByb3RvY29scyA9IHRoaXMub3B0cy5wcm90b2NvbHM7XG4gICAgICAgIC8vIFJlYWN0IE5hdGl2ZSBvbmx5IHN1cHBvcnRzIHRoZSAnaGVhZGVycycgb3B0aW9uLCBhbmQgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgYW55dGhpbmcgZWxzZSBpcyBwYXNzZWRcbiAgICAgICAgY29uc3Qgb3B0cyA9IGlzUmVhY3ROYXRpdmVcbiAgICAgICAgICAgID8ge31cbiAgICAgICAgICAgIDogcGljayh0aGlzLm9wdHMsIFwiYWdlbnRcIiwgXCJwZXJNZXNzYWdlRGVmbGF0ZVwiLCBcInBmeFwiLCBcImtleVwiLCBcInBhc3NwaHJhc2VcIiwgXCJjZXJ0XCIsIFwiY2FcIiwgXCJjaXBoZXJzXCIsIFwicmVqZWN0VW5hdXRob3JpemVkXCIsIFwibG9jYWxBZGRyZXNzXCIsIFwicHJvdG9jb2xWZXJzaW9uXCIsIFwib3JpZ2luXCIsIFwibWF4UGF5bG9hZFwiLCBcImZhbWlseVwiLCBcImNoZWNrU2VydmVySWRlbnRpdHlcIik7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICBvcHRzLmhlYWRlcnMgPSB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLndzID1cbiAgICAgICAgICAgICAgICB1c2luZ0Jyb3dzZXJXZWJTb2NrZXQgJiYgIWlzUmVhY3ROYXRpdmVcbiAgICAgICAgICAgICAgICAgICAgPyBwcm90b2NvbHNcbiAgICAgICAgICAgICAgICAgICAgICAgID8gbmV3IFdlYlNvY2tldCh1cmksIHByb3RvY29scylcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IFdlYlNvY2tldCh1cmkpXG4gICAgICAgICAgICAgICAgICAgIDogbmV3IFdlYlNvY2tldCh1cmksIHByb3RvY29scywgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndzLmJpbmFyeVR5cGUgPSB0aGlzLnNvY2tldC5iaW5hcnlUeXBlIHx8IGRlZmF1bHRCaW5hcnlUeXBlO1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzb2NrZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMud3Mub25vcGVuID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndzLl9zb2NrZXQudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMud3Mub25jbG9zZSA9IChjbG9zZUV2ZW50KSA9PiB0aGlzLm9uQ2xvc2Uoe1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwid2Vic29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkXCIsXG4gICAgICAgICAgICBjb250ZXh0OiBjbG9zZUV2ZW50LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy53cy5vbm1lc3NhZ2UgPSAoZXYpID0+IHRoaXMub25EYXRhKGV2LmRhdGEpO1xuICAgICAgICB0aGlzLndzLm9uZXJyb3IgPSAoZSkgPT4gdGhpcy5vbkVycm9yKFwid2Vic29ja2V0IGVycm9yXCIsIGUpO1xuICAgIH1cbiAgICB3cml0ZShwYWNrZXRzKSB7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZW5jb2RlUGFja2V0IGVmZmljaWVudCBhcyBpdCB1c2VzIFdTIGZyYW1pbmdcbiAgICAgICAgLy8gbm8gbmVlZCBmb3IgZW5jb2RlUGF5bG9hZFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHBhY2tldHNbaV07XG4gICAgICAgICAgICBjb25zdCBsYXN0UGFja2V0ID0gaSA9PT0gcGFja2V0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgZW5jb2RlUGFja2V0KHBhY2tldCwgdGhpcy5zdXBwb3J0c0JpbmFyeSwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBhbHdheXMgY3JlYXRlIGEgbmV3IG9iamVjdCAoR0gtNDM3KVxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdHMgPSB7fTtcbiAgICAgICAgICAgICAgICBpZiAoIXVzaW5nQnJvd3NlcldlYlNvY2tldCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFja2V0Lm9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcHJlc3MgPSBwYWNrZXQub3B0aW9ucy5jb21wcmVzcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLnBlck1lc3NhZ2VEZWZsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3RyaW5nXCIgPT09IHR5cGVvZiBkYXRhID8gQnVmZmVyLmJ5dGVMZW5ndGgoZGF0YSkgOiBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZW4gPCB0aGlzLm9wdHMucGVyTWVzc2FnZURlZmxhdGUudGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5jb21wcmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFNvbWV0aW1lcyB0aGUgd2Vic29ja2V0IGhhcyBhbHJlYWR5IGJlZW4gY2xvc2VkIGJ1dCB0aGUgYnJvd3NlciBkaWRuJ3RcbiAgICAgICAgICAgICAgICAvLyBoYXZlIGEgY2hhbmNlIG9mIGluZm9ybWluZyB1cyBhYm91dCBpdCB5ZXQsIGluIHRoYXQgY2FzZSBzZW5kIHdpbGxcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBhbiBlcnJvclxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1c2luZ0Jyb3dzZXJXZWJTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFR5cGVFcnJvciBpcyB0aHJvd24gd2hlbiBwYXNzaW5nIHRoZSBzZWNvbmQgYXJndW1lbnQgb24gU2FmYXJpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndzLnNlbmQoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndzLnNlbmQoZGF0YSwgb3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RQYWNrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmFrZSBkcmFpblxuICAgICAgICAgICAgICAgICAgICAvLyBkZWZlciB0byBuZXh0IHRpY2sgdG8gYWxsb3cgU29ja2V0IHRvIGNsZWFyIHdyaXRlQnVmZmVyXG4gICAgICAgICAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRvQ2xvc2UoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy53cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy53cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHVyaSBmb3IgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXJpKCkge1xuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xuICAgICAgICBjb25zdCBzY2hlbWEgPSB0aGlzLm9wdHMuc2VjdXJlID8gXCJ3c3NcIiA6IFwid3NcIjtcbiAgICAgICAgbGV0IHBvcnQgPSBcIlwiO1xuICAgICAgICAvLyBhdm9pZCBwb3J0IGlmIGRlZmF1bHQgZm9yIHNjaGVtYVxuICAgICAgICBpZiAodGhpcy5vcHRzLnBvcnQgJiZcbiAgICAgICAgICAgICgoXCJ3c3NcIiA9PT0gc2NoZW1hICYmIE51bWJlcih0aGlzLm9wdHMucG9ydCkgIT09IDQ0MykgfHxcbiAgICAgICAgICAgICAgICAoXCJ3c1wiID09PSBzY2hlbWEgJiYgTnVtYmVyKHRoaXMub3B0cy5wb3J0KSAhPT0gODApKSkge1xuICAgICAgICAgICAgcG9ydCA9IFwiOlwiICsgdGhpcy5vcHRzLnBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXBwZW5kIHRpbWVzdGFtcCB0byBVUklcbiAgICAgICAgaWYgKHRoaXMub3B0cy50aW1lc3RhbXBSZXF1ZXN0cykge1xuICAgICAgICAgICAgcXVlcnlbdGhpcy5vcHRzLnRpbWVzdGFtcFBhcmFtXSA9IHllYXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tbXVuaWNhdGUgYmluYXJ5IHN1cHBvcnQgY2FwYWJpbGl0aWVzXG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcXVlcnkuYjY0ID0gMTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbmNvZGVkUXVlcnkgPSBlbmNvZGUocXVlcnkpO1xuICAgICAgICBjb25zdCBpcHY2ID0gdGhpcy5vcHRzLmhvc3RuYW1lLmluZGV4T2YoXCI6XCIpICE9PSAtMTtcbiAgICAgICAgcmV0dXJuIChzY2hlbWEgK1xuICAgICAgICAgICAgXCI6Ly9cIiArXG4gICAgICAgICAgICAoaXB2NiA/IFwiW1wiICsgdGhpcy5vcHRzLmhvc3RuYW1lICsgXCJdXCIgOiB0aGlzLm9wdHMuaG9zdG5hbWUpICtcbiAgICAgICAgICAgIHBvcnQgK1xuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGggK1xuICAgICAgICAgICAgKGVuY29kZWRRdWVyeS5sZW5ndGggPyBcIj9cIiArIGVuY29kZWRRdWVyeSA6IFwiXCIpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmVhdHVyZSBkZXRlY3Rpb24gZm9yIFdlYlNvY2tldC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgdGhpcyB0cmFuc3BvcnQgaXMgYXZhaWxhYmxlLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2hlY2soKSB7XG4gICAgICAgIHJldHVybiAhIVdlYlNvY2tldDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBQb2xsaW5nIH0gZnJvbSBcIi4vcG9sbGluZy5qc1wiO1xuaW1wb3J0IHsgV1MgfSBmcm9tIFwiLi93ZWJzb2NrZXQuanNcIjtcbmV4cG9ydCBjb25zdCB0cmFuc3BvcnRzID0ge1xuICAgIHdlYnNvY2tldDogV1MsXG4gICAgcG9sbGluZzogUG9sbGluZyxcbn07XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxrbi9wYXJzZXVyaVxuLyoqXG4gKiBQYXJzZXMgYSBVUklcbiAqXG4gKiBOb3RlOiB3ZSBjb3VsZCBhbHNvIGhhdmUgdXNlZCB0aGUgYnVpbHQtaW4gVVJMIG9iamVjdCwgYnV0IGl0IGlzbid0IHN1cHBvcnRlZCBvbiBhbGwgcGxhdGZvcm1zLlxuICpcbiAqIFNlZTpcbiAqIC0gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1VSTFxuICogLSBodHRwczovL2Nhbml1c2UuY29tL3VybFxuICogLSBodHRwczovL3d3dy5yZmMtZWRpdG9yLm9yZy9yZmMvcmZjMzk4NiNhcHBlbmRpeC1CXG4gKlxuICogSGlzdG9yeSBvZiB0aGUgcGFyc2UoKSBtZXRob2Q6XG4gKiAtIGZpcnN0IGNvbW1pdDogaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL3NvY2tldC5pby1jbGllbnQvY29tbWl0LzRlZTFkNWQ5NGIzOTA2YTljMDUyYjQ1OWYxYTgxOGIxNWYzOGY5MWNcbiAqIC0gZXhwb3J0IGludG8gaXRzIG93biBtb2R1bGU6IGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9lbmdpbmUuaW8tY2xpZW50L2NvbW1pdC9kZTJjNTYxZTQ1NjRlZmViNzhmMWJkYjFiYTM5ZWY4MWIyODIyY2IzXG4gKiAtIHJlaW1wb3J0OiBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vZW5naW5lLmlvLWNsaWVudC9jb21taXQvZGYzMjI3N2MzZjZkNjIyZWVjNWVkMDlmNDkzY2FlM2YzMzkxZDI0MlxuICpcbiAqIEBhdXRob3IgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+IChNSVQgbGljZW5zZSlcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5jb25zdCByZSA9IC9eKD86KD8hW146QFxcLz8jXSs6W146QFxcL10qQCkoaHR0cHxodHRwc3x3c3x3c3MpOlxcL1xcLyk/KCg/OigoW146QFxcLz8jXSopKD86OihbXjpAXFwvPyNdKikpPyk/QCk/KCg/OlthLWYwLTldezAsNH06KXsyLDd9W2EtZjAtOV17MCw0fXxbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvO1xuY29uc3QgcGFydHMgPSBbXG4gICAgJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdhbmNob3InXG5dO1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICAgIGNvbnN0IHNyYyA9IHN0ciwgYiA9IHN0ci5pbmRleE9mKCdbJyksIGUgPSBzdHIuaW5kZXhPZignXScpO1xuICAgIGlmIChiICE9IC0xICYmIGUgIT0gLTEpIHtcbiAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCBiKSArIHN0ci5zdWJzdHJpbmcoYiwgZSkucmVwbGFjZSgvOi9nLCAnOycpICsgc3RyLnN1YnN0cmluZyhlLCBzdHIubGVuZ3RoKTtcbiAgICB9XG4gICAgbGV0IG0gPSByZS5leGVjKHN0ciB8fCAnJyksIHVyaSA9IHt9LCBpID0gMTQ7XG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICB1cmlbcGFydHNbaV1dID0gbVtpXSB8fCAnJztcbiAgICB9XG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICB1cmkuc291cmNlID0gc3JjO1xuICAgICAgICB1cmkuaG9zdCA9IHVyaS5ob3N0LnN1YnN0cmluZygxLCB1cmkuaG9zdC5sZW5ndGggLSAxKS5yZXBsYWNlKC87L2csICc6Jyk7XG4gICAgICAgIHVyaS5hdXRob3JpdHkgPSB1cmkuYXV0aG9yaXR5LnJlcGxhY2UoJ1snLCAnJykucmVwbGFjZSgnXScsICcnKS5yZXBsYWNlKC87L2csICc6Jyk7XG4gICAgICAgIHVyaS5pcHY2dXJpID0gdHJ1ZTtcbiAgICB9XG4gICAgdXJpLnBhdGhOYW1lcyA9IHBhdGhOYW1lcyh1cmksIHVyaVsncGF0aCddKTtcbiAgICB1cmkucXVlcnlLZXkgPSBxdWVyeUtleSh1cmksIHVyaVsncXVlcnknXSk7XG4gICAgcmV0dXJuIHVyaTtcbn1cbmZ1bmN0aW9uIHBhdGhOYW1lcyhvYmosIHBhdGgpIHtcbiAgICBjb25zdCByZWd4ID0gL1xcL3syLDl9L2csIG5hbWVzID0gcGF0aC5yZXBsYWNlKHJlZ3gsIFwiL1wiKS5zcGxpdChcIi9cIik7XG4gICAgaWYgKHBhdGguc2xpY2UoMCwgMSkgPT0gJy8nIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG5hbWVzLnNwbGljZSgwLCAxKTtcbiAgICB9XG4gICAgaWYgKHBhdGguc2xpY2UoLTEpID09ICcvJykge1xuICAgICAgICBuYW1lcy5zcGxpY2UobmFtZXMubGVuZ3RoIC0gMSwgMSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcztcbn1cbmZ1bmN0aW9uIHF1ZXJ5S2V5KHVyaSwgcXVlcnkpIHtcbiAgICBjb25zdCBkYXRhID0ge307XG4gICAgcXVlcnkucmVwbGFjZSgvKD86XnwmKShbXiY9XSopPT8oW14mXSopL2csIGZ1bmN0aW9uICgkMCwgJDEsICQyKSB7XG4gICAgICAgIGlmICgkMSkge1xuICAgICAgICAgICAgZGF0YVskMV0gPSAkMjtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhO1xufVxuIiwiaW1wb3J0IHsgdHJhbnNwb3J0cyB9IGZyb20gXCIuL3RyYW5zcG9ydHMvaW5kZXguanNcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucywgYnl0ZUxlbmd0aCB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9jb250cmliL3BhcnNldXJpLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IHByb3RvY29sIH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmV4cG9ydCBjbGFzcyBTb2NrZXQgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBTb2NrZXQgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHVyaSAtIHVyaSBvciBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJpLCBvcHRzID0ge30pIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xuICAgICAgICBpZiAodXJpICYmIFwib2JqZWN0XCIgPT09IHR5cGVvZiB1cmkpIHtcbiAgICAgICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgICAgICB1cmkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cmkpIHtcbiAgICAgICAgICAgIHVyaSA9IHBhcnNlKHVyaSk7XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lID0gdXJpLmhvc3Q7XG4gICAgICAgICAgICBvcHRzLnNlY3VyZSA9IHVyaS5wcm90b2NvbCA9PT0gXCJodHRwc1wiIHx8IHVyaS5wcm90b2NvbCA9PT0gXCJ3c3NcIjtcbiAgICAgICAgICAgIG9wdHMucG9ydCA9IHVyaS5wb3J0O1xuICAgICAgICAgICAgaWYgKHVyaS5xdWVyeSlcbiAgICAgICAgICAgICAgICBvcHRzLnF1ZXJ5ID0gdXJpLnF1ZXJ5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9wdHMuaG9zdCkge1xuICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSA9IHBhcnNlKG9wdHMuaG9zdCkuaG9zdDtcbiAgICAgICAgfVxuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMuc2VjdXJlID1cbiAgICAgICAgICAgIG51bGwgIT0gb3B0cy5zZWN1cmVcbiAgICAgICAgICAgICAgICA/IG9wdHMuc2VjdXJlXG4gICAgICAgICAgICAgICAgOiB0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgXCJodHRwczpcIiA9PT0gbG9jYXRpb24ucHJvdG9jb2w7XG4gICAgICAgIGlmIChvcHRzLmhvc3RuYW1lICYmICFvcHRzLnBvcnQpIHtcbiAgICAgICAgICAgIC8vIGlmIG5vIHBvcnQgaXMgc3BlY2lmaWVkIG1hbnVhbGx5LCB1c2UgdGhlIHByb3RvY29sIGRlZmF1bHRcbiAgICAgICAgICAgIG9wdHMucG9ydCA9IHRoaXMuc2VjdXJlID8gXCI0NDNcIiA6IFwiODBcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhvc3RuYW1lID1cbiAgICAgICAgICAgIG9wdHMuaG9zdG5hbWUgfHxcbiAgICAgICAgICAgICAgICAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiID8gbG9jYXRpb24uaG9zdG5hbWUgOiBcImxvY2FsaG9zdFwiKTtcbiAgICAgICAgdGhpcy5wb3J0ID1cbiAgICAgICAgICAgIG9wdHMucG9ydCB8fFxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgbG9jYXRpb24ucG9ydFxuICAgICAgICAgICAgICAgICAgICA/IGxvY2F0aW9uLnBvcnRcbiAgICAgICAgICAgICAgICAgICAgOiB0aGlzLnNlY3VyZVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBcIjQ0M1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFwiODBcIik7XG4gICAgICAgIHRoaXMudHJhbnNwb3J0cyA9IG9wdHMudHJhbnNwb3J0cyB8fCBbXCJwb2xsaW5nXCIsIFwid2Vic29ja2V0XCJdO1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyID0gW107XG4gICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF0aDogXCIvZW5naW5lLmlvXCIsXG4gICAgICAgICAgICBhZ2VudDogZmFsc2UsXG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IGZhbHNlLFxuICAgICAgICAgICAgdXBncmFkZTogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcFBhcmFtOiBcInRcIixcbiAgICAgICAgICAgIHJlbWVtYmVyVXBncmFkZTogZmFsc2UsXG4gICAgICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiB0cnVlLFxuICAgICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgICAgICAgcGVyTWVzc2FnZURlZmxhdGU6IHtcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDEwMjQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNwb3J0T3B0aW9uczoge30sXG4gICAgICAgICAgICBjbG9zZU9uQmVmb3JldW5sb2FkOiB0cnVlLFxuICAgICAgICB9LCBvcHRzKTtcbiAgICAgICAgdGhpcy5vcHRzLnBhdGggPVxuICAgICAgICAgICAgdGhpcy5vcHRzLnBhdGgucmVwbGFjZSgvXFwvJC8sIFwiXCIpICtcbiAgICAgICAgICAgICAgICAodGhpcy5vcHRzLmFkZFRyYWlsaW5nU2xhc2ggPyBcIi9cIiA6IFwiXCIpO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0cy5xdWVyeSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5vcHRzLnF1ZXJ5ID0gZGVjb2RlKHRoaXMub3B0cy5xdWVyeSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IG9uIGhhbmRzaGFrZVxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51cGdyYWRlcyA9IG51bGw7XG4gICAgICAgIHRoaXMucGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgICAgdGhpcy5waW5nVGltZW91dCA9IG51bGw7XG4gICAgICAgIC8vIHNldCBvbiBoZWFydGJlYXRcbiAgICAgICAgdGhpcy5waW5nVGltZW91dFRpbWVyID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuY2xvc2VPbkJlZm9yZXVubG9hZCkge1xuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggY2xvc2VzIHRoZSBjb25uZWN0aW9uIHdoZW4gdGhlIFwiYmVmb3JldW5sb2FkXCIgZXZlbnQgaXMgZW1pdHRlZCBidXQgbm90IENocm9tZS4gVGhpcyBldmVudCBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZXMgZXZlcnkgYnJvd3NlciBiZWhhdmVzIHRoZSBzYW1lIChubyBcImRpc2Nvbm5lY3RcIiBldmVudCBhdCB0aGUgU29ja2V0LklPIGxldmVsIHdoZW4gdGhlIHBhZ2UgaXNcbiAgICAgICAgICAgICAgICAvLyBjbG9zZWQvcmVsb2FkZWQpXG4gICAgICAgICAgICAgICAgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFuc3BvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbGVudGx5IGNsb3NlIHRoZSB0cmFuc3BvcnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcihcImJlZm9yZXVubG9hZFwiLCB0aGlzLmJlZm9yZXVubG9hZEV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmhvc3RuYW1lICE9PSBcImxvY2FsaG9zdFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmZsaW5lRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKFwidHJhbnNwb3J0IGNsb3NlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIm5ldHdvcmsgY29ubmVjdGlvbiBsb3N0XCIsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcihcIm9mZmxpbmVcIiwgdGhpcy5vZmZsaW5lRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRyYW5zcG9ydCBvZiB0aGUgZ2l2ZW4gdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdHJhbnNwb3J0IG5hbWVcbiAgICAgKiBAcmV0dXJuIHtUcmFuc3BvcnR9XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjcmVhdGVUcmFuc3BvcnQobmFtZSkge1xuICAgICAgICBjb25zdCBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0cy5xdWVyeSk7XG4gICAgICAgIC8vIGFwcGVuZCBlbmdpbmUuaW8gcHJvdG9jb2wgaWRlbnRpZmllclxuICAgICAgICBxdWVyeS5FSU8gPSBwcm90b2NvbDtcbiAgICAgICAgLy8gdHJhbnNwb3J0IG5hbWVcbiAgICAgICAgcXVlcnkudHJhbnNwb3J0ID0gbmFtZTtcbiAgICAgICAgLy8gc2Vzc2lvbiBpZCBpZiB3ZSBhbHJlYWR5IGhhdmUgb25lXG4gICAgICAgIGlmICh0aGlzLmlkKVxuICAgICAgICAgICAgcXVlcnkuc2lkID0gdGhpcy5pZDtcbiAgICAgICAgY29uc3Qgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMub3B0cy50cmFuc3BvcnRPcHRpb25zW25hbWVdLCB0aGlzLm9wdHMsIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgc29ja2V0OiB0aGlzLFxuICAgICAgICAgICAgaG9zdG5hbWU6IHRoaXMuaG9zdG5hbWUsXG4gICAgICAgICAgICBzZWN1cmU6IHRoaXMuc2VjdXJlLFxuICAgICAgICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyB0cmFuc3BvcnRzW25hbWVdKG9wdHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0cmFuc3BvcnQgdG8gdXNlIGFuZCBzdGFydHMgcHJvYmUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIGxldCB0cmFuc3BvcnQ7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucmVtZW1iZXJVcGdyYWRlICYmXG4gICAgICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzICYmXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuaW5kZXhPZihcIndlYnNvY2tldFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRyYW5zcG9ydCA9IFwid2Vic29ja2V0XCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoMCA9PT0gdGhpcy50cmFuc3BvcnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gRW1pdCBlcnJvciBvbiBuZXh0IHRpY2sgc28gaXQgY2FuIGJlIGxpc3RlbmVkIHRvXG4gICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBcIk5vIHRyYW5zcG9ydHMgYXZhaWxhYmxlXCIpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSB0aGlzLnRyYW5zcG9ydHNbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuaW5nXCI7XG4gICAgICAgIC8vIFJldHJ5IHdpdGggdGhlIG5leHQgdHJhbnNwb3J0IGlmIHRoZSB0cmFuc3BvcnQgaXMgZGlzYWJsZWQgKGpzb25wOiBmYWxzZSlcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydCA9IHRoaXMuY3JlYXRlVHJhbnNwb3J0KHRyYW5zcG9ydCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0cy5zaGlmdCgpO1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJhbnNwb3J0Lm9wZW4oKTtcbiAgICAgICAgdGhpcy5zZXRUcmFuc3BvcnQodHJhbnNwb3J0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB0cmFuc3BvcnQuIERpc2FibGVzIHRoZSBleGlzdGluZyBvbmUgKGlmIGFueSkuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNldFRyYW5zcG9ydCh0cmFuc3BvcnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzZXQgdXAgdHJhbnNwb3J0XG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xuICAgICAgICAvLyBzZXQgdXAgdHJhbnNwb3J0IGxpc3RlbmVyc1xuICAgICAgICB0cmFuc3BvcnRcbiAgICAgICAgICAgIC5vbihcImRyYWluXCIsIHRoaXMub25EcmFpbi5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKFwicGFja2V0XCIsIHRoaXMub25QYWNrZXQuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcImVycm9yXCIsIHRoaXMub25FcnJvci5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKFwiY2xvc2VcIiwgKHJlYXNvbikgPT4gdGhpcy5vbkNsb3NlKFwidHJhbnNwb3J0IGNsb3NlXCIsIHJlYXNvbikpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm9iZXMgYSB0cmFuc3BvcnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRyYW5zcG9ydCBuYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwcm9iZShuYW1lKSB7XG4gICAgICAgIGxldCB0cmFuc3BvcnQgPSB0aGlzLmNyZWF0ZVRyYW5zcG9ydChuYW1lKTtcbiAgICAgICAgbGV0IGZhaWxlZCA9IGZhbHNlO1xuICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IG9uVHJhbnNwb3J0T3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogXCJwaW5nXCIsIGRhdGE6IFwicHJvYmVcIiB9XSk7XG4gICAgICAgICAgICB0cmFuc3BvcnQub25jZShcInBhY2tldFwiLCAobXNnKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZhaWxlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChcInBvbmdcIiA9PT0gbXNnLnR5cGUgJiYgXCJwcm9iZVwiID09PSBtc2cuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZ3JhZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkaW5nXCIsIHRyYW5zcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhbnNwb3J0KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gXCJ3ZWJzb2NrZXRcIiA9PT0gdHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnBhdXNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRyYW5zcG9ydCh0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogXCJ1cGdyYWRlXCIgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJ1cGdyYWRlXCIsIHRyYW5zcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGdyYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoXCJwcm9iZSBlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBlcnIudHJhbnNwb3J0ID0gdHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkZUVycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIGZyZWV6ZVRyYW5zcG9ydCgpIHtcbiAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgLy8gQW55IGNhbGxiYWNrIGNhbGxlZCBieSB0cmFuc3BvcnQgc2hvdWxkIGJlIGlnbm9yZWQgc2luY2Ugbm93XG4gICAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgdHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBhbnkgZXJyb3IgdGhhdCBoYXBwZW5zIHdoaWxlIHByb2JpbmdcbiAgICAgICAgY29uc3Qgb25lcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFwicHJvYmUgZXJyb3I6IFwiICsgZXJyKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGVycm9yLnRyYW5zcG9ydCA9IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgZnJlZXplVHJhbnNwb3J0KCk7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGVFcnJvclwiLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIG9uVHJhbnNwb3J0Q2xvc2UoKSB7XG4gICAgICAgICAgICBvbmVycm9yKFwidHJhbnNwb3J0IGNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkIHdoaWxlIHdlJ3JlIHByb2JpbmdcbiAgICAgICAgZnVuY3Rpb24gb25jbG9zZSgpIHtcbiAgICAgICAgICAgIG9uZXJyb3IoXCJzb2NrZXQgY2xvc2VkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdoZW4gdGhlIHNvY2tldCBpcyB1cGdyYWRlZCB3aGlsZSB3ZSdyZSBwcm9iaW5nXG4gICAgICAgIGZ1bmN0aW9uIG9udXBncmFkZSh0bykge1xuICAgICAgICAgICAgaWYgKHRyYW5zcG9ydCAmJiB0by5uYW1lICE9PSB0cmFuc3BvcnQubmFtZSkge1xuICAgICAgICAgICAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9uIHRoZSB0cmFuc3BvcnQgYW5kIG9uIHNlbGZcbiAgICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcIm9wZW5cIiwgb25UcmFuc3BvcnRPcGVuKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIG9uZXJyb3IpO1xuICAgICAgICAgICAgdHJhbnNwb3J0LnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIiwgb25UcmFuc3BvcnRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9mZihcImNsb3NlXCIsIG9uY2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRpbmdcIiwgb251cGdyYWRlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJhbnNwb3J0Lm9uY2UoXCJvcGVuXCIsIG9uVHJhbnNwb3J0T3Blbik7XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwiZXJyb3JcIiwgb25lcnJvcik7XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwiY2xvc2VcIiwgb25UcmFuc3BvcnRDbG9zZSk7XG4gICAgICAgIHRoaXMub25jZShcImNsb3NlXCIsIG9uY2xvc2UpO1xuICAgICAgICB0aGlzLm9uY2UoXCJ1cGdyYWRpbmdcIiwgb251cGdyYWRlKTtcbiAgICAgICAgdHJhbnNwb3J0Lm9wZW4oKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gY29ubmVjdGlvbiBpcyBkZWVtZWQgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25PcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IFwid2Vic29ja2V0XCIgPT09IHRoaXMudHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgICAgICAvLyB3ZSBjaGVjayBmb3IgYHJlYWR5U3RhdGVgIGluIGNhc2UgYW4gYG9wZW5gXG4gICAgICAgIC8vIGxpc3RlbmVyIGFscmVhZHkgY2xvc2VkIHRoZSBzb2NrZXRcbiAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUgJiYgdGhpcy5vcHRzLnVwZ3JhZGUpIHtcbiAgICAgICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgICAgIGNvbnN0IGwgPSB0aGlzLnVwZ3JhZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9iZSh0aGlzLnVwZ3JhZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvblBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwiY2xvc2luZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGFja2V0XCIsIHBhY2tldCk7XG4gICAgICAgICAgICAvLyBTb2NrZXQgaXMgbGl2ZSAtIGFueSBwYWNrZXQgY291bnRzXG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImhlYXJ0YmVhdFwiKTtcbiAgICAgICAgICAgIHN3aXRjaCAocGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwib3BlblwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uSGFuZHNoYWtlKEpTT04ucGFyc2UocGFja2V0LmRhdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInBpbmdcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNldFBpbmdUaW1lb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VuZFBhY2tldChcInBvbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGluZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwb25nXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwic2VydmVyIGVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGVyci5jb2RlID0gcGFja2V0LmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwibWVzc2FnZVwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRhdGFcIiwgcGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcIm1lc3NhZ2VcIiwgcGFja2V0LmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBoYW5kc2hha2UgY29tcGxldGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gaGFuZHNoYWtlIG9ialxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25IYW5kc2hha2UoZGF0YSkge1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImhhbmRzaGFrZVwiLCBkYXRhKTtcbiAgICAgICAgdGhpcy5pZCA9IGRhdGEuc2lkO1xuICAgICAgICB0aGlzLnRyYW5zcG9ydC5xdWVyeS5zaWQgPSBkYXRhLnNpZDtcbiAgICAgICAgdGhpcy51cGdyYWRlcyA9IHRoaXMuZmlsdGVyVXBncmFkZXMoZGF0YS51cGdyYWRlcyk7XG4gICAgICAgIHRoaXMucGluZ0ludGVydmFsID0gZGF0YS5waW5nSW50ZXJ2YWw7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXQgPSBkYXRhLnBpbmdUaW1lb3V0O1xuICAgICAgICB0aGlzLm1heFBheWxvYWQgPSBkYXRhLm1heFBheWxvYWQ7XG4gICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgIC8vIEluIGNhc2Ugb3BlbiBoYW5kbGVyIGNsb3NlcyBzb2NrZXRcbiAgICAgICAgaWYgKFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5yZXNldFBpbmdUaW1lb3V0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgYW5kIHJlc2V0cyBwaW5nIHRpbWVvdXQgdGltZXIgYmFzZWQgb24gc2VydmVyIHBpbmdzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZXNldFBpbmdUaW1lb3V0KCkge1xuICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRoaXMucGluZ1RpbWVvdXRUaW1lcik7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZShcInBpbmcgdGltZW91dFwiKTtcbiAgICAgICAgfSwgdGhpcy5waW5nSW50ZXJ2YWwgKyB0aGlzLnBpbmdUaW1lb3V0KTtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lci51bnJlZigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCBvbiBgZHJhaW5gIGV2ZW50XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uRHJhaW4oKSB7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIuc3BsaWNlKDAsIHRoaXMucHJldkJ1ZmZlckxlbik7XG4gICAgICAgIC8vIHNldHRpbmcgcHJldkJ1ZmZlckxlbiA9IDAgaXMgdmVyeSBpbXBvcnRhbnRcbiAgICAgICAgLy8gZm9yIGV4YW1wbGUsIHdoZW4gdXBncmFkaW5nLCB1cGdyYWRlIHBhY2tldCBpcyBzZW50IG92ZXIsXG4gICAgICAgIC8vIGFuZCBhIG5vbnplcm8gcHJldkJ1ZmZlckxlbiBjb3VsZCBjYXVzZSBwcm9ibGVtcyBvbiBgZHJhaW5gXG4gICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIGlmICgwID09PSB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBGbHVzaCB3cml0ZSBidWZmZXJzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmbHVzaCgpIHtcbiAgICAgICAgaWYgKFwiY2xvc2VkXCIgIT09IHRoaXMucmVhZHlTdGF0ZSAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQud3JpdGFibGUgJiZcbiAgICAgICAgICAgICF0aGlzLnVwZ3JhZGluZyAmJlxuICAgICAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldHMgPSB0aGlzLmdldFdyaXRhYmxlUGFja2V0cygpO1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuc2VuZChwYWNrZXRzKTtcbiAgICAgICAgICAgIC8vIGtlZXAgdHJhY2sgb2YgY3VycmVudCBsZW5ndGggb2Ygd3JpdGVCdWZmZXJcbiAgICAgICAgICAgIC8vIHNwbGljZSB3cml0ZUJ1ZmZlciBhbmQgY2FsbGJhY2tCdWZmZXIgb24gYGRyYWluYFxuICAgICAgICAgICAgdGhpcy5wcmV2QnVmZmVyTGVuID0gcGFja2V0cy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImZsdXNoXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgZW5jb2RlZCBzaXplIG9mIHRoZSB3cml0ZUJ1ZmZlciBpcyBiZWxvdyB0aGUgbWF4UGF5bG9hZCB2YWx1ZSBzZW50IGJ5IHRoZSBzZXJ2ZXIgKG9ubHkgZm9yIEhUVFBcbiAgICAgKiBsb25nLXBvbGxpbmcpXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGdldFdyaXRhYmxlUGFja2V0cygpIHtcbiAgICAgICAgY29uc3Qgc2hvdWxkQ2hlY2tQYXlsb2FkU2l6ZSA9IHRoaXMubWF4UGF5bG9hZCAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQubmFtZSA9PT0gXCJwb2xsaW5nXCIgJiZcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoID4gMTtcbiAgICAgICAgaWYgKCFzaG91bGRDaGVja1BheWxvYWRTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cml0ZUJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcGF5bG9hZFNpemUgPSAxOyAvLyBmaXJzdCBwYWNrZXQgdHlwZVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLndyaXRlQnVmZmVyW2ldLmRhdGE7XG4gICAgICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHBheWxvYWRTaXplICs9IGJ5dGVMZW5ndGgoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA+IDAgJiYgcGF5bG9hZFNpemUgPiB0aGlzLm1heFBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53cml0ZUJ1ZmZlci5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBheWxvYWRTaXplICs9IDI7IC8vIHNlcGFyYXRvciArIHBhY2tldCB0eXBlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgLSBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm4ge1NvY2tldH0gZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHdyaXRlKG1zZywgb3B0aW9ucywgZm4pIHtcbiAgICAgICAgdGhpcy5zZW5kUGFja2V0KFwibWVzc2FnZVwiLCBtc2csIG9wdGlvbnMsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHNlbmQobXNnLCBvcHRpb25zLCBmbikge1xuICAgICAgICB0aGlzLnNlbmRQYWNrZXQoXCJtZXNzYWdlXCIsIG1zZywgb3B0aW9ucywgZm4pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZTogcGFja2V0IHR5cGUuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGRhdGEuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNlbmRQYWNrZXQodHlwZSwgZGF0YSwgb3B0aW9ucywgZm4pIHtcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGRhdGEpIHtcbiAgICAgICAgICAgIGZuID0gZGF0YTtcbiAgICAgICAgICAgIGRhdGEgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGZuID0gb3B0aW9ucztcbiAgICAgICAgICAgIG9wdGlvbnMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8IFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBvcHRpb25zLmNvbXByZXNzID0gZmFsc2UgIT09IG9wdGlvbnMuY29tcHJlc3M7XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRDcmVhdGVcIiwgcGFja2V0KTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5wdXNoKHBhY2tldCk7XG4gICAgICAgIGlmIChmbilcbiAgICAgICAgICAgIHRoaXMub25jZShcImZsdXNoXCIsIGZuKTtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgdGhlIGNvbm5lY3Rpb24uXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKFwiZm9yY2VkIGNsb3NlXCIpO1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY2xlYW51cEFuZENsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRlXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9mZihcInVwZ3JhZGVFcnJvclwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgd2FpdEZvclVwZ3JhZGUgPSAoKSA9PiB7XG4gICAgICAgICAgICAvLyB3YWl0IGZvciB1cGdyYWRlIHRvIGZpbmlzaCBzaW5jZSB3ZSBjYW4ndCBzZW5kIHBhY2tldHMgd2hpbGUgcGF1c2luZyBhIHRyYW5zcG9ydFxuICAgICAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkZVwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkZUVycm9yXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8IFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2luZ1wiO1xuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy51cGdyYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnVwZ3JhZGluZykge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25FcnJvcihlcnIpIHtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgIHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBlcnJvclwiLCBlcnIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uQ2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fFxuICAgICAgICAgICAgXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fFxuICAgICAgICAgICAgXCJjbG9zaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgdGltZXJzXG4gICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRoaXMucGluZ1RpbWVvdXRUaW1lcik7XG4gICAgICAgICAgICAvLyBzdG9wIGV2ZW50IGZyb20gZmlyaW5nIGFnYWluIGZvciB0cmFuc3BvcnRcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycyhcImNsb3NlXCIpO1xuICAgICAgICAgICAgLy8gZW5zdXJlIHRyYW5zcG9ydCB3b24ndCBzdGF5IG9wZW5cbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICAvLyBpZ25vcmUgZnVydGhlciB0cmFuc3BvcnQgY29tbXVuaWNhdGlvblxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlbW92ZUV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm9mZmxpbmVcIiwgdGhpcy5vZmZsaW5lRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IHJlYWR5IHN0YXRlXG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICAgICAgLy8gY2xlYXIgc2Vzc2lvbiBpZFxuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICAvLyBlbWl0IGNsb3NlIGV2ZW50XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNsb3NlXCIsIHJlYXNvbiwgZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgLy8gY2xlYW4gYnVmZmVycyBhZnRlciwgc28gdXNlcnMgY2FuIHN0aWxsXG4gICAgICAgICAgICAvLyBncmFiIHRoZSBidWZmZXJzIG9uIGBjbG9zZWAgZXZlbnRcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRmlsdGVycyB1cGdyYWRlcywgcmV0dXJuaW5nIG9ubHkgdGhvc2UgbWF0Y2hpbmcgY2xpZW50IHRyYW5zcG9ydHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB1cGdyYWRlcyAtIHNlcnZlciB1cGdyYWRlc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZmlsdGVyVXBncmFkZXModXBncmFkZXMpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyZWRVcGdyYWRlcyA9IFtdO1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIGNvbnN0IGogPSB1cGdyYWRlcy5sZW5ndGg7XG4gICAgICAgIGZvciAoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICBpZiAofnRoaXMudHJhbnNwb3J0cy5pbmRleE9mKHVwZ3JhZGVzW2ldKSlcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZFVwZ3JhZGVzLnB1c2godXBncmFkZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWx0ZXJlZFVwZ3JhZGVzO1xuICAgIH1cbn1cblNvY2tldC5wcm90b2NvbCA9IHByb3RvY29sO1xuIiwiaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiZW5naW5lLmlvLWNsaWVudFwiO1xuLyoqXG4gKiBVUkwgcGFyc2VyLlxuICpcbiAqIEBwYXJhbSB1cmkgLSB1cmxcbiAqIEBwYXJhbSBwYXRoIC0gdGhlIHJlcXVlc3QgcGF0aCBvZiB0aGUgY29ubmVjdGlvblxuICogQHBhcmFtIGxvYyAtIEFuIG9iamVjdCBtZWFudCB0byBtaW1pYyB3aW5kb3cubG9jYXRpb24uXG4gKiAgICAgICAgRGVmYXVsdHMgdG8gd2luZG93LmxvY2F0aW9uLlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXJsKHVyaSwgcGF0aCA9IFwiXCIsIGxvYykge1xuICAgIGxldCBvYmogPSB1cmk7XG4gICAgLy8gZGVmYXVsdCB0byB3aW5kb3cubG9jYXRpb25cbiAgICBsb2MgPSBsb2MgfHwgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBsb2NhdGlvbik7XG4gICAgaWYgKG51bGwgPT0gdXJpKVxuICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyBcIi8vXCIgKyBsb2MuaG9zdDtcbiAgICAvLyByZWxhdGl2ZSBwYXRoIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIHVyaSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBpZiAoXCIvXCIgPT09IHVyaS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICAgIGlmIChcIi9cIiA9PT0gdXJpLmNoYXJBdCgxKSkge1xuICAgICAgICAgICAgICAgIHVyaSA9IGxvYy5wcm90b2NvbCArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVyaSA9IGxvYy5ob3N0ICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghL14oaHR0cHM/fHdzcz8pOlxcL1xcLy8udGVzdCh1cmkpKSB7XG4gICAgICAgICAgICBpZiAoXCJ1bmRlZmluZWRcIiAhPT0gdHlwZW9mIGxvYykge1xuICAgICAgICAgICAgICAgIHVyaSA9IGxvYy5wcm90b2NvbCArIFwiLy9cIiArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHVyaSA9IFwiaHR0cHM6Ly9cIiArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBwYXJzZVxuICAgICAgICBvYmogPSBwYXJzZSh1cmkpO1xuICAgIH1cbiAgICAvLyBtYWtlIHN1cmUgd2UgdHJlYXQgYGxvY2FsaG9zdDo4MGAgYW5kIGBsb2NhbGhvc3RgIGVxdWFsbHlcbiAgICBpZiAoIW9iai5wb3J0KSB7XG4gICAgICAgIGlmICgvXihodHRwfHdzKSQvLnRlc3Qob2JqLnByb3RvY29sKSkge1xuICAgICAgICAgICAgb2JqLnBvcnQgPSBcIjgwXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL14oaHR0cHx3cylzJC8udGVzdChvYmoucHJvdG9jb2wpKSB7XG4gICAgICAgICAgICBvYmoucG9ydCA9IFwiNDQzXCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgb2JqLnBhdGggPSBvYmoucGF0aCB8fCBcIi9cIjtcbiAgICBjb25zdCBpcHY2ID0gb2JqLmhvc3QuaW5kZXhPZihcIjpcIikgIT09IC0xO1xuICAgIGNvbnN0IGhvc3QgPSBpcHY2ID8gXCJbXCIgKyBvYmouaG9zdCArIFwiXVwiIDogb2JqLmhvc3Q7XG4gICAgLy8gZGVmaW5lIHVuaXF1ZSBpZFxuICAgIG9iai5pZCA9IG9iai5wcm90b2NvbCArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBvYmoucG9ydCArIHBhdGg7XG4gICAgLy8gZGVmaW5lIGhyZWZcbiAgICBvYmouaHJlZiA9XG4gICAgICAgIG9iai5wcm90b2NvbCArXG4gICAgICAgICAgICBcIjovL1wiICtcbiAgICAgICAgICAgIGhvc3QgK1xuICAgICAgICAgICAgKGxvYyAmJiBsb2MucG9ydCA9PT0gb2JqLnBvcnQgPyBcIlwiIDogXCI6XCIgKyBvYmoucG9ydCk7XG4gICAgcmV0dXJuIG9iajtcbn1cbiIsImNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuY29uc3QgaXNWaWV3ID0gKG9iaikgPT4ge1xuICAgIHJldHVybiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBBcnJheUJ1ZmZlci5pc1ZpZXcob2JqKVxuICAgICAgICA6IG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcjtcbn07XG5jb25zdCB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgdG9TdHJpbmcuY2FsbChCbG9iKSA9PT0gXCJbb2JqZWN0IEJsb2JDb25zdHJ1Y3Rvcl1cIik7XG5jb25zdCB3aXRoTmF0aXZlRmlsZSA9IHR5cGVvZiBGaWxlID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEZpbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgdG9TdHJpbmcuY2FsbChGaWxlKSA9PT0gXCJbb2JqZWN0IEZpbGVDb25zdHJ1Y3Rvcl1cIik7XG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiBvYmogaXMgYSBCdWZmZXIsIGFuIEFycmF5QnVmZmVyLCBhIEJsb2Igb3IgYSBGaWxlLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0JpbmFyeShvYmopIHtcbiAgICByZXR1cm4gKCh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiYgKG9iaiBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzVmlldyhvYmopKSkgfHxcbiAgICAgICAgKHdpdGhOYXRpdmVCbG9iICYmIG9iaiBpbnN0YW5jZW9mIEJsb2IpIHx8XG4gICAgICAgICh3aXRoTmF0aXZlRmlsZSAmJiBvYmogaW5zdGFuY2VvZiBGaWxlKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gaGFzQmluYXJ5KG9iaiwgdG9KU09OKSB7XG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaGFzQmluYXJ5KG9ialtpXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpc0JpbmFyeShvYmopKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAob2JqLnRvSlNPTiAmJlxuICAgICAgICB0eXBlb2Ygb2JqLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgIGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGhhc0JpbmFyeShvYmoudG9KU09OKCksIHRydWUpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkgJiYgaGFzQmluYXJ5KG9ialtrZXldKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuIiwiaW1wb3J0IHsgaXNCaW5hcnkgfSBmcm9tIFwiLi9pcy1iaW5hcnkuanNcIjtcbi8qKlxuICogUmVwbGFjZXMgZXZlcnkgQnVmZmVyIHwgQXJyYXlCdWZmZXIgfCBCbG9iIHwgRmlsZSBpbiBwYWNrZXQgd2l0aCBhIG51bWJlcmVkIHBsYWNlaG9sZGVyLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXQgLSBzb2NrZXQuaW8gZXZlbnQgcGFja2V0XG4gKiBAcmV0dXJuIHtPYmplY3R9IHdpdGggZGVjb25zdHJ1Y3RlZCBwYWNrZXQgYW5kIGxpc3Qgb2YgYnVmZmVyc1xuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb25zdHJ1Y3RQYWNrZXQocGFja2V0KSB7XG4gICAgY29uc3QgYnVmZmVycyA9IFtdO1xuICAgIGNvbnN0IHBhY2tldERhdGEgPSBwYWNrZXQuZGF0YTtcbiAgICBjb25zdCBwYWNrID0gcGFja2V0O1xuICAgIHBhY2suZGF0YSA9IF9kZWNvbnN0cnVjdFBhY2tldChwYWNrZXREYXRhLCBidWZmZXJzKTtcbiAgICBwYWNrLmF0dGFjaG1lbnRzID0gYnVmZmVycy5sZW5ndGg7IC8vIG51bWJlciBvZiBiaW5hcnkgJ2F0dGFjaG1lbnRzJ1xuICAgIHJldHVybiB7IHBhY2tldDogcGFjaywgYnVmZmVyczogYnVmZmVycyB9O1xufVxuZnVuY3Rpb24gX2RlY29uc3RydWN0UGFja2V0KGRhdGEsIGJ1ZmZlcnMpIHtcbiAgICBpZiAoIWRhdGEpXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIGlmIChpc0JpbmFyeShkYXRhKSkge1xuICAgICAgICBjb25zdCBwbGFjZWhvbGRlciA9IHsgX3BsYWNlaG9sZGVyOiB0cnVlLCBudW06IGJ1ZmZlcnMubGVuZ3RoIH07XG4gICAgICAgIGJ1ZmZlcnMucHVzaChkYXRhKTtcbiAgICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIGNvbnN0IG5ld0RhdGEgPSBuZXcgQXJyYXkoZGF0YS5sZW5ndGgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5ld0RhdGFbaV0gPSBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtpXSwgYnVmZmVycyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0RhdGE7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICYmICEoZGF0YSBpbnN0YW5jZW9mIERhdGUpKSB7XG4gICAgICAgIGNvbnN0IG5ld0RhdGEgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgbmV3RGF0YVtrZXldID0gX2RlY29uc3RydWN0UGFja2V0KGRhdGFba2V5XSwgYnVmZmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld0RhdGE7XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xufVxuLyoqXG4gKiBSZWNvbnN0cnVjdHMgYSBiaW5hcnkgcGFja2V0IGZyb20gaXRzIHBsYWNlaG9sZGVyIHBhY2tldCBhbmQgYnVmZmVyc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXQgLSBldmVudCBwYWNrZXQgd2l0aCBwbGFjZWhvbGRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGJ1ZmZlcnMgLSBiaW5hcnkgYnVmZmVycyB0byBwdXQgaW4gcGxhY2Vob2xkZXIgcG9zaXRpb25zXG4gKiBAcmV0dXJuIHtPYmplY3R9IHJlY29uc3RydWN0ZWQgcGFja2V0XG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvbnN0cnVjdFBhY2tldChwYWNrZXQsIGJ1ZmZlcnMpIHtcbiAgICBwYWNrZXQuZGF0YSA9IF9yZWNvbnN0cnVjdFBhY2tldChwYWNrZXQuZGF0YSwgYnVmZmVycyk7XG4gICAgZGVsZXRlIHBhY2tldC5hdHRhY2htZW50czsgLy8gbm8gbG9uZ2VyIHVzZWZ1bFxuICAgIHJldHVybiBwYWNrZXQ7XG59XG5mdW5jdGlvbiBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YSwgYnVmZmVycykge1xuICAgIGlmICghZGF0YSlcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgaWYgKGRhdGEgJiYgZGF0YS5fcGxhY2Vob2xkZXIgPT09IHRydWUpIHtcbiAgICAgICAgY29uc3QgaXNJbmRleFZhbGlkID0gdHlwZW9mIGRhdGEubnVtID09PSBcIm51bWJlclwiICYmXG4gICAgICAgICAgICBkYXRhLm51bSA+PSAwICYmXG4gICAgICAgICAgICBkYXRhLm51bSA8IGJ1ZmZlcnMubGVuZ3RoO1xuICAgICAgICBpZiAoaXNJbmRleFZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gYnVmZmVyc1tkYXRhLm51bV07IC8vIGFwcHJvcHJpYXRlIGJ1ZmZlciAoc2hvdWxkIGJlIG5hdHVyYWwgb3JkZXIgYW55d2F5KVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaWxsZWdhbCBhdHRhY2htZW50c1wiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRhdGEpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGF0YVtpXSA9IF9yZWNvbnN0cnVjdFBhY2tldChkYXRhW2ldLCBidWZmZXJzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhW2tleV0gPSBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtrZXldLCBidWZmZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbn1cbiIsImltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgZGVjb25zdHJ1Y3RQYWNrZXQsIHJlY29uc3RydWN0UGFja2V0IH0gZnJvbSBcIi4vYmluYXJ5LmpzXCI7XG5pbXBvcnQgeyBpc0JpbmFyeSwgaGFzQmluYXJ5IH0gZnJvbSBcIi4vaXMtYmluYXJ5LmpzXCI7XG4vKipcbiAqIFRoZXNlIHN0cmluZ3MgbXVzdCBub3QgYmUgdXNlZCBhcyBldmVudCBuYW1lcywgYXMgdGhleSBoYXZlIGEgc3BlY2lhbCBtZWFuaW5nLlxuICovXG5jb25zdCBSRVNFUlZFRF9FVkVOVFMgPSBbXG4gICAgXCJjb25uZWN0XCIsXG4gICAgXCJjb25uZWN0X2Vycm9yXCIsXG4gICAgXCJkaXNjb25uZWN0XCIsXG4gICAgXCJkaXNjb25uZWN0aW5nXCIsXG4gICAgXCJuZXdMaXN0ZW5lclwiLFxuICAgIFwicmVtb3ZlTGlzdGVuZXJcIiwgLy8gdXNlZCBieSB0aGUgTm9kZS5qcyBFdmVudEVtaXR0ZXJcbl07XG4vKipcbiAqIFByb3RvY29sIHZlcnNpb24uXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA1O1xuZXhwb3J0IHZhciBQYWNrZXRUeXBlO1xuKGZ1bmN0aW9uIChQYWNrZXRUeXBlKSB7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQ09OTkVDVFwiXSA9IDBdID0gXCJDT05ORUNUXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiRElTQ09OTkVDVFwiXSA9IDFdID0gXCJESVNDT05ORUNUXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiRVZFTlRcIl0gPSAyXSA9IFwiRVZFTlRcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJBQ0tcIl0gPSAzXSA9IFwiQUNLXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQ09OTkVDVF9FUlJPUlwiXSA9IDRdID0gXCJDT05ORUNUX0VSUk9SXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQklOQVJZX0VWRU5UXCJdID0gNV0gPSBcIkJJTkFSWV9FVkVOVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkJJTkFSWV9BQ0tcIl0gPSA2XSA9IFwiQklOQVJZX0FDS1wiO1xufSkoUGFja2V0VHlwZSB8fCAoUGFja2V0VHlwZSA9IHt9KSk7XG4vKipcbiAqIEEgc29ja2V0LmlvIEVuY29kZXIgaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEVuY29kZXIge1xuICAgIC8qKlxuICAgICAqIEVuY29kZXIgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlcGxhY2VyIC0gY3VzdG9tIHJlcGxhY2VyIHRvIHBhc3MgZG93biB0byBKU09OLnBhcnNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocmVwbGFjZXIpIHtcbiAgICAgICAgdGhpcy5yZXBsYWNlciA9IHJlcGxhY2VyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGUgYSBwYWNrZXQgYXMgYSBzaW5nbGUgc3RyaW5nIGlmIG5vbi1iaW5hcnksIG9yIGFzIGFcbiAgICAgKiBidWZmZXIgc2VxdWVuY2UsIGRlcGVuZGluZyBvbiBwYWNrZXQgdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogLSBwYWNrZXQgb2JqZWN0XG4gICAgICovXG4gICAgZW5jb2RlKG9iaikge1xuICAgICAgICBpZiAob2JqLnR5cGUgPT09IFBhY2tldFR5cGUuRVZFTlQgfHwgb2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQUNLKSB7XG4gICAgICAgICAgICBpZiAoaGFzQmluYXJ5KG9iaikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lbmNvZGVBc0JpbmFyeSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG9iai50eXBlID09PSBQYWNrZXRUeXBlLkVWRU5UXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFBhY2tldFR5cGUuQklOQVJZX0FDSyxcbiAgICAgICAgICAgICAgICAgICAgbnNwOiBvYmoubnNwLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBvYmouZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG9iai5pZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3RoaXMuZW5jb2RlQXNTdHJpbmcob2JqKV07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZSBwYWNrZXQgYXMgc3RyaW5nLlxuICAgICAqL1xuICAgIGVuY29kZUFzU3RyaW5nKG9iaikge1xuICAgICAgICAvLyBmaXJzdCBpcyB0eXBlXG4gICAgICAgIGxldCBzdHIgPSBcIlwiICsgb2JqLnR5cGU7XG4gICAgICAgIC8vIGF0dGFjaG1lbnRzIGlmIHdlIGhhdmUgdGhlbVxuICAgICAgICBpZiAob2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UIHx8XG4gICAgICAgICAgICBvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICBzdHIgKz0gb2JqLmF0dGFjaG1lbnRzICsgXCItXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBhIG5hbWVzcGFjZSBvdGhlciB0aGFuIGAvYFxuICAgICAgICAvLyB3ZSBhcHBlbmQgaXQgZm9sbG93ZWQgYnkgYSBjb21tYSBgLGBcbiAgICAgICAgaWYgKG9iai5uc3AgJiYgXCIvXCIgIT09IG9iai5uc3ApIHtcbiAgICAgICAgICAgIHN0ciArPSBvYmoubnNwICsgXCIsXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW1tZWRpYXRlbHkgZm9sbG93ZWQgYnkgdGhlIGlkXG4gICAgICAgIGlmIChudWxsICE9IG9iai5pZCkge1xuICAgICAgICAgICAgc3RyICs9IG9iai5pZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBqc29uIGRhdGFcbiAgICAgICAgaWYgKG51bGwgIT0gb2JqLmRhdGEpIHtcbiAgICAgICAgICAgIHN0ciArPSBKU09OLnN0cmluZ2lmeShvYmouZGF0YSwgdGhpcy5yZXBsYWNlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlIHBhY2tldCBhcyAnYnVmZmVyIHNlcXVlbmNlJyBieSByZW1vdmluZyBibG9icywgYW5kXG4gICAgICogZGVjb25zdHJ1Y3RpbmcgcGFja2V0IGludG8gb2JqZWN0IHdpdGggcGxhY2Vob2xkZXJzIGFuZFxuICAgICAqIGEgbGlzdCBvZiBidWZmZXJzLlxuICAgICAqL1xuICAgIGVuY29kZUFzQmluYXJ5KG9iaikge1xuICAgICAgICBjb25zdCBkZWNvbnN0cnVjdGlvbiA9IGRlY29uc3RydWN0UGFja2V0KG9iaik7XG4gICAgICAgIGNvbnN0IHBhY2sgPSB0aGlzLmVuY29kZUFzU3RyaW5nKGRlY29uc3RydWN0aW9uLnBhY2tldCk7XG4gICAgICAgIGNvbnN0IGJ1ZmZlcnMgPSBkZWNvbnN0cnVjdGlvbi5idWZmZXJzO1xuICAgICAgICBidWZmZXJzLnVuc2hpZnQocGFjayk7IC8vIGFkZCBwYWNrZXQgaW5mbyB0byBiZWdpbm5pbmcgb2YgZGF0YSBsaXN0XG4gICAgICAgIHJldHVybiBidWZmZXJzOyAvLyB3cml0ZSBhbGwgdGhlIGJ1ZmZlcnNcbiAgICB9XG59XG4vLyBzZWUgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODUxMTI4MS9jaGVjay1pZi1hLXZhbHVlLWlzLWFuLW9iamVjdC1pbi1qYXZhc2NyaXB0XG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgT2JqZWN0XVwiO1xufVxuLyoqXG4gKiBBIHNvY2tldC5pbyBEZWNvZGVyIGluc3RhbmNlXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBkZWNvZGVyXG4gKi9cbmV4cG9ydCBjbGFzcyBEZWNvZGVyIGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogRGVjb2RlciBjb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmV2aXZlciAtIGN1c3RvbSByZXZpdmVyIHRvIHBhc3MgZG93biB0byBKU09OLnN0cmluZ2lmeVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJldml2ZXIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5yZXZpdmVyID0gcmV2aXZlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhbiBlbmNvZGVkIHBhY2tldCBzdHJpbmcgaW50byBwYWNrZXQgSlNPTi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvYmogLSBlbmNvZGVkIHBhY2tldFxuICAgICAqL1xuICAgIGFkZChvYmopIHtcbiAgICAgICAgbGV0IHBhY2tldDtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnb3QgcGxhaW50ZXh0IGRhdGEgd2hlbiByZWNvbnN0cnVjdGluZyBhIHBhY2tldFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhY2tldCA9IHRoaXMuZGVjb2RlU3RyaW5nKG9iaik7XG4gICAgICAgICAgICBjb25zdCBpc0JpbmFyeUV2ZW50ID0gcGFja2V0LnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UO1xuICAgICAgICAgICAgaWYgKGlzQmluYXJ5RXZlbnQgfHwgcGFja2V0LnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0FDSykge1xuICAgICAgICAgICAgICAgIHBhY2tldC50eXBlID0gaXNCaW5hcnlFdmVudCA/IFBhY2tldFR5cGUuRVZFTlQgOiBQYWNrZXRUeXBlLkFDSztcbiAgICAgICAgICAgICAgICAvLyBiaW5hcnkgcGFja2V0J3MganNvblxuICAgICAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3RvciA9IG5ldyBCaW5hcnlSZWNvbnN0cnVjdG9yKHBhY2tldCk7XG4gICAgICAgICAgICAgICAgLy8gbm8gYXR0YWNobWVudHMsIGxhYmVsZWQgYmluYXJ5IGJ1dCBubyBiaW5hcnkgZGF0YSB0byBmb2xsb3dcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0LmF0dGFjaG1lbnRzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImRlY29kZWRcIiwgcGFja2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBub24tYmluYXJ5IGZ1bGwgcGFja2V0XG4gICAgICAgICAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZGVjb2RlZFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzQmluYXJ5KG9iaikgfHwgb2JqLmJhc2U2NCkge1xuICAgICAgICAgICAgLy8gcmF3IGJpbmFyeSBkYXRhXG4gICAgICAgICAgICBpZiAoIXRoaXMucmVjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImdvdCBiaW5hcnkgZGF0YSB3aGVuIG5vdCByZWNvbnN0cnVjdGluZyBhIHBhY2tldFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhY2tldCA9IHRoaXMucmVjb25zdHJ1Y3Rvci50YWtlQmluYXJ5RGF0YShvYmopO1xuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVjZWl2ZWQgZmluYWwgYnVmZmVyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3RvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImRlY29kZWRcIiwgcGFja2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHR5cGU6IFwiICsgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvZGUgYSBwYWNrZXQgU3RyaW5nIChKU09OIGRhdGEpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBwYWNrZXRcbiAgICAgKi9cbiAgICBkZWNvZGVTdHJpbmcoc3RyKSB7XG4gICAgICAgIGxldCBpID0gMDtcbiAgICAgICAgLy8gbG9vayB1cCB0eXBlXG4gICAgICAgIGNvbnN0IHAgPSB7XG4gICAgICAgICAgICB0eXBlOiBOdW1iZXIoc3RyLmNoYXJBdCgwKSksXG4gICAgICAgIH07XG4gICAgICAgIGlmIChQYWNrZXRUeXBlW3AudHlwZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBwYWNrZXQgdHlwZSBcIiArIHAudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBhdHRhY2htZW50cyBpZiB0eXBlIGJpbmFyeVxuICAgICAgICBpZiAocC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVCB8fFxuICAgICAgICAgICAgcC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0spIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoc3RyLmNoYXJBdCgrK2kpICE9PSBcIi1cIiAmJiBpICE9IHN0ci5sZW5ndGgpIHsgfVxuICAgICAgICAgICAgY29uc3QgYnVmID0gc3RyLnN1YnN0cmluZyhzdGFydCwgaSk7XG4gICAgICAgICAgICBpZiAoYnVmICE9IE51bWJlcihidWYpIHx8IHN0ci5jaGFyQXQoaSkgIT09IFwiLVwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSWxsZWdhbCBhdHRhY2htZW50c1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAuYXR0YWNobWVudHMgPSBOdW1iZXIoYnVmKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIG5hbWVzcGFjZSAoaWYgYW55KVxuICAgICAgICBpZiAoXCIvXCIgPT09IHN0ci5jaGFyQXQoaSArIDEpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgd2hpbGUgKCsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIGlmIChcIixcIiA9PT0gYylcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5uc3AgPSBzdHIuc3Vic3RyaW5nKHN0YXJ0LCBpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHAubnNwID0gXCIvXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBpZFxuICAgICAgICBjb25zdCBuZXh0ID0gc3RyLmNoYXJBdChpICsgMSk7XG4gICAgICAgIGlmIChcIlwiICE9PSBuZXh0ICYmIE51bWJlcihuZXh0KSA9PSBuZXh0KSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgd2hpbGUgKCsraSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGMgPSBzdHIuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgIGlmIChudWxsID09IGMgfHwgTnVtYmVyKGMpICE9IGMpIHtcbiAgICAgICAgICAgICAgICAgICAgLS1pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGkgPT09IHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5pZCA9IE51bWJlcihzdHIuc3Vic3RyaW5nKHN0YXJ0LCBpICsgMSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAganNvbiBkYXRhXG4gICAgICAgIGlmIChzdHIuY2hhckF0KCsraSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSB0aGlzLnRyeVBhcnNlKHN0ci5zdWJzdHIoaSkpO1xuICAgICAgICAgICAgaWYgKERlY29kZXIuaXNQYXlsb2FkVmFsaWQocC50eXBlLCBwYXlsb2FkKSkge1xuICAgICAgICAgICAgICAgIHAuZGF0YSA9IHBheWxvYWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHBheWxvYWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIHRyeVBhcnNlKHN0cikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RyLCB0aGlzLnJldml2ZXIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGlzUGF5bG9hZFZhbGlkKHR5cGUsIHBheWxvYWQpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNPYmplY3QocGF5bG9hZCk7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRElTQ09OTkVDVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF5bG9hZCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1RfRVJST1I6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiIHx8IGlzT2JqZWN0KHBheWxvYWQpO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkVWRU5UOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gKEFycmF5LmlzQXJyYXkocGF5bG9hZCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBwYXlsb2FkWzBdID09PSBcIm51bWJlclwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAodHlwZW9mIHBheWxvYWRbMF0gPT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSRVNFUlZFRF9FVkVOVFMuaW5kZXhPZihwYXlsb2FkWzBdKSA9PT0gLTEpKSk7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQUNLOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0s6XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocGF5bG9hZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVhbGxvY2F0ZXMgYSBwYXJzZXIncyByZXNvdXJjZXNcbiAgICAgKi9cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5yZWNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IuZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKlxuICogQSBtYW5hZ2VyIG9mIGEgYmluYXJ5IGV2ZW50J3MgJ2J1ZmZlciBzZXF1ZW5jZScuIFNob3VsZFxuICogYmUgY29uc3RydWN0ZWQgd2hlbmV2ZXIgYSBwYWNrZXQgb2YgdHlwZSBCSU5BUllfRVZFTlQgaXNcbiAqIGRlY29kZWQuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldFxuICogQHJldHVybiB7QmluYXJ5UmVjb25zdHJ1Y3Rvcn0gaW5pdGlhbGl6ZWQgcmVjb25zdHJ1Y3RvclxuICovXG5jbGFzcyBCaW5hcnlSZWNvbnN0cnVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcihwYWNrZXQpIHtcbiAgICAgICAgdGhpcy5wYWNrZXQgPSBwYWNrZXQ7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IFtdO1xuICAgICAgICB0aGlzLnJlY29uUGFjayA9IHBhY2tldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIGJpbmFyeSBkYXRhIHJlY2VpdmVkIGZyb20gY29ubmVjdGlvblxuICAgICAqIGFmdGVyIGEgQklOQVJZX0VWRU5UIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QnVmZmVyIHwgQXJyYXlCdWZmZXJ9IGJpbkRhdGEgLSB0aGUgcmF3IGJpbmFyeSBkYXRhIHJlY2VpdmVkXG4gICAgICogQHJldHVybiB7bnVsbCB8IE9iamVjdH0gcmV0dXJucyBudWxsIGlmIG1vcmUgYmluYXJ5IGRhdGEgaXMgZXhwZWN0ZWQgb3JcbiAgICAgKiAgIGEgcmVjb25zdHJ1Y3RlZCBwYWNrZXQgb2JqZWN0IGlmIGFsbCBidWZmZXJzIGhhdmUgYmVlbiByZWNlaXZlZC5cbiAgICAgKi9cbiAgICB0YWtlQmluYXJ5RGF0YShiaW5EYXRhKSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy5wdXNoKGJpbkRhdGEpO1xuICAgICAgICBpZiAodGhpcy5idWZmZXJzLmxlbmd0aCA9PT0gdGhpcy5yZWNvblBhY2suYXR0YWNobWVudHMpIHtcbiAgICAgICAgICAgIC8vIGRvbmUgd2l0aCBidWZmZXIgbGlzdFxuICAgICAgICAgICAgY29uc3QgcGFja2V0ID0gcmVjb25zdHJ1Y3RQYWNrZXQodGhpcy5yZWNvblBhY2ssIHRoaXMuYnVmZmVycyk7XG4gICAgICAgICAgICB0aGlzLmZpbmlzaGVkUmVjb25zdHJ1Y3Rpb24oKTtcbiAgICAgICAgICAgIHJldHVybiBwYWNrZXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFucyB1cCBiaW5hcnkgcGFja2V0IHJlY29uc3RydWN0aW9uIHZhcmlhYmxlcy5cbiAgICAgKi9cbiAgICBmaW5pc2hlZFJlY29uc3RydWN0aW9uKCkge1xuICAgICAgICB0aGlzLnJlY29uUGFjayA9IG51bGw7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IFtdO1xuICAgIH1cbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBvbihvYmosIGV2LCBmbikge1xuICAgIG9iai5vbihldiwgZm4pO1xuICAgIHJldHVybiBmdW5jdGlvbiBzdWJEZXN0cm95KCkge1xuICAgICAgICBvYmoub2ZmKGV2LCBmbik7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IFBhY2tldFR5cGUgfSBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgb24gfSBmcm9tIFwiLi9vbi5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciwgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuLyoqXG4gKiBJbnRlcm5hbCBldmVudHMuXG4gKiBUaGVzZSBldmVudHMgY2FuJ3QgYmUgZW1pdHRlZCBieSB0aGUgdXNlci5cbiAqL1xuY29uc3QgUkVTRVJWRURfRVZFTlRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgY29ubmVjdDogMSxcbiAgICBjb25uZWN0X2Vycm9yOiAxLFxuICAgIGRpc2Nvbm5lY3Q6IDEsXG4gICAgZGlzY29ubmVjdGluZzogMSxcbiAgICAvLyBFdmVudEVtaXR0ZXIgcmVzZXJ2ZWQgZXZlbnRzOiBodHRwczovL25vZGVqcy5vcmcvYXBpL2V2ZW50cy5odG1sI2V2ZW50c19ldmVudF9uZXdsaXN0ZW5lclxuICAgIG5ld0xpc3RlbmVyOiAxLFxuICAgIHJlbW92ZUxpc3RlbmVyOiAxLFxufSk7XG4vKipcbiAqIEEgU29ja2V0IGlzIHRoZSBmdW5kYW1lbnRhbCBjbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCB0aGUgc2VydmVyLlxuICpcbiAqIEEgU29ja2V0IGJlbG9uZ3MgdG8gYSBjZXJ0YWluIE5hbWVzcGFjZSAoYnkgZGVmYXVsdCAvKSBhbmQgdXNlcyBhbiB1bmRlcmx5aW5nIHtAbGluayBNYW5hZ2VyfSB0byBjb21tdW5pY2F0ZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAqXG4gKiBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAqICAgY29uc29sZS5sb2coXCJjb25uZWN0ZWRcIik7XG4gKiB9KTtcbiAqXG4gKiAvLyBzZW5kIGFuIGV2ZW50IHRvIHRoZSBzZXJ2ZXJcbiAqIHNvY2tldC5lbWl0KFwiZm9vXCIsIFwiYmFyXCIpO1xuICpcbiAqIHNvY2tldC5vbihcImZvb2JhclwiLCAoKSA9PiB7XG4gKiAgIC8vIGFuIGV2ZW50IHdhcyByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXJcbiAqIH0pO1xuICpcbiAqIC8vIHVwb24gZGlzY29ubmVjdGlvblxuICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKGBkaXNjb25uZWN0ZWQgZHVlIHRvICR7cmVhc29ufWApO1xuICogfSk7XG4gKi9cbmV4cG9ydCBjbGFzcyBTb2NrZXQgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBgU29ja2V0YCBjb25zdHJ1Y3Rvci5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihpbywgbnNwLCBvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBzb2NrZXQgaXMgY3VycmVudGx5IGNvbm5lY3RlZCB0byB0aGUgc2VydmVyLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAgICAgKlxuICAgICAgICAgKiBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAgICAgICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuY29ubmVjdGVkKTsgLy8gdHJ1ZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmNvbm5lY3RlZCk7IC8vIGZhbHNlXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIGNvbm5lY3Rpb24gc3RhdGUgd2FzIHJlY292ZXJlZCBhZnRlciBhIHRlbXBvcmFyeSBkaXNjb25uZWN0aW9uLiBJbiB0aGF0IGNhc2UsIGFueSBtaXNzZWQgcGFja2V0cyB3aWxsXG4gICAgICAgICAqIGJlIHRyYW5zbWl0dGVkIGJ5IHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlY292ZXJlZCA9IGZhbHNlO1xuICAgICAgICAvKipcbiAgICAgICAgICogQnVmZmVyIGZvciBwYWNrZXRzIHJlY2VpdmVkIGJlZm9yZSB0aGUgQ09OTkVDVCBwYWNrZXRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlciA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogQnVmZmVyIGZvciBwYWNrZXRzIHRoYXQgd2lsbCBiZSBzZW50IG9uY2UgdGhlIHNvY2tldCBpcyBjb25uZWN0ZWRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VuZEJ1ZmZlciA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHF1ZXVlIG9mIHBhY2tldHMgdG8gYmUgc2VudCB3aXRoIHJldHJ5IGluIGNhc2Ugb2YgZmFpbHVyZS5cbiAgICAgICAgICpcbiAgICAgICAgICogUGFja2V0cyBhcmUgc2VudCBvbmUgYnkgb25lLCBlYWNoIHdhaXRpbmcgZm9yIHRoZSBzZXJ2ZXIgYWNrbm93bGVkZ2VtZW50LCBpbiBvcmRlciB0byBndWFyYW50ZWUgdGhlIGRlbGl2ZXJ5IG9yZGVyLlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgc2VxdWVuY2UgdG8gZ2VuZXJhdGUgdGhlIElEIG9mIHRoZSB7QGxpbmsgUXVldWVkUGFja2V0fS5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3F1ZXVlU2VxID0gMDtcbiAgICAgICAgdGhpcy5pZHMgPSAwO1xuICAgICAgICB0aGlzLmFja3MgPSB7fTtcbiAgICAgICAgdGhpcy5mbGFncyA9IHt9O1xuICAgICAgICB0aGlzLmlvID0gaW87XG4gICAgICAgIHRoaXMubnNwID0gbnNwO1xuICAgICAgICBpZiAob3B0cyAmJiBvcHRzLmF1dGgpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aCA9IG9wdHMuYXV0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cyk7XG4gICAgICAgIGlmICh0aGlzLmlvLl9hdXRvQ29ubmVjdClcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBzb2NrZXQgaXMgY3VycmVudGx5IGRpc2Nvbm5lY3RlZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuZGlzY29ubmVjdGVkKTsgLy8gZmFsc2VcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmRpc2Nvbm5lY3RlZCk7IC8vIHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBnZXQgZGlzY29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuY29ubmVjdGVkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmUgdG8gb3BlbiwgY2xvc2UgYW5kIHBhY2tldCBldmVudHNcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3ViRXZlbnRzKCkge1xuICAgICAgICBpZiAodGhpcy5zdWJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBpbyA9IHRoaXMuaW87XG4gICAgICAgIHRoaXMuc3VicyA9IFtcbiAgICAgICAgICAgIG9uKGlvLCBcIm9wZW5cIiwgdGhpcy5vbm9wZW4uYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJwYWNrZXRcIiwgdGhpcy5vbnBhY2tldC5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcImVycm9yXCIsIHRoaXMub25lcnJvci5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcImNsb3NlXCIsIHRoaXMub25jbG9zZS5iaW5kKHRoaXMpKSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgU29ja2V0IHdpbGwgdHJ5IHRvIHJlY29ubmVjdCB3aGVuIGl0cyBNYW5hZ2VyIGNvbm5lY3RzIG9yIHJlY29ubmVjdHMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICpcbiAgICAgKiBjb25zb2xlLmxvZyhzb2NrZXQuYWN0aXZlKTsgLy8gdHJ1ZVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gICAgICogICBpZiAocmVhc29uID09PSBcImlvIHNlcnZlciBkaXNjb25uZWN0XCIpIHtcbiAgICAgKiAgICAgLy8gdGhlIGRpc2Nvbm5lY3Rpb24gd2FzIGluaXRpYXRlZCBieSB0aGUgc2VydmVyLCB5b3UgbmVlZCB0byBtYW51YWxseSByZWNvbm5lY3RcbiAgICAgKiAgICAgY29uc29sZS5sb2coc29ja2V0LmFjdGl2ZSk7IC8vIGZhbHNlXG4gICAgICogICB9XG4gICAgICogICAvLyBlbHNlIHRoZSBzb2NrZXQgd2lsbCBhdXRvbWF0aWNhbGx5IHRyeSB0byByZWNvbm5lY3RcbiAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5hY3RpdmUpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zdWJzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBcIk9wZW5zXCIgdGhlIHNvY2tldC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oe1xuICAgICAqICAgYXV0b0Nvbm5lY3Q6IGZhbHNlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQuY29ubmVjdCgpO1xuICAgICAqL1xuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLnN1YkV2ZW50cygpO1xuICAgICAgICBpZiAoIXRoaXMuaW9bXCJfcmVjb25uZWN0aW5nXCJdKVxuICAgICAgICAgICAgdGhpcy5pby5vcGVuKCk7IC8vIGVuc3VyZSBvcGVuXG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5pby5fcmVhZHlTdGF0ZSlcbiAgICAgICAgICAgIHRoaXMub25vcGVuKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Ige0BsaW5rIGNvbm5lY3QoKX0uXG4gICAgICovXG4gICAgb3BlbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIGBtZXNzYWdlYCBldmVudC5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIG1pbWljcyB0aGUgV2ViU29ja2V0LnNlbmQoKSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJTb2NrZXQvc2VuZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuc2VuZChcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogLy8gdGhpcyBpcyBlcXVpdmFsZW50IHRvXG4gICAgICogc29ja2V0LmVtaXQoXCJtZXNzYWdlXCIsIFwiaGVsbG9cIik7XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBzZW5kKC4uLmFyZ3MpIHtcbiAgICAgICAgYXJncy51bnNoaWZ0KFwibWVzc2FnZVwiKTtcbiAgICAgICAgdGhpcy5lbWl0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgYGVtaXRgLlxuICAgICAqIElmIHRoZSBldmVudCBpcyBpbiBgZXZlbnRzYCwgaXQncyBlbWl0dGVkIG5vcm1hbGx5LlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICpcbiAgICAgKiAvLyBhbGwgc2VyaWFsaXphYmxlIGRhdGFzdHJ1Y3R1cmVzIGFyZSBzdXBwb3J0ZWQgKG5vIG5lZWQgdG8gY2FsbCBKU09OLnN0cmluZ2lmeSlcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIDEsIFwiMlwiLCB7IDM6IFtcIjRcIl0sIDU6IFVpbnQ4QXJyYXkuZnJvbShbNl0pIH0pO1xuICAgICAqXG4gICAgICogLy8gd2l0aCBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCBcIndvcmxkXCIsICh2YWwpID0+IHtcbiAgICAgKiAgIC8vIC4uLlxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgZW1pdChldiwgLi4uYXJncykge1xuICAgICAgICBpZiAoUkVTRVJWRURfRVZFTlRTLmhhc093blByb3BlcnR5KGV2KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicgKyBldi50b1N0cmluZygpICsgJ1wiIGlzIGEgcmVzZXJ2ZWQgZXZlbnQgbmFtZScpO1xuICAgICAgICB9XG4gICAgICAgIGFyZ3MudW5zaGlmdChldik7XG4gICAgICAgIGlmICh0aGlzLl9vcHRzLnJldHJpZXMgJiYgIXRoaXMuZmxhZ3MuZnJvbVF1ZXVlICYmICF0aGlzLmZsYWdzLnZvbGF0aWxlKSB7XG4gICAgICAgICAgICB0aGlzLl9hZGRUb1F1ZXVlKGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5FVkVOVCxcbiAgICAgICAgICAgIGRhdGE6IGFyZ3MsXG4gICAgICAgIH07XG4gICAgICAgIHBhY2tldC5vcHRpb25zID0ge307XG4gICAgICAgIHBhY2tldC5vcHRpb25zLmNvbXByZXNzID0gdGhpcy5mbGFncy5jb21wcmVzcyAhPT0gZmFsc2U7XG4gICAgICAgIC8vIGV2ZW50IGFjayBjYWxsYmFja1xuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWRzKys7XG4gICAgICAgICAgICBjb25zdCBhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJBY2tDYWxsYmFjayhpZCwgYWNrKTtcbiAgICAgICAgICAgIHBhY2tldC5pZCA9IGlkO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlzVHJhbnNwb3J0V3JpdGFibGUgPSB0aGlzLmlvLmVuZ2luZSAmJlxuICAgICAgICAgICAgdGhpcy5pby5lbmdpbmUudHJhbnNwb3J0ICYmXG4gICAgICAgICAgICB0aGlzLmlvLmVuZ2luZS50cmFuc3BvcnQud3JpdGFibGU7XG4gICAgICAgIGNvbnN0IGRpc2NhcmRQYWNrZXQgPSB0aGlzLmZsYWdzLnZvbGF0aWxlICYmICghaXNUcmFuc3BvcnRXcml0YWJsZSB8fCAhdGhpcy5jb25uZWN0ZWQpO1xuICAgICAgICBpZiAoZGlzY2FyZFBhY2tldCkge1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLm5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCk7XG4gICAgICAgICAgICB0aGlzLnBhY2tldChwYWNrZXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZW5kQnVmZmVyLnB1c2gocGFja2V0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZsYWdzID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9yZWdpc3RlckFja0NhbGxiYWNrKGlkLCBhY2spIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKF9hID0gdGhpcy5mbGFncy50aW1lb3V0KSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiB0aGlzLl9vcHRzLmFja1RpbWVvdXQ7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWNrc1tpZF0gPSBhY2s7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuaW8uc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFja3NbaWRdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNlbmRCdWZmZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZW5kQnVmZmVyW2ldLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRCdWZmZXIuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFjay5jYWxsKHRoaXMsIG5ldyBFcnJvcihcIm9wZXJhdGlvbiBoYXMgdGltZWQgb3V0XCIpKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHRoaXMuYWNrc1tpZF0gPSAoLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgdGhpcy5pby5jbGVhclRpbWVvdXRGbih0aW1lcik7XG4gICAgICAgICAgICBhY2suYXBwbHkodGhpcywgW251bGwsIC4uLmFyZ3NdKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXZlbnQgYW5kIHdhaXRzIGZvciBhbiBhY2tub3dsZWRnZW1lbnRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogLy8gd2l0aG91dCB0aW1lb3V0XG4gICAgICogY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzb2NrZXQuZW1pdFdpdGhBY2soXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAqXG4gICAgICogLy8gd2l0aCBhIHNwZWNpZmljIHRpbWVvdXRcbiAgICAgKiB0cnkge1xuICAgICAqICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzb2NrZXQudGltZW91dCgxMDAwKS5lbWl0V2l0aEFjayhcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICogfSBjYXRjaCAoZXJyKSB7XG4gICAgICogICAvLyB0aGUgc2VydmVyIGRpZCBub3QgYWNrbm93bGVkZ2UgdGhlIGV2ZW50IGluIHRoZSBnaXZlbiBkZWxheVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIEByZXR1cm4gYSBQcm9taXNlIHRoYXQgd2lsbCBiZSBmdWxmaWxsZWQgd2hlbiB0aGUgc2VydmVyIGFja25vd2xlZGdlcyB0aGUgZXZlbnRcbiAgICAgKi9cbiAgICBlbWl0V2l0aEFjayhldiwgLi4uYXJncykge1xuICAgICAgICAvLyB0aGUgdGltZW91dCBmbGFnIGlzIG9wdGlvbmFsXG4gICAgICAgIGNvbnN0IHdpdGhFcnIgPSB0aGlzLmZsYWdzLnRpbWVvdXQgIT09IHVuZGVmaW5lZCB8fCB0aGlzLl9vcHRzLmFja1RpbWVvdXQgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGFyZ3MucHVzaCgoYXJnMSwgYXJnMikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh3aXRoRXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmcxID8gcmVqZWN0KGFyZzEpIDogcmVzb2x2ZShhcmcyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKGFyZzEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5lbWl0KGV2LCAuLi5hcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgcGFja2V0IHRvIHRoZSBxdWV1ZS5cbiAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZFRvUXVldWUoYXJncykge1xuICAgICAgICBsZXQgYWNrO1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9xdWV1ZVNlcSsrLFxuICAgICAgICAgICAgdHJ5Q291bnQ6IDAsXG4gICAgICAgICAgICBwZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICBmbGFnczogT2JqZWN0LmFzc2lnbih7IGZyb21RdWV1ZTogdHJ1ZSB9LCB0aGlzLmZsYWdzKSxcbiAgICAgICAgfTtcbiAgICAgICAgYXJncy5wdXNoKChlcnIsIC4uLnJlc3BvbnNlQXJncykgPT4ge1xuICAgICAgICAgICAgaWYgKHBhY2tldCAhPT0gdGhpcy5fcXVldWVbMF0pIHtcbiAgICAgICAgICAgICAgICAvLyB0aGUgcGFja2V0IGhhcyBhbHJlYWR5IGJlZW4gYWNrbm93bGVkZ2VkXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaGFzRXJyb3IgPSBlcnIgIT09IG51bGw7XG4gICAgICAgICAgICBpZiAoaGFzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0LnRyeUNvdW50ID4gdGhpcy5fb3B0cy5yZXRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBpZiAoYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjayhudWxsLCAuLi5yZXNwb25zZUFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhY2tldC5wZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fcXVldWUucHVzaChwYWNrZXQpO1xuICAgICAgICB0aGlzLl9kcmFpblF1ZXVlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmQgdGhlIGZpcnN0IHBhY2tldCBvZiB0aGUgcXVldWUsIGFuZCB3YWl0IGZvciBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyLlxuICAgICAqIEBwYXJhbSBmb3JjZSAtIHdoZXRoZXIgdG8gcmVzZW5kIGEgcGFja2V0IHRoYXQgaGFzIG5vdCBiZWVuIGFja25vd2xlZGdlZCB5ZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2RyYWluUXVldWUoZm9yY2UgPSBmYWxzZSkge1xuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkIHx8IHRoaXMuX3F1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHRoaXMuX3F1ZXVlWzBdO1xuICAgICAgICBpZiAocGFja2V0LnBlbmRpbmcgJiYgIWZvcmNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGFja2V0LnBlbmRpbmcgPSB0cnVlO1xuICAgICAgICBwYWNrZXQudHJ5Q291bnQrKztcbiAgICAgICAgdGhpcy5mbGFncyA9IHBhY2tldC5mbGFncztcbiAgICAgICAgdGhpcy5lbWl0LmFwcGx5KHRoaXMsIHBhY2tldC5hcmdzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwYWNrZXQocGFja2V0KSB7XG4gICAgICAgIHBhY2tldC5uc3AgPSB0aGlzLm5zcDtcbiAgICAgICAgdGhpcy5pby5fcGFja2V0KHBhY2tldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBgb3BlbmAuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ub3BlbigpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmF1dGggPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aGlzLmF1dGgoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZW5kQ29ubmVjdFBhY2tldChkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2VuZENvbm5lY3RQYWNrZXQodGhpcy5hdXRoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIENPTk5FQ1QgcGFja2V0IHRvIGluaXRpYXRlIHRoZSBTb2NrZXQuSU8gc2Vzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2VuZENvbm5lY3RQYWNrZXQoZGF0YSkge1xuICAgICAgICB0aGlzLnBhY2tldCh7XG4gICAgICAgICAgICB0eXBlOiBQYWNrZXRUeXBlLkNPTk5FQ1QsXG4gICAgICAgICAgICBkYXRhOiB0aGlzLl9waWRcbiAgICAgICAgICAgICAgICA/IE9iamVjdC5hc3NpZ24oeyBwaWQ6IHRoaXMuX3BpZCwgb2Zmc2V0OiB0aGlzLl9sYXN0T2Zmc2V0IH0sIGRhdGEpXG4gICAgICAgICAgICAgICAgOiBkYXRhLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZW5naW5lIG9yIG1hbmFnZXIgYGVycm9yYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdF9lcnJvclwiLCBlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBgY2xvc2VgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYXNvblxuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvblxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jbG9zZShyZWFzb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmlkO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRpc2Nvbm5lY3RcIiwgcmVhc29uLCBkZXNjcmlwdGlvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIHNvY2tldCBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgY29uc3Qgc2FtZU5hbWVzcGFjZSA9IHBhY2tldC5uc3AgPT09IHRoaXMubnNwO1xuICAgICAgICBpZiAoIXNhbWVOYW1lc3BhY2UpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN3aXRjaCAocGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUOlxuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQuZGF0YSAmJiBwYWNrZXQuZGF0YS5zaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmNvbm5lY3QocGFja2V0LmRhdGEuc2lkLCBwYWNrZXQuZGF0YS5waWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0X2Vycm9yXCIsIG5ldyBFcnJvcihcIkl0IHNlZW1zIHlvdSBhcmUgdHJ5aW5nIHRvIHJlYWNoIGEgU29ja2V0LklPIHNlcnZlciBpbiB2Mi54IHdpdGggYSB2My54IGNsaWVudCwgYnV0IHRoZXkgYXJlIG5vdCBjb21wYXRpYmxlIChtb3JlIGluZm9ybWF0aW9uIGhlcmU6IGh0dHBzOi8vc29ja2V0LmlvL2RvY3MvdjMvbWlncmF0aW5nLWZyb20tMi14LXRvLTMtMC8pXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRVZFTlQ6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0VWRU5UOlxuICAgICAgICAgICAgICAgIHRoaXMub25ldmVudChwYWNrZXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkFDSzpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfQUNLOlxuICAgICAgICAgICAgICAgIHRoaXMub25hY2socGFja2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5ESVNDT05ORUNUOlxuICAgICAgICAgICAgICAgIHRoaXMub25kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVF9FUlJPUjpcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IocGFja2V0LmRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGVyci5kYXRhID0gcGFja2V0LmRhdGEuZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNlcnZlciBldmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXZlbnQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBwYWNrZXQuZGF0YSB8fCBbXTtcbiAgICAgICAgaWYgKG51bGwgIT0gcGFja2V0LmlkKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2godGhpcy5hY2socGFja2V0LmlkKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRFdmVudChhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5wdXNoKE9iamVjdC5mcmVlemUoYXJncykpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVtaXRFdmVudChhcmdzKSB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlMaXN0ZW5lcnMgJiYgdGhpcy5fYW55TGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmVtaXQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGlmICh0aGlzLl9waWQgJiYgYXJncy5sZW5ndGggJiYgdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fbGFzdE9mZnNldCA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm9kdWNlcyBhbiBhY2sgY2FsbGJhY2sgdG8gZW1pdCB3aXRoIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBhY2soaWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGxldCBzZW50ID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgLy8gcHJldmVudCBkb3VibGUgY2FsbGJhY2tzXG4gICAgICAgICAgICBpZiAoc2VudClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBzZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIHNlbGYucGFja2V0KHtcbiAgICAgICAgICAgICAgICB0eXBlOiBQYWNrZXRUeXBlLkFDSyxcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgZGF0YTogYXJncyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNlcnZlciBhY2tub3dsZWdlbWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uYWNrKHBhY2tldCkge1xuICAgICAgICBjb25zdCBhY2sgPSB0aGlzLmFja3NbcGFja2V0LmlkXTtcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGFjaykge1xuICAgICAgICAgICAgYWNrLmFwcGx5KHRoaXMsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFja3NbcGFja2V0LmlkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzZXJ2ZXIgY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jb25uZWN0KGlkLCBwaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnJlY292ZXJlZCA9IHBpZCAmJiB0aGlzLl9waWQgPT09IHBpZDtcbiAgICAgICAgdGhpcy5fcGlkID0gcGlkOyAvLyBkZWZpbmVkIG9ubHkgaWYgY29ubmVjdGlvbiBzdGF0ZSByZWNvdmVyeSBpcyBlbmFibGVkXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0QnVmZmVyZWQoKTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0XCIpO1xuICAgICAgICB0aGlzLl9kcmFpblF1ZXVlKHRydWUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0IGJ1ZmZlcmVkIGV2ZW50cyAocmVjZWl2ZWQgYW5kIGVtaXR0ZWQpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBlbWl0QnVmZmVyZWQoKSB7XG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5mb3JFYWNoKChhcmdzKSA9PiB0aGlzLmVtaXRFdmVudChhcmdzKSk7XG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLnNlbmRCdWZmZXIuZm9yRWFjaCgocGFja2V0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCk7XG4gICAgICAgICAgICB0aGlzLnBhY2tldChwYWNrZXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyID0gW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHNlcnZlciBkaXNjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLm9uY2xvc2UoXCJpbyBzZXJ2ZXIgZGlzY29ubmVjdFwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZm9yY2VkIGNsaWVudC9zZXJ2ZXIgc2lkZSBkaXNjb25uZWN0aW9ucyxcbiAgICAgKiB0aGlzIG1ldGhvZCBlbnN1cmVzIHRoZSBtYW5hZ2VyIHN0b3BzIHRyYWNraW5nIHVzIGFuZFxuICAgICAqIHRoYXQgcmVjb25uZWN0aW9ucyBkb24ndCBnZXQgdHJpZ2dlcmVkIGZvciB0aGlzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5zdWJzKSB7XG4gICAgICAgICAgICAvLyBjbGVhbiBzdWJzY3JpcHRpb25zIHRvIGF2b2lkIHJlY29ubmVjdGlvbnNcbiAgICAgICAgICAgIHRoaXMuc3Vicy5mb3JFYWNoKChzdWJEZXN0cm95KSA9PiBzdWJEZXN0cm95KCkpO1xuICAgICAgICAgICAgdGhpcy5zdWJzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW9bXCJfZGVzdHJveVwiXSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGlzY29ubmVjdHMgdGhlIHNvY2tldCBtYW51YWxseS4gSW4gdGhhdCBjYXNlLCB0aGUgc29ja2V0IHdpbGwgbm90IHRyeSB0byByZWNvbm5lY3QuXG4gICAgICpcbiAgICAgKiBJZiB0aGlzIGlzIHRoZSBsYXN0IGFjdGl2ZSBTb2NrZXQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBNYW5hZ2VyfSwgdGhlIGxvdy1sZXZlbCBjb25uZWN0aW9uIHdpbGwgYmUgY2xvc2VkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gICAgICogICAvLyBjb25zb2xlLmxvZyhyZWFzb24pOyBwcmludHMgXCJpbyBjbGllbnQgZGlzY29ubmVjdFwiXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhY2tldCh7IHR5cGU6IFBhY2tldFR5cGUuRElTQ09OTkVDVCB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgc29ja2V0IGZyb20gcG9vbFxuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAvLyBmaXJlIGV2ZW50c1xuICAgICAgICAgICAgdGhpcy5vbmNsb3NlKFwiaW8gY2xpZW50IGRpc2Nvbm5lY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciB7QGxpbmsgZGlzY29ubmVjdCgpfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGNvbXByZXNzIGZsYWcuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5jb21wcmVzcyhmYWxzZSkuZW1pdChcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXByZXNzIC0gaWYgYHRydWVgLCBjb21wcmVzc2VzIHRoZSBzZW5kaW5nIGRhdGFcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBjb21wcmVzcyhjb21wcmVzcykge1xuICAgICAgICB0aGlzLmZsYWdzLmNvbXByZXNzID0gY29tcHJlc3M7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgbW9kaWZpZXIgZm9yIGEgc3Vic2VxdWVudCBldmVudCBlbWlzc2lvbiB0aGF0IHRoZSBldmVudCBtZXNzYWdlIHdpbGwgYmUgZHJvcHBlZCB3aGVuIHRoaXMgc29ja2V0IGlzIG5vdFxuICAgICAqIHJlYWR5IHRvIHNlbmQgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC52b2xhdGlsZS5lbWl0KFwiaGVsbG9cIik7IC8vIHRoZSBzZXJ2ZXIgbWF5IG9yIG1heSBub3QgcmVjZWl2ZSBpdFxuICAgICAqXG4gICAgICogQHJldHVybnMgc2VsZlxuICAgICAqL1xuICAgIGdldCB2b2xhdGlsZSgpIHtcbiAgICAgICAgdGhpcy5mbGFncy52b2xhdGlsZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgbW9kaWZpZXIgZm9yIGEgc3Vic2VxdWVudCBldmVudCBlbWlzc2lvbiB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aXRoIGFuIGVycm9yIHdoZW4gdGhlXG4gICAgICogZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgd2l0aG91dCBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyOlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQudGltZW91dCg1MDAwKS5lbWl0KFwibXktZXZlbnRcIiwgKGVycikgPT4ge1xuICAgICAqICAgaWYgKGVycikge1xuICAgICAqICAgICAvLyB0aGUgc2VydmVyIGRpZCBub3QgYWNrbm93bGVkZ2UgdGhlIGV2ZW50IGluIHRoZSBnaXZlbiBkZWxheVxuICAgICAqICAgfVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybnMgc2VsZlxuICAgICAqL1xuICAgIHRpbWVvdXQodGltZW91dCkge1xuICAgICAgICB0aGlzLmZsYWdzLnRpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQub25BbnkoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvbkFueShsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay4gVGhlIGxpc3RlbmVyIGlzIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnByZXBlbmRBbnkoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcmVwZW5kQW55KGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGNhdGNoQWxsTGlzdGVuZXIgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBnb3QgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBzb2NrZXQub25BbnkoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyByZW1vdmUgYSBzcGVjaWZpYyBsaXN0ZW5lclxuICAgICAqIHNvY2tldC5vZmZBbnkoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyBvciByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAqIHNvY2tldC5vZmZBbnkoKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIG9mZkFueShsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuX2FueUxpc3RlbmVycykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0aGF0IGFyZSBsaXN0ZW5pbmcgZm9yIGFueSBldmVudCB0aGF0IGlzIHNwZWNpZmllZC4gVGhpcyBhcnJheSBjYW4gYmUgbWFuaXB1bGF0ZWQsXG4gICAgICogZS5nLiB0byByZW1vdmUgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIGxpc3RlbmVyc0FueSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogTm90ZTogYWNrbm93bGVkZ2VtZW50cyBzZW50IHRvIHRoZSBzZXJ2ZXIgYXJlIG5vdCBpbmNsdWRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0Lm9uQW55T3V0Z29pbmcoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgb25BbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay4gVGhlIGxpc3RlbmVyIGlzIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS5cbiAgICAgKlxuICAgICAqIE5vdGU6IGFja25vd2xlZGdlbWVudHMgc2VudCB0byB0aGUgc2VydmVyIGFyZSBub3QgaW5jbHVkZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5wcmVwZW5kQW55T3V0Z29pbmcoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgcHJlcGVuZEFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGNhdGNoQWxsTGlzdGVuZXIgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBzZW50IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uQW55T3V0Z29pbmcoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyByZW1vdmUgYSBzcGVjaWZpYyBsaXN0ZW5lclxuICAgICAqIHNvY2tldC5vZmZBbnlPdXRnb2luZyhjYXRjaEFsbExpc3RlbmVyKTtcbiAgICAgKlxuICAgICAqIC8vIG9yIHJlbW92ZSBhbGwgbGlzdGVuZXJzXG4gICAgICogc29ja2V0Lm9mZkFueU91dGdvaW5nKCk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW2xpc3RlbmVyXSAtIHRoZSBjYXRjaC1hbGwgbGlzdGVuZXIgKG9wdGlvbmFsKVxuICAgICAqL1xuICAgIG9mZkFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRoYXQgYXJlIGxpc3RlbmluZyBmb3IgYW55IGV2ZW50IHRoYXQgaXMgc3BlY2lmaWVkLiBUaGlzIGFycmF5IGNhbiBiZSBtYW5pcHVsYXRlZCxcbiAgICAgKiBlLmcuIHRvIHJlbW92ZSBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgbGlzdGVuZXJzQW55T3V0Z29pbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyB8fCBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTm90aWZ5IHRoZSBsaXN0ZW5lcnMgZm9yIGVhY2ggcGFja2V0IHNlbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgbm90aWZ5T3V0Z29pbmdMaXN0ZW5lcnMocGFja2V0KSB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyAmJiB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8qKlxuICogSW5pdGlhbGl6ZSBiYWNrb2ZmIHRpbWVyIHdpdGggYG9wdHNgLlxuICpcbiAqIC0gYG1pbmAgaW5pdGlhbCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyBbMTAwXVxuICogLSBgbWF4YCBtYXggdGltZW91dCBbMTAwMDBdXG4gKiAtIGBqaXR0ZXJgIFswXVxuICogLSBgZmFjdG9yYCBbMl1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJhY2tvZmYob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgIHRoaXMubXMgPSBvcHRzLm1pbiB8fCAxMDA7XG4gICAgdGhpcy5tYXggPSBvcHRzLm1heCB8fCAxMDAwMDtcbiAgICB0aGlzLmZhY3RvciA9IG9wdHMuZmFjdG9yIHx8IDI7XG4gICAgdGhpcy5qaXR0ZXIgPSBvcHRzLmppdHRlciA+IDAgJiYgb3B0cy5qaXR0ZXIgPD0gMSA/IG9wdHMuaml0dGVyIDogMDtcbiAgICB0aGlzLmF0dGVtcHRzID0gMDtcbn1cbi8qKlxuICogUmV0dXJuIHRoZSBiYWNrb2ZmIGR1cmF0aW9uLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLmR1cmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtcyA9IHRoaXMubXMgKiBNYXRoLnBvdyh0aGlzLmZhY3RvciwgdGhpcy5hdHRlbXB0cysrKTtcbiAgICBpZiAodGhpcy5qaXR0ZXIpIHtcbiAgICAgICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB2YXIgZGV2aWF0aW9uID0gTWF0aC5mbG9vcihyYW5kICogdGhpcy5qaXR0ZXIgKiBtcyk7XG4gICAgICAgIG1zID0gKE1hdGguZmxvb3IocmFuZCAqIDEwKSAmIDEpID09IDAgPyBtcyAtIGRldmlhdGlvbiA6IG1zICsgZGV2aWF0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5taW4obXMsIHRoaXMubWF4KSB8IDA7XG59O1xuLyoqXG4gKiBSZXNldCB0aGUgbnVtYmVyIG9mIGF0dGVtcHRzLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXR0ZW1wdHMgPSAwO1xufTtcbi8qKlxuICogU2V0IHRoZSBtaW5pbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuc2V0TWluID0gZnVuY3Rpb24gKG1pbikge1xuICAgIHRoaXMubXMgPSBtaW47XG59O1xuLyoqXG4gKiBTZXQgdGhlIG1heGltdW0gZHVyYXRpb25cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNYXggPSBmdW5jdGlvbiAobWF4KSB7XG4gICAgdGhpcy5tYXggPSBtYXg7XG59O1xuLyoqXG4gKiBTZXQgdGhlIGppdHRlclxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnNldEppdHRlciA9IGZ1bmN0aW9uIChqaXR0ZXIpIHtcbiAgICB0aGlzLmppdHRlciA9IGppdHRlcjtcbn07XG4iLCJpbXBvcnQgeyBTb2NrZXQgYXMgRW5naW5lLCBpbnN0YWxsVGltZXJGdW5jdGlvbnMsIG5leHRUaWNrLCB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXQuanNcIjtcbmltcG9ydCAqIGFzIHBhcnNlciBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgb24gfSBmcm9tIFwiLi9vbi5qc1wiO1xuaW1wb3J0IHsgQmFja29mZiB9IGZyb20gXCIuL2NvbnRyaWIvYmFja28yLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyLCB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5leHBvcnQgY2xhc3MgTWFuYWdlciBleHRlbmRzIEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cykge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubnNwcyA9IHt9O1xuICAgICAgICB0aGlzLnN1YnMgPSBbXTtcbiAgICAgICAgaWYgKHVyaSAmJiBcIm9iamVjdFwiID09PSB0eXBlb2YgdXJpKSB7XG4gICAgICAgICAgICBvcHRzID0gdXJpO1xuICAgICAgICAgICAgdXJpID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgICBvcHRzLnBhdGggPSBvcHRzLnBhdGggfHwgXCIvc29ja2V0LmlvXCI7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb24ob3B0cy5yZWNvbm5lY3Rpb24gIT09IGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyhvcHRzLnJlY29ubmVjdGlvbkF0dGVtcHRzIHx8IEluZmluaXR5KTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheShvcHRzLnJlY29ubmVjdGlvbkRlbGF5IHx8IDEwMDApO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5TWF4KG9wdHMucmVjb25uZWN0aW9uRGVsYXlNYXggfHwgNTAwMCk7XG4gICAgICAgIHRoaXMucmFuZG9taXphdGlvbkZhY3RvcigoX2EgPSBvcHRzLnJhbmRvbWl6YXRpb25GYWN0b3IpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IDAuNSk7XG4gICAgICAgIHRoaXMuYmFja29mZiA9IG5ldyBCYWNrb2ZmKHtcbiAgICAgICAgICAgIG1pbjogdGhpcy5yZWNvbm5lY3Rpb25EZWxheSgpLFxuICAgICAgICAgICAgbWF4OiB0aGlzLnJlY29ubmVjdGlvbkRlbGF5TWF4KCksXG4gICAgICAgICAgICBqaXR0ZXI6IHRoaXMucmFuZG9taXphdGlvbkZhY3RvcigpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy50aW1lb3V0KG51bGwgPT0gb3B0cy50aW1lb3V0ID8gMjAwMDAgOiBvcHRzLnRpbWVvdXQpO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgdGhpcy51cmkgPSB1cmk7XG4gICAgICAgIGNvbnN0IF9wYXJzZXIgPSBvcHRzLnBhcnNlciB8fCBwYXJzZXI7XG4gICAgICAgIHRoaXMuZW5jb2RlciA9IG5ldyBfcGFyc2VyLkVuY29kZXIoKTtcbiAgICAgICAgdGhpcy5kZWNvZGVyID0gbmV3IF9wYXJzZXIuRGVjb2RlcigpO1xuICAgICAgICB0aGlzLl9hdXRvQ29ubmVjdCA9IG9wdHMuYXV0b0Nvbm5lY3QgIT09IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fYXV0b0Nvbm5lY3QpXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbjtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gISF2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uQXR0ZW1wdHModikge1xuICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbkF0dGVtcHRzO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb25BdHRlbXB0cyA9IHY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZWNvbm5lY3Rpb25EZWxheSh2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25EZWxheTtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uRGVsYXkgPSB2O1xuICAgICAgICAoX2EgPSB0aGlzLmJhY2tvZmYpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zZXRNaW4odik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByYW5kb21pemF0aW9uRmFjdG9yKHYpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBpZiAodiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JhbmRvbWl6YXRpb25GYWN0b3I7XG4gICAgICAgIHRoaXMuX3JhbmRvbWl6YXRpb25GYWN0b3IgPSB2O1xuICAgICAgICAoX2EgPSB0aGlzLmJhY2tvZmYpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zZXRKaXR0ZXIodik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZWNvbm5lY3Rpb25EZWxheU1heCh2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25EZWxheU1heDtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXggPSB2O1xuICAgICAgICAoX2EgPSB0aGlzLmJhY2tvZmYpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5zZXRNYXgodik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB0aW1lb3V0KHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3RpbWVvdXQ7XG4gICAgICAgIHRoaXMuX3RpbWVvdXQgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhcnRzIHRyeWluZyB0byByZWNvbm5lY3QgaWYgcmVjb25uZWN0aW9uIGlzIGVuYWJsZWQgYW5kIHdlIGhhdmUgbm90XG4gICAgICogc3RhcnRlZCByZWNvbm5lY3RpbmcgeWV0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG1heWJlUmVjb25uZWN0T25PcGVuKCkge1xuICAgICAgICAvLyBPbmx5IHRyeSB0byByZWNvbm5lY3QgaWYgaXQncyB0aGUgZmlyc3QgdGltZSB3ZSdyZSBjb25uZWN0aW5nXG4gICAgICAgIGlmICghdGhpcy5fcmVjb25uZWN0aW5nICYmXG4gICAgICAgICAgICB0aGlzLl9yZWNvbm5lY3Rpb24gJiZcbiAgICAgICAgICAgIHRoaXMuYmFja29mZi5hdHRlbXB0cyA9PT0gMCkge1xuICAgICAgICAgICAgLy8ga2VlcHMgcmVjb25uZWN0aW9uIGZyb20gZmlyaW5nIHR3aWNlIGZvciB0aGUgc2FtZSByZWNvbm5lY3Rpb24gbG9vcFxuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBjdXJyZW50IHRyYW5zcG9ydCBgc29ja2V0YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIC0gb3B0aW9uYWwsIGNhbGxiYWNrXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICogQHB1YmxpY1xuICAgICAqL1xuICAgIG9wZW4oZm4pIHtcbiAgICAgICAgaWYgKH50aGlzLl9yZWFkeVN0YXRlLmluZGV4T2YoXCJvcGVuXCIpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIHRoaXMuZW5naW5lID0gbmV3IEVuZ2luZSh0aGlzLnVyaSwgdGhpcy5vcHRzKTtcbiAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5lbmdpbmU7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJvcGVuaW5nXCI7XG4gICAgICAgIHRoaXMuc2tpcFJlY29ubmVjdCA9IGZhbHNlO1xuICAgICAgICAvLyBlbWl0IGBvcGVuYFxuICAgICAgICBjb25zdCBvcGVuU3ViRGVzdHJveSA9IG9uKHNvY2tldCwgXCJvcGVuXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYub25vcGVuKCk7XG4gICAgICAgICAgICBmbiAmJiBmbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gZW1pdCBgZXJyb3JgXG4gICAgICAgIGNvbnN0IGVycm9yU3ViID0gb24oc29ja2V0LCBcImVycm9yXCIsIChlcnIpID0+IHtcbiAgICAgICAgICAgIHNlbGYuY2xlYW51cCgpO1xuICAgICAgICAgICAgc2VsZi5fcmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbihlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBkbyB0aGlzIGlmIHRoZXJlIGlzIG5vIGZuIHRvIGhhbmRsZSB0aGUgZXJyb3JcbiAgICAgICAgICAgICAgICBzZWxmLm1heWJlUmVjb25uZWN0T25PcGVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZmFsc2UgIT09IHRoaXMuX3RpbWVvdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICAgICAgICAgICAgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBvcGVuU3ViRGVzdHJveSgpOyAvLyBwcmV2ZW50cyBhIHJhY2UgY29uZGl0aW9uIHdpdGggdGhlICdvcGVuJyBldmVudFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IHRpbWVyXG4gICAgICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvcGVuU3ViRGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHNvY2tldC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihcInRpbWVvdXRcIikpO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmF1dG9VbnJlZikge1xuICAgICAgICAgICAgICAgIHRpbWVyLnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN1YnMucHVzaChmdW5jdGlvbiBzdWJEZXN0cm95KCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN1YnMucHVzaChvcGVuU3ViRGVzdHJveSk7XG4gICAgICAgIHRoaXMuc3Vicy5wdXNoKGVycm9yU3ViKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciBvcGVuKClcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBjb25uZWN0KGZuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wZW4oZm4pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25vcGVuKCkge1xuICAgICAgICAvLyBjbGVhciBvbGQgc3Vic1xuICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgLy8gbWFyayBhcyBvcGVuXG4gICAgICAgIHRoaXMuX3JlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJvcGVuXCIpO1xuICAgICAgICAvLyBhZGQgbmV3IHN1YnNcbiAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5lbmdpbmU7XG4gICAgICAgIHRoaXMuc3Vicy5wdXNoKG9uKHNvY2tldCwgXCJwaW5nXCIsIHRoaXMub25waW5nLmJpbmQodGhpcykpLCBvbihzb2NrZXQsIFwiZGF0YVwiLCB0aGlzLm9uZGF0YS5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImVycm9yXCIsIHRoaXMub25lcnJvci5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImNsb3NlXCIsIHRoaXMub25jbG9zZS5iaW5kKHRoaXMpKSwgb24odGhpcy5kZWNvZGVyLCBcImRlY29kZWRcIiwgdGhpcy5vbmRlY29kZWQuYmluZCh0aGlzKSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHBpbmcuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ucGluZygpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwaW5nXCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBkYXRhLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRhdGEoZGF0YSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5kZWNvZGVyLmFkZChkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy5vbmNsb3NlKFwicGFyc2UgZXJyb3JcIiwgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gcGFyc2VyIGZ1bGx5IGRlY29kZXMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZGVjb2RlZChwYWNrZXQpIHtcbiAgICAgICAgLy8gdGhlIG5leHRUaWNrIGNhbGwgcHJldmVudHMgYW4gZXhjZXB0aW9uIGluIGEgdXNlci1wcm92aWRlZCBldmVudCBsaXN0ZW5lciBmcm9tIHRyaWdnZXJpbmcgYSBkaXNjb25uZWN0aW9uIGR1ZSB0byBhIFwicGFyc2UgZXJyb3JcIlxuICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgICAgICB9LCB0aGlzLnNldFRpbWVvdXRGbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHNvY2tldCBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25lcnJvcihlcnIpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IHNvY2tldCBmb3IgdGhlIGdpdmVuIGBuc3BgLlxuICAgICAqXG4gICAgICogQHJldHVybiB7U29ja2V0fVxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBzb2NrZXQobnNwLCBvcHRzKSB7XG4gICAgICAgIGxldCBzb2NrZXQgPSB0aGlzLm5zcHNbbnNwXTtcbiAgICAgICAgaWYgKCFzb2NrZXQpIHtcbiAgICAgICAgICAgIHNvY2tldCA9IG5ldyBTb2NrZXQodGhpcywgbnNwLCBvcHRzKTtcbiAgICAgICAgICAgIHRoaXMubnNwc1tuc3BdID0gc29ja2V0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRoaXMuX2F1dG9Db25uZWN0ICYmICFzb2NrZXQuYWN0aXZlKSB7XG4gICAgICAgICAgICBzb2NrZXQuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGEgc29ja2V0IGNsb3NlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNvY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Rlc3Ryb3koc29ja2V0KSB7XG4gICAgICAgIGNvbnN0IG5zcHMgPSBPYmplY3Qua2V5cyh0aGlzLm5zcHMpO1xuICAgICAgICBmb3IgKGNvbnN0IG5zcCBvZiBuc3BzKSB7XG4gICAgICAgICAgICBjb25zdCBzb2NrZXQgPSB0aGlzLm5zcHNbbnNwXTtcbiAgICAgICAgICAgIGlmIChzb2NrZXQuYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Nsb3NlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyaXRlcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IGVuY29kZWRQYWNrZXRzID0gdGhpcy5lbmNvZGVyLmVuY29kZShwYWNrZXQpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY29kZWRQYWNrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmVuZ2luZS53cml0ZShlbmNvZGVkUGFja2V0c1tpXSwgcGFja2V0Lm9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFuIHVwIHRyYW5zcG9ydCBzdWJzY3JpcHRpb25zIGFuZCBwYWNrZXQgYnVmZmVyLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjbGVhbnVwKCkge1xuICAgICAgICB0aGlzLnN1YnMuZm9yRWFjaCgoc3ViRGVzdHJveSkgPT4gc3ViRGVzdHJveSgpKTtcbiAgICAgICAgdGhpcy5zdWJzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZGVjb2Rlci5kZXN0cm95KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlIHRoZSBjdXJyZW50IHNvY2tldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Nsb3NlKCkge1xuICAgICAgICB0aGlzLnNraXBSZWNvbm5lY3QgPSB0cnVlO1xuICAgICAgICB0aGlzLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbmNsb3NlKFwiZm9yY2VkIGNsb3NlXCIpO1xuICAgICAgICBpZiAodGhpcy5lbmdpbmUpXG4gICAgICAgICAgICB0aGlzLmVuZ2luZS5jbG9zZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3IgY2xvc2UoKVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2UoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZW5naW5lIGNsb3NlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmNsb3NlKHJlYXNvbiwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbiAmJiAhdGhpcy5za2lwUmVjb25uZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEF0dGVtcHQgYSByZWNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGluZyB8fCB0aGlzLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPj0gdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMpIHtcbiAgICAgICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RfZmFpbGVkXCIpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWxheSA9IHRoaXMuYmFja29mZi5kdXJhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVyID0gdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdF9hdHRlbXB0XCIsIHNlbGYuYmFja29mZi5hdHRlbXB0cyk7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYWdhaW4gZm9yIHRoZSBjYXNlIHNvY2tldCBjbG9zZWQgaW4gYWJvdmUgZXZlbnRzXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2tpcFJlY29ubmVjdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHNlbGYub3BlbigoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0X2Vycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9ucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGltZXIudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3Vicy5wdXNoKGZ1bmN0aW9uIHN1YkRlc3Ryb3koKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHN1Y2Nlc3NmdWwgcmVjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnJlY29ubmVjdCgpIHtcbiAgICAgICAgY29uc3QgYXR0ZW1wdCA9IHRoaXMuYmFja29mZi5hdHRlbXB0cztcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdFwiLCBhdHRlbXB0KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyB1cmwgfSBmcm9tIFwiLi91cmwuanNcIjtcbmltcG9ydCB7IE1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXQuanNcIjtcbi8qKlxuICogTWFuYWdlcnMgY2FjaGUuXG4gKi9cbmNvbnN0IGNhY2hlID0ge307XG5mdW5jdGlvbiBsb29rdXAodXJpLCBvcHRzKSB7XG4gICAgaWYgKHR5cGVvZiB1cmkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgb3B0cyA9IHVyaTtcbiAgICAgICAgdXJpID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICBjb25zdCBwYXJzZWQgPSB1cmwodXJpLCBvcHRzLnBhdGggfHwgXCIvc29ja2V0LmlvXCIpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHBhcnNlZC5zb3VyY2U7XG4gICAgY29uc3QgaWQgPSBwYXJzZWQuaWQ7XG4gICAgY29uc3QgcGF0aCA9IHBhcnNlZC5wYXRoO1xuICAgIGNvbnN0IHNhbWVOYW1lc3BhY2UgPSBjYWNoZVtpZF0gJiYgcGF0aCBpbiBjYWNoZVtpZF1bXCJuc3BzXCJdO1xuICAgIGNvbnN0IG5ld0Nvbm5lY3Rpb24gPSBvcHRzLmZvcmNlTmV3IHx8XG4gICAgICAgIG9wdHNbXCJmb3JjZSBuZXcgY29ubmVjdGlvblwiXSB8fFxuICAgICAgICBmYWxzZSA9PT0gb3B0cy5tdWx0aXBsZXggfHxcbiAgICAgICAgc2FtZU5hbWVzcGFjZTtcbiAgICBsZXQgaW87XG4gICAgaWYgKG5ld0Nvbm5lY3Rpb24pIHtcbiAgICAgICAgaW8gPSBuZXcgTWFuYWdlcihzb3VyY2UsIG9wdHMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKCFjYWNoZVtpZF0pIHtcbiAgICAgICAgICAgIGNhY2hlW2lkXSA9IG5ldyBNYW5hZ2VyKHNvdXJjZSwgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgaW8gPSBjYWNoZVtpZF07XG4gICAgfVxuICAgIGlmIChwYXJzZWQucXVlcnkgJiYgIW9wdHMucXVlcnkpIHtcbiAgICAgICAgb3B0cy5xdWVyeSA9IHBhcnNlZC5xdWVyeUtleTtcbiAgICB9XG4gICAgcmV0dXJuIGlvLnNvY2tldChwYXJzZWQucGF0aCwgb3B0cyk7XG59XG4vLyBzbyB0aGF0IFwibG9va3VwXCIgY2FuIGJlIHVzZWQgYm90aCBhcyBhIGZ1bmN0aW9uIChlLmcuIGBpbyguLi4pYCkgYW5kIGFzIGFcbi8vIG5hbWVzcGFjZSAoZS5nLiBgaW8uY29ubmVjdCguLi4pYCksIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5PYmplY3QuYXNzaWduKGxvb2t1cCwge1xuICAgIE1hbmFnZXIsXG4gICAgU29ja2V0LFxuICAgIGlvOiBsb29rdXAsXG4gICAgY29ubmVjdDogbG9va3VwLFxufSk7XG4vKipcbiAqIFByb3RvY29sIHZlcnNpb24uXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgeyBwcm90b2NvbCB9IGZyb20gXCJzb2NrZXQuaW8tcGFyc2VyXCI7XG4vKipcbiAqIEV4cG9zZSBjb25zdHJ1Y3RvcnMgZm9yIHN0YW5kYWxvbmUgYnVpbGQuXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgeyBNYW5hZ2VyLCBTb2NrZXQsIGxvb2t1cCBhcyBpbywgbG9va3VwIGFzIGNvbm5lY3QsIGxvb2t1cCBhcyBkZWZhdWx0LCB9O1xuIiwiLy8gQ29udGFpbnMgY3VycmVudCBwbGF5ZXIgc3RhdGUgaW4gZ2FtZS5cclxuZXhwb3J0IGNsYXNzIFN0YXRlIHtcclxuICAgIHN0YXRpYyBXQUlUSU5HID0gbmV3IFN0YXRlKFwiV0FJVElOR1wiKTtcclxuICAgIHN0YXRpYyBBTkdMRV9DSE9PU0UgPSBuZXcgU3RhdGUoXCJBTkdMRVwiKTtcclxuICAgIHN0YXRpYyBTUEVFRF9DSE9PU0UgPSBuZXcgU3RhdGUoXCJTUEVFRFwiKTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIH1cclxufSAvLyBFbmQgb2YgU3RhdGUgY2xhc3MuXHJcblxyXG4vLyBDb250YWlucyByb29tIGRhdGEuXHJcbmV4cG9ydCBjbGFzcyBEYXRhIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucm9vbUlkID0gbnVsbDsgICAgLy8gQ3VycmVudCByb29tIElELlxyXG4gICAgICAgIHRoaXMucGxheWVySWQgPSBudWxsOyAgLy8gQ3VycmVudCBwbGF5ZXIgSUQuXHJcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG51bGw7ICAvLyBDdXJyZW50IHBsYXllciBwb3NpdGlvbi5cclxuICAgICAgICB0aGlzLnNpZGUgPSBcIm5cIjsgICAgICAgLy8gQ3VycmVudCBwbGF5ZXIgbWFwIHNpZGUuXHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IG51bGw7ICAgICAvLyBDdXJyZW50IHBsYXllciBzdGF0ZS5cclxuICAgICAgICB0aGlzLnNwZWVkID0gMDsgICAgICAgIC8vIEN1cnJlbnQgcGxheWVyIGJ1bGxldCBzcGVlZC5cclxuICAgICAgICB0aGlzLmlzU2hvdCA9IGZhbHNlOyAgIC8vIEN1cnJlbnQgcGxheWVyIHNob3QgZHJhdyBmbGFnLlxyXG4gICAgICAgIHRoaXMuc3RhcnRTaG90ID0gMDsgICAgLy8gQ3VycmVudCBwbGF5ZXIgc2hvdCBzdGFydCB0aW1lLlxyXG4gICAgICAgIHRoaXMuZVBvcyA9IG51bGw7ICAgICAgLy8gRW5lbXkgcG9zaXRpb24gaW4gcm9vbS5cclxuICAgICAgICB0aGlzLmVTcGVlZCA9IDA7ICAgICAgIC8vIEVuZW15IGJ1bGxldCBzcGVlZC5cclxuICAgICAgICB0aGlzLmVTaW5BbmdsZSA9IG51bGw7IC8vIEVuZW15IHNpbiBhbmdsZS5cclxuICAgICAgICB0aGlzLmVDb3NBbmdsZSA9IG51bGw7IC8vIEVuZW15IGNvcyBhbmdsZS5cclxuICAgICAgICB0aGlzLmVJc1Nob3QgPSBmYWxzZTsgIC8vIEVuZW15IHNob3QgZHJhdyBmbGFnLlxyXG4gICAgICAgIHRoaXMuZVN0YXJ0U2hvdCA9IDA7ICAgLy8gRW5lbXkgc2hvdCBzdGFydCB0aW1lLlxyXG4gICAgfVxyXG5cclxuICAgIHNldEFuZ2xlKG1vdXNlWCwgbW91c2VZKSB7XHJcbiAgICAgICAgLy8gU2luXHJcbiAgICAgICAgdGhpcy5zaW5BbmdsZSA9IChtb3VzZVkgLSAodGhpcy5wb3NpdGlvblsxXSArIDEwKSkgL1xyXG4gICAgICAgIE1hdGguc3FydCgobW91c2VYIC0gKHRoaXMucG9zaXRpb25bMF0gKyAxMCkpICoqIDIgKyAobW91c2VZIC0gKHRoaXMucG9zaXRpb25bMV0gKyAxMCkpICoqIDIpO1xyXG4gICAgICAgIC8vIENvc1xyXG4gICAgICAgIHRoaXMuY29zQW5nbGUgPSAobW91c2VYIC0gKHRoaXMucG9zaXRpb25bMF0gKyAxMCkpIC9cclxuICAgICAgICBNYXRoLnNxcnQoKG1vdXNlWCAtICh0aGlzLnBvc2l0aW9uWzBdICsgMTApKSAqKiAyICsgKG1vdXNlWSAtICh0aGlzLnBvc2l0aW9uWzFdICsgMTApKSAqKiAyKTtcclxuICAgIH1cclxufSAvLyBFbmQgb2YgRGF0YSBjbGFzcy5cclxuIiwiaW1wb3J0IHtTdGF0ZX0gZnJvbSBcIi4vY2xhc3Nlcy5qc1wiO1xyXG5cclxuLy8gU2V0IHBsYXllciBkYXRhIGZyb20gbWVzc2FnZSBmdW5jdGlvbi5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFJvb21EYXRhKHJvb21EYXRhLCBkYXRhQXJyYXksIHNvY2tldCkge1xyXG4gIC8vIFJvb20gSUQuXHJcbiAgcm9vbURhdGEucm9vbUlkID0gZGF0YUFycmF5WzBdO1xyXG4gIGNvbnNvbGUubG9nKGBZb3VyIHJvb20gaWQ6ICR7cm9vbURhdGEucm9vbUlkfWApO1xyXG5cclxuICAvLyBQbGF5ZXIgSFAuXHJcbiAgcm9vbURhdGEubXlIcCA9IDE1MDA7XHJcblxyXG4gIC8vIFBsYXllciBJRC5cclxuICByb29tRGF0YS5wbGF5ZXJJZCA9IHNvY2tldC5pZDtcclxuXHJcbiAgLy8gUG9zaXRpb24uXHJcbiAgcm9vbURhdGEucG9zaXRpb24gPSBbcGFyc2VGbG9hdChkYXRhQXJyYXlbMV0pLCBwYXJzZUZsb2F0KGRhdGFBcnJheVsyXSldO1xyXG4gIGNvbnNvbGUubG9nKGBZb3VyIHBvc2l0aW9uOiAke3Jvb21EYXRhLnBvc2l0aW9ufWApO1xyXG5cclxuICAvLyBQbGF5ZXIgc3RhdGUgYW5kIHNpZGUuXHJcbiAgaWYgKGRhdGFBcnJheVszXSA9PSAxKSB7XHJcbiAgICByb29tRGF0YS5zaWRlID0gXCJsXCI7XHJcbiAgICByb29tRGF0YS5zdGF0ZSA9IFN0YXRlLkFOR0xFX0NIT09TRTtcclxuICB9IGVsc2Uge1xyXG4gICAgcm9vbURhdGEuc2lkZSA9IFwiclwiO1xyXG4gICAgcm9vbURhdGEuc3RhdGUgPSBTdGF0ZS5XQUlUSU5HO1xyXG4gIH1cclxuXHJcbiAgLy8gRW5lbXkgcG9zaXRpb24uXHJcbiAgcm9vbURhdGEuZVBvcyA9IFtwYXJzZUZsb2F0KGRhdGFBcnJheVs0XSksIHBhcnNlRmxvYXQoZGF0YUFycmF5WzVdKV07XHJcbiAgY29uc29sZS5sb2coYEVuZW15IHBvc2l0aW9uOiAke3Jvb21EYXRhLmVQb3N9YCk7XHJcbn0gLy8gRW5kIG9mIHNldFJvb21EYXRhIGZ1bmN0aW9uLlxyXG4iLCIvKiBGSUxFIE5BTUU6IHZlYzMuanNcclxuICogUFJPR1JBTU1FUjogQUcyXHJcbiAqIExBU1QgVVBEQVRFOiAwMy4wNi4yMDIzXHJcbiAqIFBVUlBPU0U6IDNEIG1hdGggdmVjdG9yIGltcGxlbWVudGF0aW9uIG1vZHVsZS5cclxuICovXHJcblxyXG4vKioqXHJcbiAqIFZlY3RvciB3aXRoIDMgY29tcG9uZW50cyBtb2R1bGVcclxuICoqKi9cclxuXHJcbi8qIFZlY3Rvci9wb2ludCByZXByZXNlbnRhdGlvbiB0eXBlICovXHJcbmNsYXNzIF92ZWMzIHtcclxuICBjb25zdHJ1Y3Rvcih4LCB5LCB6KSB7XHJcbiAgICBpZiAoeCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy54ID0gMDtcclxuICAgICAgdGhpcy55ID0gMDtcclxuICAgICAgdGhpcy56ID0gMDtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHggPT0gXCJvYmplY3RcIikge1xyXG4gICAgICBpZiAoeC5sZW5ndGggPT0gMykge1xyXG4gICAgICAgIHRoaXMueCA9IHhbMF07XHJcbiAgICAgICAgdGhpcy55ID0geFsxXTtcclxuICAgICAgICB0aGlzLnogPSB4WzJdO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMueCA9IHgueDtcclxuICAgICAgICB0aGlzLnkgPSB4Lnk7XHJcbiAgICAgICAgdGhpcy56ID0geC56O1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoeSA9PSB1bmRlZmluZWQgJiYgeiA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHg7XHJcbiAgICAgICAgdGhpcy56ID0geDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgdGhpcy56ID0gejtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyogU2V0IHZlY3RvciBmdW5jdGlvbiAqL1xyXG4gIHNldCh4LCB5LCB6KSB7XHJcbiAgICB0aGlzLnggPSB4O1xyXG4gICAgdGhpcy55ID0geTtcclxuICAgIHRoaXMueiA9IHo7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcbiAgLyogQWRkIHR3byB2ZWN0b3JzIGZ1bmN0aW9uICovXHJcbiAgYWRkKHZlYykge1xyXG4gICAgcmV0dXJuIHZlYzModGhpcy54ICsgdmVjLngsIHRoaXMueSArIHZlYy55LCB0aGlzLnogKyB2ZWMueik7XHJcbiAgfVxyXG4gIC8qIFN1YiB0d28gdmVjdG9ycyBmdW5jdGlvbiAqL1xyXG4gIHN1Yih2ZWMpIHtcclxuICAgIHJldHVybiB2ZWMzKHRoaXMueCAtIHZlYy54LCB0aGlzLnkgLSB2ZWMueSwgdGhpcy56IC0gdmVjLnopO1xyXG4gIH1cclxuICAvKiBNdWx0aXBsdSB2ZWN0b3IgYnkgYSBudW1iZXIgZnVuY3Rpb24gKi9cclxuICBtdWxOdW0obikge1xyXG4gICAgcmV0dXJuIHZlYzModGhpcy54ICogbiwgdGhpcy55ICogbiwgdGhpcy56ICogbik7XHJcbiAgfVxyXG4gIC8qIERpdmlzZSB2ZWN0b3IgYnkgYSBudW1iZXIgZnVuY3Rpb24gKi9cclxuICBkaXZOdW0obikge1xyXG4gICAgcmV0dXJuIHZlYzModGhpcy54IC8gbiwgdGhpcy55IC8gbiwgdGhpcy56IC8gbik7XHJcbiAgfVxyXG4gIC8qIE5lZ2F0aXZlIHZlY3RvciBmdW5jdGlvbiAqL1xyXG4gIG5lZ2F0aXZlKCkge1xyXG4gICAgcmV0dXJuIHZlYzMoLXRoaXMueCwgLXRoaXMueSwgLXRoaXMueik7XHJcbiAgfVxyXG4gIC8qIERvdCBwcm9kdWN0b2YgdmVjdG9ycyBmdW5jdGlvbiAqL1xyXG4gIGRvdCh2ZWMpIHtcclxuICAgIHJldHVybiB0aGlzLnggKiB2ZWMueCArIHRoaXMueSAqIHZlYy55ICsgdGhpcy56ICogdmVjLno7XHJcbiAgfVxyXG4gIC8qIENyb3NzIHByb2R1Y3Qgb2YgdmVjdG9ycyBmdW5jdGlvbiAqL1xyXG4gIGNyb3NzKHZlYykge1xyXG4gICAgcmV0dXJuIHZlYzMoXHJcbiAgICAgIHRoaXMueSAqIHZlYy56IC0gdGhpcy56ICogdmVjLnksXHJcbiAgICAgIC0odGhpcy54ICogdmVjLnogLSB0aGlzLnogKiB2ZWMueCksXHJcbiAgICAgIHRoaXMueCAqIHZlYy55IC0gdGhpcy55ICogdmVjLnhcclxuICAgICk7XHJcbiAgfVxyXG4gIC8qIENvdW50IGxlbmdodCBvZiB2ZWN0b3IgZnVuY3Rpb24gKi9cclxuICBsZW4oKSB7XHJcbiAgICBsZXQgbGVuZ3RoID0gdGhpcy5kb3QodGhpcyk7XHJcblxyXG4gICAgaWYgKGxlbmd0aCA9PSAxIHx8IGxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHJldHVybiBsZW5ndGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGxlbmd0aCk7XHJcbiAgfVxyXG4gIC8qIE5vcm1hbGl6ZSB2ZWN0b3IgZnVuY3Rpb24gKi9cclxuICBub3JtYWxpemUoKSB7XHJcbiAgICBsZXQgbGVuZ3RoID0gdGhpcy5kb3QodGhpcyk7XHJcblxyXG4gICAgaWYgKGxlbmd0aCA9PSAxIHx8IGxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHJldHVybiB2ZWMzKHRoaXMpO1xyXG4gICAgfVxyXG4gICAgbGVuZ3RoID0gTWF0aC5zcXJ0KGxlbmd0aCk7XHJcbiAgICByZXR1cm4gdmVjMyh0aGlzLnggLyBsZW5ndGgsIHRoaXMueSAvIGxlbmd0aCwgdGhpcy56IC8gbGVuZ3RoKTtcclxuICB9XHJcbiAgLyogVHJhbnNmb3JtIHBvaW50IG9mIHZlY3RvciBmdW5jdGlvbiAqL1xyXG4gIHRyYW5zZm9ybShtYXQpIHtcclxuICAgIHJldHVybiB2ZWMzKFxyXG4gICAgICB0aGlzLnggKiBtYXQuYVswXVswXSArXHJcbiAgICAgICAgdGhpcy55ICogbWF0LmFbMV1bMF0gK1xyXG4gICAgICAgIHRoaXMueiAqIG1hdC5hWzJdWzBdICtcclxuICAgICAgICBtYXQuYVszXVswXSxcclxuICAgICAgdGhpcy54ICogbWF0LmFbMF1bMV0gK1xyXG4gICAgICAgIHRoaXMueSAqIG1hdC5hWzFdWzFdICtcclxuICAgICAgICB0aGlzLnogKiBtYXQuYVsyXVsxXSArXHJcbiAgICAgICAgbWF0LmFbM11bMV0sXHJcbiAgICAgIHRoaXMueCAqIG1hdC5hWzBdWzJdICtcclxuICAgICAgICB0aGlzLnkgKiBtYXQuYVsxXVsyXSArXHJcbiAgICAgICAgdGhpcy56ICogbWF0LmFbMl1bMl0gK1xyXG4gICAgICAgIG1hdFszXVszXVxyXG4gICAgKTtcclxuICB9XHJcbiAgLyogVHJhbnNmb3JtIHZlY3RvciBmdW5jdGlvbiAqL1xyXG4gIHRyYW5zZm9ybShtYXQpIHtcclxuICAgIHJldHVybiB2ZWMzKFxyXG4gICAgICB0aGlzLnggKiBtYXQuYVswXVswXSArIHRoaXMueSAqIG1hdC5hWzFdWzBdICsgdGhpcy56ICogbWF0LmFbMl1bMF0sXHJcbiAgICAgIHRoaXMueCAqIG1hdC5hWzBdWzFdICsgdGhpcy55ICogbWF0LmFbMV1bMV0gKyB0aGlzLnogKiBtYXQuYVsyXVsxXSxcclxuICAgICAgdGhpcy54ICogbWF0LmFbMF1bMl0gKyB0aGlzLnkgKiBtYXQuYVsxXVsyXSArIHRoaXMueiAqIG1hdC5hWzJdWzJdXHJcbiAgICApO1xyXG4gIH1cclxuICAvKiBWZWN0b3IgYnkgbWF0cml4IG11bHRpcGxpY2F0aW9uICh3aXRoIGhvbW9nZW5pb3VzIGRldmlkZSkgZnVuY3Rpb24gKi9cclxuICB2ZWNNdWxNYXRyKG1hdCkge1xyXG4gICAgbGV0IHcgPVxyXG4gICAgICB0aGlzLnggKiBtYXQuYVswXVszXSArXHJcbiAgICAgIHRoaXMueSAqIG1hdC5hWzFdWzNdICtcclxuICAgICAgdGhpcy56ICogbWF0LmFbMl1bM10gK1xyXG4gICAgICBtYXQuYVszXVszXTtcclxuXHJcbiAgICByZXR1cm4gdmVjMyhcclxuICAgICAgKHRoaXMueCAqIG1hdC5hWzBdWzBdICtcclxuICAgICAgICB0aGlzLnkgKiBtYXQuYVsxXVswXSArXHJcbiAgICAgICAgdGhpcy56ICogbWF0LmFbMl1bMF0gK1xyXG4gICAgICAgIG1hdC5hWzNdWzBdKSAvXHJcbiAgICAgICAgdyxcclxuICAgICAgKHRoaXMueCAqIG1hdC5hWzBdWzFdICtcclxuICAgICAgICB0aGlzLnkgKiBtYXQuYVsxXVsxXSArXHJcbiAgICAgICAgdGhpcy56ICogbWF0LmFbMl1bMV0gK1xyXG4gICAgICAgIG1hdC5hWzNdWzFdKSAvXHJcbiAgICAgICAgdyxcclxuICAgICAgKHRoaXMueCAqIG1hdC5hWzBdWzJdICtcclxuICAgICAgICB0aGlzLnkgKiBtYXQuYVsxXVsyXSArXHJcbiAgICAgICAgdGhpcy56ICogbWF0LmFbMl1bMl0gK1xyXG4gICAgICAgIG1hdC5hWzNdWzJdKSAvXHJcbiAgICAgICAgd1xyXG4gICAgKTtcclxuICB9XHJcbiAgLyogUmVzZXQgdmVjdG9yIHRvIGFycmF5IGZ1bmN0aW9ucyAqL1xyXG4gIHRvQXJyYXkoKSB7XHJcbiAgICByZXR1cm4gW3RoaXMueCwgdGhpcy55LCB0aGlzLnpdO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZlYzMoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX3ZlYzMoLi4uYXJncyk7XHJcbn1cclxuLypcclxubGV0IHYxID0gbmV3IHZlYzMoMCwgMCwgMCk7XHJcbmxldCB2MiA9IG5ldyB2ZWMzKDUsIDYsIDcpO1xyXG5sZXQgdjMgPSBuZXcgdmVjMyg4LCA5LCAxMCk7XHJcbmxldCB2NCA9IG5ldyB2ZWMzKDExLCAxMiwgMTMpO1xyXG5sZXQgdjUgPSBuZXcgdmVjMygxNCwgMTUsIDE2KTtcclxubGV0IHY2ID0gbmV3IHZlYzMoMTcsIDE4LCAxOSk7XHJcblxyXG5jb25zb2xlLmxvZyh2MS5kb3QodjIpKTtcclxuY29uc29sZS5sb2codjEuc3ViKHYyKSk7XHJcbmNvbnNvbGUubG9nKHY2Lm5lZ2F0aXZlKCkpO1xyXG5jb25zb2xlLmxvZyh2MS5kaXZOdW0oMikpO1xyXG5jb25zb2xlLmxvZyh2MS5sZW4oKSk7XHJcbmNvbnNvbGUubG9nKHYzLm5vcm1hbGl6ZSgpKTtcclxuKi9cclxuXHJcbi8qIEVORCBPRiAndmVjMy5qcycgRklMRSAqL1xyXG4iLCIvKiBGSUxFIE5BTUU6IG1hdHI0LmpzXHJcbiAqIFBST0dSQU1NRVI6IEFHMlxyXG4gKiBMQVNUIFVQREFURTogMDYuMDYuMjAyM1xyXG4gKiBQVVJQT1NFOiAzRCBtYXRoIG1hdHJpeCBpbXBsZW1lbnRhdGlvbiBtb2R1bGUuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgdmVjMyB9IGZyb20gXCIuL3ZlYzMuanNcIjtcclxuZXhwb3J0IHsgdmVjMyB9O1xyXG5cclxuLyoqKlxyXG4gKiBVc2VmdWwgY29uc3RhbnRzIGFuZCBmdW5jdGlvbnNcclxuICoqKi9cclxuXHJcbi8qIFBJIG1hdGggY29uc3RhbnQgKi9cclxuY29uc3QgUEkgPSAzLjE0MTU5MjY1MzU4OTc5MzIzODQ2O1xyXG5cclxuLyogRGVncmVlcyB0byByYWRpYW5zIGNvbnZlcnNpb24gKi9cclxuY29uc3QgRGVncmVlMlJhZGlhbiA9IChhbHBoYSkgPT4ge1xyXG4gIHJldHVybiBhbHBoYSAqIChQSSAvIDE4MC4wKTtcclxufTtcclxuLyogUmFkaWFucyB0byBkZWdyZWVzIGNvbnZlcnNpb24gKi9cclxuY29uc3QgUmFkaWFuMkRlZ3JlZSA9IChhbHBoYSkgPT4ge1xyXG4gIHJldHVybiBhbHBoYSAqICgxODAuMCAvIFBJKTtcclxufTtcclxuXHJcbi8qIFNpbnVzIG1hdGggb3BlcmF0aW9uIChpbiByYWRpYW5zKSAqL1xyXG5jb25zdCBzaW4gPSAoYWxwaGEpID0+IHtcclxuICByZXR1cm4gTWF0aC5zaW4oYWxwaGEpO1xyXG59O1xyXG4vKiBDb3NpbnVzIG1hdGggb3BlcmF0aW9uIChpbiByYWRpYW5zKSAqL1xyXG5jb25zdCBjb3MgPSAoYWxwaGEpID0+IHtcclxuICByZXR1cm4gTWF0aC5jb3MoYWxwaGEpO1xyXG59O1xyXG5cclxuLyoqKlxyXG4gKiBNYXRyaXggbW9kdWxlXHJcbiAqKiovXHJcblxyXG4vKiBNYXRyaXggcmVwcmVzZW50YXRpb24gdHlwZSAqL1xyXG5jbGFzcyBfbWF0NCB7XHJcbiAgYWRkTWV0aG9kKG9iaiwgbmFtZSwgZnVuYykge1xyXG4gICAgdmFyIG9sZCA9IG9ialtuYW1lXTtcclxuXHJcbiAgICBvYmpbbmFtZV0gPSAoLi4uYXJncykgPT4ge1xyXG4gICAgICBpZiAoZnVuYy5sZW5ndGggPT0gYXJncy5sZW5ndGgpIHtcclxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseShvYmosIGFyZ3MpO1xyXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvbGQgPT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgcmV0dXJuIG9sZC5hcHBseShvYmosIGFyZ3MpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IoYSA9IG51bGwpIHtcclxuICAgIGlmIChhID09IG51bGwpIHtcclxuICAgICAgdGhpcy5hID0gW1xyXG4gICAgICAgIFsxLCAwLCAwLCAwXSxcclxuICAgICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgICAgXTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGEgPT0gXCJvYmplY3RcIiAmJiBhLmxlbmd0aCA9PSA0KSB7XHJcbiAgICAgIHRoaXMuYSA9IGE7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmEgPSBhLmE7XHJcbiAgICB9XHJcbiAgICB0aGlzLmFkZE1ldGhvZCh0aGlzLCBcInNldFRyYW5zbGF0ZVwiLCAoZHgsIGR5LCBkeikgPT4ge1xyXG4gICAgICB0aGlzLmEgPSBbXHJcbiAgICAgICAgWzEsIDAsIDAsIDBdLFxyXG4gICAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgICAgW2R4LCBkeSwgZHosIDFdLFxyXG4gICAgICBdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0pO1xyXG4gICAgdGhpcy5hZGRNZXRob2QodGhpcywgXCJzZXRUcmFuc2xhdGVcIiwgKHYpID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0VHJhbnNsYXRlKHYueCwgdi55LCB2LnopO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmFkZE1ldGhvZCh0aGlzLCBcInRyYW5zbGF0ZVwiLCAoZHgsIGR5LCBkeikgPT4ge1xyXG4gICAgICB0aGlzLm11bChbXHJcbiAgICAgICAgWzEsIDAsIDAsIDBdLFxyXG4gICAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgICBbMCwgMCwgMSwgMF0sXHJcbiAgICAgICAgW2R4LCBkeSwgZHosIDFdLFxyXG4gICAgICBdKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuYWRkTWV0aG9kKHRoaXMsIFwidHJhbnNsYXRlXCIsICh2KSA9PiB7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyYW5zbGF0ZSh2LngsIHYueSwgdi56KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qIFNjYWxlIGZ1bmN0aW9ucyAqL1xyXG4gICAgdGhpcy5hZGRNZXRob2QodGhpcywgXCJzZXRTY2FsZVwiLCAoc3gsIHN5LCBzeikgPT4ge1xyXG4gICAgICB0aGlzLm0gPSBbXHJcbiAgICAgICAgW3N4LCAwLCAwLCAwXSxcclxuICAgICAgICBbMCwgc3ksIDAsIDBdLFxyXG4gICAgICAgIFswLCAwLCBzeiwgMF0sXHJcbiAgICAgICAgWzAsIDAsIDAsIDFdLFxyXG4gICAgICBdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0pO1xyXG4gICAgdGhpcy5hZGRNZXRob2QodGhpcywgXCJzZXRTY2FsZVwiLCAodikgPT4ge1xyXG4gICAgICBpZiAodHlwZW9mIHYgPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldFNjYWxlKHYueCwgdi55LCB2LnopO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLnNldFNjYWxlKHYsIHYsIHYpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmFkZE1ldGhvZCh0aGlzLCBcInNjYWxlXCIsIChzeCwgc3ksIHN6KSA9PiB7XHJcbiAgICAgIHRoaXMubXVsKFtcclxuICAgICAgICBbc3gsIDAsIDAsIDBdLFxyXG4gICAgICAgIFswLCBzeSwgMCwgMF0sXHJcbiAgICAgICAgWzAsIDAsIHN6LCAwXSxcclxuICAgICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICAgIF0pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0pO1xyXG4gICAgdGhpcy5hZGRNZXRob2QodGhpcywgXCJzY2FsZVwiLCAodikgPT4ge1xyXG4gICAgICBpZiAodHlwZW9mIHYgPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNjYWxlKHYueCwgdi55LCB2LnopO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLnNjYWxlKHYsIHYsIHYpO1xyXG4gICAgfSk7XHJcbiAgfSAvLyBFbmQgb2YgJ2NvbnN0cnVjdG9yJyBmdW5jdGlvblxyXG5cclxuICBzZXRSb3RhdGUoQW5nbGVJbkRlZ3JlZSwgUikge1xyXG4gICAgbGV0IGEgPSBBbmdsZUluRGVncmVlICogTWF0aC5QSSxcclxuICAgICAgc2luZSA9IE1hdGguc2luKGEpLFxyXG4gICAgICBjb3NpbmUgPSBNYXRoLmNvcyhhKTtcclxuICAgIGxldCB4ID0gMCxcclxuICAgICAgeSA9IDAsXHJcbiAgICAgIHogPSAxO1xyXG4gICAgaWYgKHR5cGVvZiBSID09IFwib2JqZWN0XCIpIHtcclxuICAgICAgaWYgKFIubGVuZ3RoID09IDMpIHtcclxuICAgICAgICB4ID0gUlswXTtcclxuICAgICAgICB5ID0gUlsxXTtcclxuICAgICAgICB6ID0gUlsyXTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB4ID0gUi54O1xyXG4gICAgICAgIHkgPSBSLnk7XHJcbiAgICAgICAgeiA9IFIuejtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gVmVjdG9yIG5vcm1hbGl6ZVxyXG4gICAgbGV0IGxlbiA9IHggKiB4ICsgeSAqIHkgKyB6ICogejtcclxuICAgIGlmIChsZW4gIT0gMCAmJiBsZW4gIT0gMSkge1xyXG4gICAgICBsZW4gPSBNYXRoLnNxcnQobGVuKTtcclxuICAgICAgeCAvPSBsZW47XHJcbiAgICAgIHkgLz0gbGVuO1xyXG4gICAgICB6IC89IGxlbjtcclxuICAgIH1cclxuICAgIHRoaXMuYVswXVswXSA9IGNvc2luZSArIHggKiB4ICogKDEgLSBjb3NpbmUpO1xyXG4gICAgdGhpcy5hWzBdWzFdID0geCAqIHkgKiAoMSAtIGNvc2luZSkgKyB6ICogc2luZTtcclxuICAgIHRoaXMuYVswXVsyXSA9IHggKiB6ICogKDEgLSBjb3NpbmUpIC0geSAqIHNpbmU7XHJcbiAgICB0aGlzLmFbMF1bM10gPSAwO1xyXG4gICAgdGhpcy5hWzFdWzBdID0geSAqIHggKiAoMSAtIGNvc2luZSkgLSB6ICogc2luZTtcclxuICAgIHRoaXMuYVsxXVsxXSA9IGNvc2luZSArIHkgKiB5ICogKDEgLSBjb3NpbmUpO1xyXG4gICAgdGhpcy5hWzFdWzJdID0geSAqIHogKiAoMSAtIGNvc2luZSkgKyB4ICogc2luZTtcclxuICAgIHRoaXMuYVsxXVszXSA9IDA7XHJcbiAgICB0aGlzLmFbMl1bMF0gPSB6ICogeCAqICgxIC0gY29zaW5lKSArIHkgKiBzaW5lO1xyXG4gICAgdGhpcy5hWzJdWzFdID0geiAqIHkgKiAoMSAtIGNvc2luZSkgLSB4ICogc2luZTtcclxuICAgIHRoaXMuYVsyXVsyXSA9IGNvc2luZSArIHogKiB6ICogKDEgLSBjb3NpbmUpO1xyXG4gICAgdGhpcy5hWzJdWzNdID0gMDtcclxuICAgIHRoaXMuYVszXVswXSA9IDA7XHJcbiAgICB0aGlzLmFbM11bMV0gPSAwO1xyXG4gICAgdGhpcy5hWzNdWzJdID0gMDtcclxuICAgIHRoaXMuYVszXVszXSA9IDE7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHJvdGF0ZShBbmdsZUluRGVncmVlLCBSKSB7XHJcbiAgICByZXR1cm4gdGhpcy5tdWwobWF0NCgpLnNldFJvdGF0ZShBbmdsZUluRGVncmVlLCBSKSk7XHJcbiAgfVxyXG5cclxuICB0cmFuc3Bvc2UoKSB7XHJcbiAgICBsZXQgciA9IFtbXSwgW10sIFtdLCBbXV07XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcclxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCA0OyBqKyspIHtcclxuICAgICAgICByW2ldW2pdID0gdGhpcy5hW2pdW2ldO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWF0NChyKTtcclxuICB9XHJcblxyXG4gIG11bChhKSB7XHJcbiAgICBsZXQgbWF0cjtcclxuICAgIGlmIChhLmxlbmd0aCA9PSA0KSB7XHJcbiAgICAgIG1hdHIgPSBhO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbWF0ciA9IGEuYTtcclxuICAgIH1cclxuICAgIHRoaXMuYSA9IFtcclxuICAgICAgW1xyXG4gICAgICAgIHRoaXMuYVswXVswXSAqIG1hdHJbMF1bMF0gK1xyXG4gICAgICAgICAgdGhpcy5hWzBdWzFdICogbWF0clsxXVswXSArXHJcbiAgICAgICAgICB0aGlzLmFbMF1bMl0gKiBtYXRyWzJdWzBdICtcclxuICAgICAgICAgIHRoaXMuYVswXVszXSAqIG1hdHJbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdICogbWF0clswXVsxXSArXHJcbiAgICAgICAgICB0aGlzLmFbMF1bMV0gKiBtYXRyWzFdWzFdICtcclxuICAgICAgICAgIHRoaXMuYVswXVsyXSAqIG1hdHJbMl1bMV0gK1xyXG4gICAgICAgICAgdGhpcy5hWzBdWzNdICogbWF0clszXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMF0gKiBtYXRyWzBdWzJdICtcclxuICAgICAgICAgIHRoaXMuYVswXVsxXSAqIG1hdHJbMV1bMl0gK1xyXG4gICAgICAgICAgdGhpcy5hWzBdWzJdICogbWF0clsyXVsyXSArXHJcbiAgICAgICAgICB0aGlzLmFbMF1bM10gKiBtYXRyWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVswXSAqIG1hdHJbMF1bM10gK1xyXG4gICAgICAgICAgdGhpcy5hWzBdWzFdICogbWF0clsxXVszXSArXHJcbiAgICAgICAgICB0aGlzLmFbMF1bMl0gKiBtYXRyWzJdWzNdICtcclxuICAgICAgICAgIHRoaXMuYVswXVszXSAqIG1hdHJbM11bM10sXHJcbiAgICAgIF0sXHJcbiAgICAgIFtcclxuICAgICAgICB0aGlzLmFbMV1bMF0gKiBtYXRyWzBdWzBdICtcclxuICAgICAgICAgIHRoaXMuYVsxXVsxXSAqIG1hdHJbMV1bMF0gK1xyXG4gICAgICAgICAgdGhpcy5hWzFdWzJdICogbWF0clsyXVswXSArXHJcbiAgICAgICAgICB0aGlzLmFbMV1bM10gKiBtYXRyWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSAqIG1hdHJbMF1bMV0gK1xyXG4gICAgICAgICAgdGhpcy5hWzFdWzFdICogbWF0clsxXVsxXSArXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMl0gKiBtYXRyWzJdWzFdICtcclxuICAgICAgICAgIHRoaXMuYVsxXVszXSAqIG1hdHJbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdICogbWF0clswXVsyXSArXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMV0gKiBtYXRyWzFdWzJdICtcclxuICAgICAgICAgIHRoaXMuYVsxXVsyXSAqIG1hdHJbMl1bMl0gK1xyXG4gICAgICAgICAgdGhpcy5hWzFdWzNdICogbWF0clszXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bMF0gKiBtYXRyWzBdWzNdICtcclxuICAgICAgICAgIHRoaXMuYVsxXVsxXSAqIG1hdHJbMV1bM10gK1xyXG4gICAgICAgICAgdGhpcy5hWzFdWzJdICogbWF0clsyXVszXSArXHJcbiAgICAgICAgICB0aGlzLmFbMV1bM10gKiBtYXRyWzNdWzNdLFxyXG4gICAgICBdLFxyXG4gICAgICBbXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdICogbWF0clswXVswXSArXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMV0gKiBtYXRyWzFdWzBdICtcclxuICAgICAgICAgIHRoaXMuYVsyXVsyXSAqIG1hdHJbMl1bMF0gK1xyXG4gICAgICAgICAgdGhpcy5hWzJdWzNdICogbWF0clszXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0gKiBtYXRyWzBdWzFdICtcclxuICAgICAgICAgIHRoaXMuYVsyXVsxXSAqIG1hdHJbMV1bMV0gK1xyXG4gICAgICAgICAgdGhpcy5hWzJdWzJdICogbWF0clsyXVsxXSArXHJcbiAgICAgICAgICB0aGlzLmFbMl1bM10gKiBtYXRyWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSAqIG1hdHJbMF1bMl0gK1xyXG4gICAgICAgICAgdGhpcy5hWzJdWzFdICogbWF0clsxXVsyXSArXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMl0gKiBtYXRyWzJdWzJdICtcclxuICAgICAgICAgIHRoaXMuYVsyXVszXSAqIG1hdHJbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdICogbWF0clswXVszXSArXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMV0gKiBtYXRyWzFdWzNdICtcclxuICAgICAgICAgIHRoaXMuYVsyXVsyXSAqIG1hdHJbMl1bM10gK1xyXG4gICAgICAgICAgdGhpcy5hWzJdWzNdICogbWF0clszXVszXSxcclxuICAgICAgXSxcclxuICAgICAgW1xyXG4gICAgICAgIHRoaXMuYVszXVswXSAqIG1hdHJbMF1bMF0gK1xyXG4gICAgICAgICAgdGhpcy5hWzNdWzFdICogbWF0clsxXVswXSArXHJcbiAgICAgICAgICB0aGlzLmFbM11bMl0gKiBtYXRyWzJdWzBdICtcclxuICAgICAgICAgIHRoaXMuYVszXVszXSAqIG1hdHJbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdICogbWF0clswXVsxXSArXHJcbiAgICAgICAgICB0aGlzLmFbM11bMV0gKiBtYXRyWzFdWzFdICtcclxuICAgICAgICAgIHRoaXMuYVszXVsyXSAqIG1hdHJbMl1bMV0gK1xyXG4gICAgICAgICAgdGhpcy5hWzNdWzNdICogbWF0clszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0gKiBtYXRyWzBdWzJdICtcclxuICAgICAgICAgIHRoaXMuYVszXVsxXSAqIG1hdHJbMV1bMl0gK1xyXG4gICAgICAgICAgdGhpcy5hWzNdWzJdICogbWF0clsyXVsyXSArXHJcbiAgICAgICAgICB0aGlzLmFbM11bM10gKiBtYXRyWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSAqIG1hdHJbMF1bM10gK1xyXG4gICAgICAgICAgdGhpcy5hWzNdWzFdICogbWF0clsxXVszXSArXHJcbiAgICAgICAgICB0aGlzLmFbM11bMl0gKiBtYXRyWzJdWzNdICtcclxuICAgICAgICAgIHRoaXMuYVszXVszXSAqIG1hdHJbM11bM10sXHJcbiAgICAgIF0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBkZXRlcm0zeDMoQTExLCBBMTIsIEExMywgQTIxLCBBMjIsIEEyMywgQTMxLCBBMzIsIEEzMykge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgQTExICogQTIyICogQTMzIC1cclxuICAgICAgQTExICogQTIzICogQTMyIC1cclxuICAgICAgQTEyICogQTIxICogQTMzICtcclxuICAgICAgQTEyICogQTIzICogQTMxICtcclxuICAgICAgQTEzICogQTIxICogQTMyIC1cclxuICAgICAgQTEzICogQTIyICogQTMxXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgZGV0ZXJtKCkge1xyXG4gICAgbGV0IGRldCA9XHJcbiAgICAgIHRoaXMuYVswXVswXSAqXHJcbiAgICAgICAgdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgICApIC1cclxuICAgICAgdGhpcy5hWzBdWzFdICpcclxuICAgICAgICB0aGlzLmRldGVybTN4MyhcclxuICAgICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICAgICkgK1xyXG4gICAgICB0aGlzLmFbMF1bMl0gKlxyXG4gICAgICAgIHRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgICAgdGhpcy5hWzJdWzNdLFxyXG4gICAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICAgKSAtXHJcbiAgICAgIHRoaXMuYVswXVszXSAqXHJcbiAgICAgICAgdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgICApO1xyXG5cclxuICAgIHJldHVybiBkZXQ7XHJcbiAgfVxyXG5cclxuICBpbnZlcnNlKCkge1xyXG4gICAgbGV0IHIgPSBbW10sIFtdLCBbXSwgW11dO1xyXG4gICAgbGV0IGRldCA9IHRoaXMuZGV0ZXJtKCk7XHJcblxyXG4gICAgaWYgKGRldCA9PSAwKSB7XHJcbiAgICAgIGxldCBhID0gW1xyXG4gICAgICAgIFsxLCAwLCAwLCAwXSxcclxuICAgICAgICBbMCwgMSwgMCwgMF0sXHJcbiAgICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICAgIFswLCAwLCAwLCAxXSxcclxuICAgICAgXTtcclxuXHJcbiAgICAgIHJldHVybiBtYXQ0KGEpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qIEJ1aWxkIGFkam9pbnQgbWF0cml4ICovXHJcbiAgICByWzBdWzBdID1cclxuICAgICAgdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuICAgIHJbMV1bMF0gPVxyXG4gICAgICAtdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuICAgIHJbMl1bMF0gPVxyXG4gICAgICB0aGlzLmRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG4gICAgclszXVswXSA9XHJcbiAgICAgIC10aGlzLmRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMV1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXVxyXG4gICAgICApIC8gZGV0O1xyXG5cclxuICAgIHJbMF1bMV0gPVxyXG4gICAgICAtdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVsyXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsyXSxcclxuICAgICAgICB0aGlzLmFbMl1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVsyXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuICAgIHJbMV1bMV0gPVxyXG4gICAgICB0aGlzLmRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG4gICAgclsyXVsxXSA9XHJcbiAgICAgIC10aGlzLmRldGVybTN4MyhcclxuICAgICAgICB0aGlzLmFbMF1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzFdLFxyXG4gICAgICAgIHRoaXMuYVswXVszXSxcclxuICAgICAgICB0aGlzLmFbMl1bMF0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzFdLFxyXG4gICAgICAgIHRoaXMuYVsyXVszXSxcclxuICAgICAgICB0aGlzLmFbM11bMF0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICAgIHRoaXMuYVszXVszXVxyXG4gICAgICApIC8gZGV0O1xyXG4gICAgclszXVsxXSA9XHJcbiAgICAgIHRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzJdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzJdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMV0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzJdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgclswXVsyXSA9XHJcbiAgICAgIHRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcbiAgICByWzFdWzJdID1cclxuICAgICAgLXRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgICB0aGlzLmFbM11bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcbiAgICByWzJdWzJdID1cclxuICAgICAgdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bM10sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bM10sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bM11cclxuICAgICAgKSAvIGRldDtcclxuICAgIHJbM11bMl0gPVxyXG4gICAgICAtdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzNdWzBdLFxyXG4gICAgICAgIHRoaXMuYVszXVsxXSxcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICAgKSAvIGRldDtcclxuXHJcbiAgICByWzBdWzNdID1cclxuICAgICAgLXRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcblxyXG4gICAgclsxXVszXSA9XHJcbiAgICAgIHRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcbiAgICByWzJdWzNdID1cclxuICAgICAgLXRoaXMuZGV0ZXJtM3gzKFxyXG4gICAgICAgIHRoaXMuYVswXVswXSxcclxuICAgICAgICB0aGlzLmFbMF1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzBdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsxXVswXSxcclxuICAgICAgICB0aGlzLmFbMV1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzNdLFxyXG4gICAgICAgIHRoaXMuYVsyXVswXSxcclxuICAgICAgICB0aGlzLmFbMl1bMV0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzNdXHJcbiAgICAgICkgLyBkZXQ7XHJcbiAgICByWzNdWzNdID1cclxuICAgICAgdGhpcy5kZXRlcm0zeDMoXHJcbiAgICAgICAgdGhpcy5hWzBdWzBdLFxyXG4gICAgICAgIHRoaXMuYVswXVsxXSxcclxuICAgICAgICB0aGlzLmFbMF1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzFdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsxXVsxXSxcclxuICAgICAgICB0aGlzLmFbMV1bMl0sXHJcbiAgICAgICAgdGhpcy5hWzJdWzBdLFxyXG4gICAgICAgIHRoaXMuYVsyXVsxXSxcclxuICAgICAgICB0aGlzLmFbMl1bMl1cclxuICAgICAgKSAvIGRldDtcclxuICAgIHRoaXMubSA9IHI7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHNldElkZW50aXR5KCkge1xyXG4gICAgdGhpcy5hID0gW1xyXG4gICAgICBbMSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAxLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIDEsIDBdLFxyXG4gICAgICBbMCwgMCwgMCwgMV0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBzZXRWaWV3KExvYywgQXQsIFVwMSkge1xyXG4gICAgbGV0IERpciA9IEF0LnN1YihMb2MpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICBSaWdodCA9IERpci5jcm9zcyhVcDEpLm5vcm1hbGl6ZSgpLFxyXG4gICAgICBVcCA9IFJpZ2h0LmNyb3NzKERpcikubm9ybWFsaXplKCk7XHJcbiAgICB0aGlzLmEgPSBbXHJcbiAgICAgIFtSaWdodC54LCBVcC54LCAtRGlyLngsIDBdLFxyXG4gICAgICBbUmlnaHQueSwgVXAueSwgLURpci55LCAwXSxcclxuICAgICAgW1JpZ2h0LnosIFVwLnosIC1EaXIueiwgMF0sXHJcbiAgICAgIFstTG9jLmRvdChSaWdodCksIC1Mb2MuZG90KFVwKSwgTG9jLmRvdChEaXIpLCAxXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHNldE9ydGhvKExlZnQsIFJpZ2h0LCBCb3R0b20sIFRvcCwgTmVhciwgRmFyKSB7XHJcbiAgICB0aGlzLmEgPSBbXHJcbiAgICAgIFsyIC8gKFJpZ2h0IC0gTGVmdCksIDAsIDAsIDBdLFxyXG4gICAgICBbMCwgMiAvIChUb3AgLSBCb3R0b20pLCAwLCAwXSxcclxuICAgICAgWzAsIDAsIC0yIC8gKEZhciAtIE5lYXIpLCAwXSxcclxuICAgICAgW1xyXG4gICAgICAgIC0oUmlnaHQgKyBMZWZ0KSAvIChSaWdodCAtIExlZnQpLFxyXG4gICAgICAgIC0oVG9wICsgQm90dG9tKSAvIChUb3AgLSBCb3R0b20pLFxyXG4gICAgICAgIC0oRmFyICsgTmVhcikgLyAoRmFyIC0gTmVhciksXHJcbiAgICAgICAgMSxcclxuICAgICAgXSxcclxuICAgIF07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHNldEZydXN0dW0oTGVmdCwgUmlnaHQsIEJvdHRvbSwgVG9wLCBOZWFyLCBGYXIpIHtcclxuICAgIHRoaXMuYSA9IFtcclxuICAgICAgWygyICogTmVhcikgLyAoUmlnaHQgLSBMZWZ0KSwgMCwgMCwgMF0sXHJcbiAgICAgIFswLCAoMiAqIE5lYXIpIC8gKFRvcCAtIEJvdHRvbSksIDAsIDBdLFxyXG4gICAgICBbXHJcbiAgICAgICAgKFJpZ2h0ICsgTGVmdCkgLyAoUmlnaHQgLSBMZWZ0KSxcclxuICAgICAgICAoVG9wICsgQm90dG9tKSAvIChUb3AgLSBCb3R0b20pLFxyXG4gICAgICAgIC0oRmFyICsgTmVhcikgLyAoRmFyIC0gTmVhciksXHJcbiAgICAgICAgLTEsXHJcbiAgICAgIF0sXHJcbiAgICAgIFswLCAwLCAoLTIgKiBOZWFyICogRmFyKSAvIChGYXIgLSBOZWFyKSwgMF0sXHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICB2aWV3KExvYywgQXQsIFVwMSkge1xyXG4gICAgcmV0dXJuIHRoaXMubXVsKG1hdDQoKS5zZXRWaWV3KExvYywgQXQsIFVwMSkpO1xyXG4gIH1cclxuXHJcbiAgb3J0aG8oTGVmdCwgUmlnaHQsIEJvdHRvbSwgVG9wLCBOZWFyLCBGYXIpIHtcclxuICAgIHJldHVybiB0aGlzLm11bChtYXQ0KCkuc2V0T3J0aG8oTGVmdCwgUmlnaHQsIEJvdHRvbSwgVG9wLCBOZWFyLCBGYXIpKTtcclxuICB9XHJcblxyXG4gIGZydXN0dW0oTGVmdCwgUmlnaHQsIEJvdHRvbSwgVG9wLCBOZWFyLCBGYXIpIHtcclxuICAgIHJldHVybiB0aGlzLm11bChtYXQ0KCkuc2V0RnJ1c3R1bShMZWZ0LCBSaWdodCwgQm90dG9tLCBUb3AsIE5lYXIsIEZhcikpO1xyXG4gIH1cclxuXHJcbiAgdHJhbnNmb3JtKFYpIHtcclxuICAgIGxldCB3ID1cclxuICAgICAgVi54ICogdGhpcy5tWzBdWzNdICtcclxuICAgICAgVi55ICogdGhpcy5tWzFdWzNdICtcclxuICAgICAgVi56ICogdGhpcy5tWzJdWzNdICtcclxuICAgICAgdGhpcy5tWzNdWzNdO1xyXG5cclxuICAgIHJldHVybiB2ZWMzKFxyXG4gICAgICAoVi54ICogdGhpcy5tWzBdWzBdICtcclxuICAgICAgICBWLnkgKiB0aGlzLm1bMV1bMF0gK1xyXG4gICAgICAgIFYueiAqIHRoaXMubVsyXVswXSArXHJcbiAgICAgICAgdGhpcy5tWzNdWzBdKSAvXHJcbiAgICAgICAgdyxcclxuICAgICAgKFYueCAqIHRoaXMubVswXVsxXSArXHJcbiAgICAgICAgVi55ICogdGhpcy5tWzFdWzFdICtcclxuICAgICAgICBWLnogKiB0aGlzLm1bMl1bMV0gK1xyXG4gICAgICAgIHRoaXMubVszXVsxXSkgL1xyXG4gICAgICAgIHcsXHJcbiAgICAgIChWLnggKiB0aGlzLm1bMF1bMl0gK1xyXG4gICAgICAgIFYueSAqIHRoaXMubVsxXVsyXSArXHJcbiAgICAgICAgVi56ICogdGhpcy5tWzJdWzJdICtcclxuICAgICAgICB0aGlzLm1bM11bMl0pIC9cclxuICAgICAgICB3XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdHJhbnNmb3JtVmVjdG9yKFYpIHtcclxuICAgIHJldHVybiB2ZWMzKFxyXG4gICAgICBWLnggKiB0aGlzLmFbMF1bMF0gKyBWLnkgKiB0aGlzLmFbMV1bMF0gKyBWLnogKiB0aGlzLmFbMl1bMF0sXHJcbiAgICAgIFYueCAqIHRoaXMuYVswXVsxXSArIFYueSAqIHRoaXMuYVsxXVsxXSArIFYueiAqIHRoaXMuYVsyXVsxXSxcclxuICAgICAgVi54ICogdGhpcy5hWzBdWzJdICsgVi55ICogdGhpcy5hWzFdWzJdICsgVi56ICogdGhpcy5hWzJdWzJdXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdHJhbnNmb3JtUG9pbnQoVikge1xyXG4gICAgcmV0dXJuIHZlYzMoXHJcbiAgICAgIFYueCAqIHRoaXMuYVswXVswXSArXHJcbiAgICAgICAgVi55ICogdGhpcy5hWzFdWzBdICtcclxuICAgICAgICBWLnogKiB0aGlzLmFbMl1bMF0gK1xyXG4gICAgICAgIHRoaXMuYVszXVswXSxcclxuICAgICAgVi54ICogdGhpcy5hWzBdWzFdICtcclxuICAgICAgICBWLnkgKiB0aGlzLmFbMV1bMV0gK1xyXG4gICAgICAgIFYueiAqIHRoaXMuYVsyXVsxXSArXHJcbiAgICAgICAgdGhpcy5hWzNdWzFdLFxyXG4gICAgICBWLnggKiB0aGlzLmFbMF1bMl0gK1xyXG4gICAgICAgIFYueSAqIHRoaXMuYVsxXVsyXSArXHJcbiAgICAgICAgVi56ICogdGhpcy5hWzJdWzJdICtcclxuICAgICAgICB0aGlzLmFbM11bMl1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICB0b0FycmF5KCkge1xyXG4gICAgcmV0dXJuIFtdLmNvbmNhdCguLi50aGlzLmEpO1xyXG4gIH0gLy8gRW5kIG9mICd0b0FycmF5JyBmdW5jdGlvblxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWF0NCguLi5hcmdzKSB7XHJcbiAgcmV0dXJuIG5ldyBfbWF0NCguLi5hcmdzKTtcclxufVxyXG5cclxuLy8gTXVsdGlwbHkgdHdvIG1hdHJpeGVzIGZ1bmN0aW9uXHJcbmV4cG9ydCBmdW5jdGlvbiBNYXRyTXVsTWF0cjIobTEsIG0yKSB7XHJcbiAgcmV0dXJuIG1hdDQobTEpLm11bChtMik7XHJcbn1cclxuXHJcbi8qIEVORCBPRiAnbWF0cjQuanMnIEZJTEUgKi9cclxuIiwiLyogRklMRSBOQU1FOiBjYW1lcmEuanNcclxuICogUFJPR1JBTU1FUjogQUcyXHJcbiAqIExBU1QgVVBEQVRFOiAwNi4wNi4yMDIzXHJcbiAqIFBVUlBPU0U6IDNEIG1hdGggY2FtZXJhIGltcGxlbWVudGF0aW9uIG1vZHVsZS5cclxuICovXHJcblxyXG5pbXBvcnQgeyBtYXQ0LCB2ZWMzIH0gZnJvbSBcIi4vbWF0cjQuanNcIjtcclxuZXhwb3J0IHsgbWF0NCwgdmVjMyB9O1xyXG5cclxuY2xhc3MgX2NhbWVyYSB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAvLyBQcm9qZWN0aW9uIHByb3BlcnRpZXNcclxuICAgIHRoaXMucHJvalNpemUgPSAwLjE7IC8vIFByb2plY3QgcGxhbmUgZml0IHNxdWFyZVxyXG4gICAgdGhpcy5wcm9qRGlzdCA9IDAuMTsgLy8gRGlzdGFuY2UgdG8gcHJvamVjdCBwbGFuZSBmcm9tIHZpZXdlciAobmVhcilcclxuICAgIHRoaXMucHJvakZhckNsaXAgPSAyMDAwOyAvLyBEaXN0YW5jZSB0byBwcm9qZWN0IGZhciBjbGlwIHBsYW5lIChmYXIpXHJcblxyXG4gICAgLy8gTG9jYWwgc2l6ZSBkYXRhXHJcbiAgICB0aGlzLmZyYW1lVyA9IDMwOyAvLyBGcmFtZSB3aWR0aFxyXG4gICAgdGhpcy5mcmFtZUggPSAzMDsgLy8gRnJhbWUgaGVpZ2h0XHJcblxyXG4gICAgLy8gTWF0cmljZXNcclxuICAgIHRoaXMubWF0clZpZXcgPSBtYXQ0KCk7IC8vIFZpZXcgY29vcmRpbmF0ZSBzeXN0ZW0gbWF0cml4XHJcbiAgICB0aGlzLm1hdHJQcm9qID0gbWF0NCgpOyAvLyBQcm9qZWN0aW9uIGNvb3JkaW5hdGUgc3lzdGVtIG1hdHJpeFxyXG4gICAgdGhpcy5tYXRyVlAgPSBtYXQ0KCk7IC8vIFZpZXcgYW5kIHByb2plY3Rpb24gbWF0cml4IHByZWNhbGN1bGF0ZSB2YWx1ZVxyXG5cclxuICAgIC8vIFNldCBjYW1lcmEgZGVmYXVsdCBzZXR0aW5nc1xyXG4gICAgdGhpcy5sb2MgPSB2ZWMzKCk7IC8vIENhbWVyYSBsb2NhdGlvblxyXG4gICAgdGhpcy5hdCA9IHZlYzMoKTsgLy8gQ2FtZXJhIGRlc3RpbmF0aW9uXHJcbiAgICB0aGlzLmRpciA9IHZlYzMoKTsgLy8gQ2FtZXJhIERpcmVjdGlvblxyXG4gICAgdGhpcy51cCA9IHZlYzMoKTsgLy8gQ2FtZXJhIFVQIGRpcmVjdGlvblxyXG4gICAgdGhpcy5yaWdodCA9IHZlYzMoKTsgLy8gQ2FtZXJhIFJJR0hUIGRpcmVjdGlvblxyXG4gICAgdGhpcy5zZXREZWYoKTtcclxuICB9IC8vIEVuZCBvZiAnY29uc3RydWN0b3InIGZ1bmN0aW9uXHJcblxyXG4gIC8vIENhbWVyYSBwYXJtZXRlcnMgc2V0dGluZyBmdW5jdGlvblxyXG4gIHNldChsb2MsIGF0LCB1cCkge1xyXG4gICAgdGhpcy5tYXRyVmlldy5zZXRWaWV3KGxvYywgYXQsIHVwKTtcclxuICAgIHRoaXMubG9jID0gdmVjMyhsb2MpO1xyXG4gICAgdGhpcy5hdCA9IHZlYzMoYXQpO1xyXG4gICAgdGhpcy5kaXIuc2V0KFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzBdWzJdLFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzFdWzJdLFxyXG4gICAgICAtdGhpcy5tYXRyVmlldy5hWzJdWzJdXHJcbiAgICApO1xyXG4gICAgdGhpcy51cC5zZXQoXHJcbiAgICAgIHRoaXMubWF0clZpZXcuYVswXVsxXSxcclxuICAgICAgdGhpcy5tYXRyVmlldy5hWzFdWzFdLFxyXG4gICAgICB0aGlzLm1hdHJWaWV3LmFbMl1bMV1cclxuICAgICk7XHJcbiAgICB0aGlzLnJpZ2h0LnNldChcclxuICAgICAgdGhpcy5tYXRyVmlldy5hWzBdWzBdLFxyXG4gICAgICB0aGlzLm1hdHJWaWV3LmFbMV1bMF0sXHJcbiAgICAgIHRoaXMubWF0clZpZXcuYVsyXVswXVxyXG4gICAgKTtcclxuICAgIHRoaXMubWF0clZQID0gbWF0NCh0aGlzLm1hdHJWaWV3KS5tdWwodGhpcy5tYXRyUHJvaik7XHJcbiAgfSAvLyBFbmQgb2YgJ3NldCcgZnVuY3Rpb25cclxuXHJcbiAgLy8gUHJvamVjdGlvbiBwYXJhbWV0ZXJzIHNldHRpbmcgZnVuY3Rpb24uXHJcbiAgc2V0UHJvaihwcm9qU2l6ZSwgcHJvakRpc3QsIHByb2pGYXJDbGlwKSB7XHJcbiAgICBsZXQgcnggPSBwcm9qU2l6ZSxcclxuICAgICAgcnkgPSBwcm9qU2l6ZTtcclxuXHJcbiAgICB0aGlzLnByb2pEaXN0ID0gcHJvakRpc3Q7XHJcbiAgICB0aGlzLnByb2pTaXplID0gcHJvalNpemU7XHJcbiAgICB0aGlzLnByb2pGYXJDbGlwID0gcHJvakZhckNsaXA7XHJcblxyXG4gICAgLy8gQ29ycmVjdCBhc3BlY3QgcmF0aW9cclxuICAgIGlmICh0aGlzLmZyYW1lVyA+IHRoaXMuZnJhbWVIKSByeCAqPSB0aGlzLmZyYW1lVyAvIHRoaXMuZnJhbWVIO1xyXG4gICAgZWxzZSByeSAqPSB0aGlzLmZyYW1lSCAvIHRoaXMuZnJhbWVXO1xyXG4gICAgdGhpcy5tYXRyUHJvai5zZXRGcnVzdHVtKFxyXG4gICAgICAtcnggLyAyLjAsXHJcbiAgICAgIHJ4IC8gMi4wLFxyXG4gICAgICAtcnkgLyAyLjAsXHJcbiAgICAgIHJ5IC8gMi4wLFxyXG4gICAgICBwcm9qRGlzdCxcclxuICAgICAgcHJvakZhckNsaXBcclxuICAgICk7XHJcblxyXG4gICAgLy8gcHJlLWNhbGN1bGF0ZSB2aWV3ICogcHJvaiBtYXRyaXhcclxuICAgIHRoaXMubWF0clZQID0gbWF0NCh0aGlzLm1hdHJWaWV3KS5tdWwodGhpcy5tYXRyUHJvaik7XHJcbiAgfSAvLyBFbmQgb2YgJ3NldFByb2onIGZ1bmN0aW9uXHJcblxyXG4gIC8vIFJlc2l6ZSBjYW1lcmEgYW5kIHByb2plY3Rpb24gZnVuY3Rpb24uXHJcbiAgc2V0U2l6ZShmcmFtZVcsIGZyYW1lSCkge1xyXG4gICAgaWYgKGZyYW1lVyA8IDEpIGZyYW1lVyA9IDE7XHJcbiAgICBpZiAoZnJhbWVIIDwgMSkgZnJhbWVIID0gMTtcclxuICAgIHRoaXMuZnJhbWVXID0gZnJhbWVXO1xyXG4gICAgdGhpcy5mcmFtZUggPSBmcmFtZUg7XHJcbiAgICAvLyBSZXNldCBwcm9qZWN0aW9uIHdpdGggbmV3IHJlbmRlciB3aW5kb3cgc2l6ZVxyXG4gICAgdGhpcy5zZXRQcm9qKHRoaXMucHJvalNpemUsIHRoaXMucHJvakRpc3QsIHRoaXMucHJvakZhckNsaXApO1xyXG4gIH0gLy8gRW5kIG9mICdzZXRTaXplJyBmdW5jdGlvblxyXG5cclxuICAvLyBDYW1lcmEgc2V0IGRlZmF1bHQgdmFsdWVzIGZ1bmN0aW9uLlxyXG4gIHNldERlZigpIHtcclxuICAgIHRoaXMubG9jLnNldCgwLCAwLCAyMCk7XHJcbiAgICB0aGlzLmF0LnNldCgwLCAwLCAwKTtcclxuICAgIHRoaXMuZGlyLnNldCgwLCAwLCAtMSk7XHJcbiAgICB0aGlzLnVwLnNldCgwLCAxLCAwKTtcclxuICAgIHRoaXMucmlnaHQuc2V0KDEsIDAsIDApO1xyXG5cclxuICAgIHRoaXMucHJvakRpc3QgPSAwLjE7XHJcbiAgICB0aGlzLnByb2pTaXplID0gMC4xO1xyXG4gICAgdGhpcy5wcm9qRmFyQ2xpcCA9IDYwMDA7XHJcblxyXG4gICAgdGhpcy5mcmFtZVcgPSA0NztcclxuICAgIHRoaXMuZnJhbWVIID0gNDc7XHJcblxyXG4gICAgdGhpcy5zZXQodGhpcy5sb2MsIHRoaXMuYXQsIHRoaXMudXApO1xyXG4gICAgdGhpcy5zZXRQcm9qKHRoaXMucHJvalNpemUsIHRoaXMucHJvakRpc3QsIHRoaXMucHJvakZhckNsaXApO1xyXG4gICAgdGhpcy5zZXRTaXplKHRoaXMuZnJhbWVXLCB0aGlzLmZyYW1lSCk7XHJcbiAgfSAvLyBFbmQgb2YgJ3NldERlZicgZnVuY3Rpb25cclxufSAvLyBFbmQgb2YgJ2NhbWVyYScgY2xhc3NcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYW1lcmEoLi4uYXJncykge1xyXG4gIHJldHVybiBuZXcgX2NhbWVyYShhcmdzKTtcclxufSAvLyBFbmQgb2YgJ21hdDQnIGZ1bmN0aW9uXHJcblxyXG4vKiBFTkQgT0YgJ2NhbWVyYS5qcycgRklMRSAqL1xyXG4iLCIvLyBQcmltcyBtb2R1bGUuXHJcbmltcG9ydCB7IHZlYzMsIG1hdDQsIE1hdHJNdWxNYXRyMiB9IGZyb20gXCIuLi9tdGgvbWF0cjQuanNcIjtcclxuZXhwb3J0IHsgdmVjMywgbWF0NCB9O1xyXG5cclxuLyoqKlxyXG4gKiBQcmltaXRpdmVzIG1vZHVsZVxyXG4gKioqL1xyXG5cclxuLy8gUHJpbWl0aXZlcyByZXByZXNlbnRhdGlvbiB0eXBlLlxyXG5leHBvcnQgY2xhc3MgcHJpbSB7XHJcbiAgY29uc3RydWN0b3IoZ2wsIHR5cGUsIFYsIEksIHNoZHByb2dyYW0pIHtcclxuICAgIGlmIChWICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLnZCdWYgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgdGhpcy52YSA9IGdsLmNyZWF0ZVZlcnRleEFycmF5KCk7XHJcblxyXG4gICAgICBnbC5iaW5kVmVydGV4QXJyYXkodGhpcy52YSk7XHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZCdWYpO1xyXG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShWKSwgZ2wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcigwLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDEwICogNCwgMCk7IC8vIHBvc2l0aW9uIFxyXG4gICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKDEsIDQsIGdsLkZMT0FULCBmYWxzZSwgMTAgKiA0LCA0ICogMyk7IC8vIGNvbG9yXHJcbiAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoMiwgMywgZ2wuRkxPQVQsIGZhbHNlLCAxMCAqIDQsIDQgKiA3KTsgLy8gbm9ybWFsXHJcbiAgICAgIFxyXG4gICAgICAvLyBJbmNsdWRlIHRoZSBuZWNlc3NhcnkgYXR0cmlidXRlcyAobGF5b3V0KVxyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSgwKTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoMSk7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KDIpO1xyXG4gICAgICAvLyBDbG9zZSB2ZXJ0ZXggYXJyYXlcclxuICAgICAgZ2wuYmluZFZlcnRleEFycmF5KG51bGwpO1xyXG4gICAgfVxyXG4gICAgaWYgKEkgIT0gbnVsbCkge1xyXG4gICAgICAvLyBJbmRleCBkYXRhXHJcbiAgICAgIHRoaXMuaUJ1ZiA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmlCdWYpO1xyXG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBuZXcgSW50MzJBcnJheShJKSwgZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgICAvLyBnbC5iaW5kQnVmZmVyKDApO1xyXG4gICAgICB0aGlzLm51bU9mRWxlbWVudHMgPSBJLmxlbmd0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMubnVtT2ZFbGVtZW50cyA9IFYubGVuZ3RoO1xyXG4gICAgfVxyXG4gICAgdGhpcy50cmFucyA9IG1hdDQoKS5zZXRJZGVudGl0eSgpO1xyXG4gICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgIHRoaXMuc2hkcHJvZ3JhbSA9IHNoZHByb2dyYW07XHJcbiAgICB0aGlzLmdsID0gZ2w7XHJcbiAgfVxyXG4gIC8qIERyYXcgcHJpbWl0aXZlIGZ1bmN0aW9uICovXHJcbiAgZHJhdyhjYW0sIHdvcmxkLCB0aW1lRnJvbVN0YXJ0KSB7XHJcbiAgICBsZXQgdyA9IE1hdHJNdWxNYXRyMih0aGlzLnRyYW5zLCB3b3JsZCk7XHJcbiAgICBsZXQgd2ludyA9IG1hdDQodykuaW52ZXJzZSgpLnRyYW5zcG9zZSgpO1xyXG4gICAgbGV0IHd2cCA9IG1hdDQodykubXVsKGNhbS5tYXRyVlApO1xyXG5cclxuICAgIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLnNoZHByb2dyYW0pO1xyXG4gICAgdGhpcy5nbC5iaW5kVmVydGV4QXJyYXkodGhpcy52YSk7XHJcblxyXG4gICAgLy8gTWF0cml4IFdWUFxyXG4gICAgbGV0IGxvY1dWUCA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hkcHJvZ3JhbSwgXCJNYXRyV1ZQXCIpO1xyXG4gICAgaWYgKGxvY1dWUCAhPSBudWxsKSB7XHJcbiAgICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihsb2NXVlAsIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHd2cC50b0FycmF5KCkpKTtcclxuICAgIH1cclxuICAgIC8vIE1hdHJpeCBXXHJcbiAgICBsZXQgbG9jVyA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hkcHJvZ3JhbSwgXCJNYXRyV1wiKTtcclxuICAgIGlmIChsb2NXICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5nbC51bmlmb3JtTWF0cml4NGZ2KGxvY1csIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHcudG9BcnJheSgpKSk7XHJcbiAgICB9XHJcbiAgICAvLyBNYXRyaXggSW52ZXJzZVxyXG4gICAgbGV0IGxvY0ludiA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hkcHJvZ3JhbSwgXCJNYXRyV0ludlwiKTtcclxuICAgIGlmIChsb2NJbnYgIT0gbnVsbCkge1xyXG4gICAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXg0ZnYobG9jSW52LCBmYWxzZSwgbmV3IEZsb2F0MzJBcnJheSh3aW53LnRvQXJyYXkoKSkpO1xyXG4gICAgfVxyXG4gICAgLy8gVGltZVxyXG4gICAgY29uc3QgdGltZUZyb21Qcm9ncmFtQmVnaW4gPSBEYXRlLm5vdygpIC0gdGltZUZyb21TdGFydDtcclxuICAgIGNvbnN0IGxvY1RpbWUgPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoZHByb2dyYW0sIFwiVGltZVwiKTtcclxuICAgIGlmIChsb2NUaW1lICE9IG51bGwpIHtcclxuICAgICAgdGhpcy5nbC51bmlmb3JtMWYobG9jVGltZSwgdGltZUZyb21Qcm9ncmFtQmVnaW4gLyAxMDAwLjApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmlCdWYgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLmlCdWYpO1xyXG4gICAgICB0aGlzLmdsLmRyYXdFbGVtZW50cyhcclxuICAgICAgICB0aGlzLnR5cGUsXHJcbiAgICAgICAgdGhpcy5udW1PZkVsZW1lbnRzLFxyXG4gICAgICAgIHRoaXMuZ2wuVU5TSUdORURfSU5ULFxyXG4gICAgICAgIDBcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5nbC5kcmF3QXJyYXlzKHRoaXMudHlwZSwgMCwgdGhpcy5udW1PZkVsZW1lbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmdsLmJpbmRWZXJ0ZXhBcnJheShudWxsKTtcclxuICAgIHRoaXMuZ2wudXNlUHJvZ3JhbShudWxsKTtcclxuICB9XHJcbn1cclxuXHJcbi8qIEVORCBPRiAncm5kcHJpbS5qcycgRklMRSAqL1xyXG4iLCIvKiBGSUxFIE5BTUU6IGJ1ZmZlci5qc1xyXG4gKiBQUk9HUkFNTUVSOiBBRzJcclxuICogTEFTVCBVUERBVEU6IDEzLjA2LjIwMjNcclxuICogUFVSUE9TRTogQnVmZmVycyBtb2R1bGUgLSBoZWxwcyBmb3IgbWFpbi5qcy5cclxuICovXHJcblxyXG4vLyBGT1JNQVQ6XHJcbi8vIFBvc2l0aW9uICAgICBDb2xvciAgICAgICAgICBOb3JtYWxzXHJcblxyXG4vKioqXHJcbiAqIFN1cmZhY2UgZGF0YVxyXG4gKioqL1xyXG5sZXQgc3VyZmFjZURhdGEgPSBbXHJcbiAgLTEuNSwgMCwgMCwgICAgICAgMC4xNSwgMC40MiwgMC4zNiwgMSwgICAwLCAwLCAxLFxyXG4gIC0xLjUsIDAuNSwgMCwgICAgIDAuMTUsIDAuNDIsIDAuMzYsIDEsICAgMCwgMCwgMSxcclxuICAxLjUsIDAuNSwgMCwgICAgICAwLjE1LCAwLjQyLCAwLjM2LCAxLCAgIDAsIDAsIDEsXHJcbiAgMS41LCAwLCAwLCAgICAgICAgMC4xNSwgMC40MiwgMC4zNiwgMSwgICAwLCAwLCAxLFxyXG5cclxuICAtMC41LCAwLjUsIDAsICAgICAwLjE1LCAwLjQyLCAwLjM2LCAxLCAgIDAsIDAsIDEsXHJcbiAgLTAuNSwgMS41LCAwLCAgICAgMC4xNSwgMC40MiwgMC4zNiwgMSwgICAwLCAwLCAxLFxyXG4gIDAuNSwgMS41LCAwLCAgICAgIDAuMTUsIDAuNDIsIDAuMzYsIDEsICAgMCwgMCwgMSxcclxuICAwLjUsIDAuNSwgMCwgICAgICAwLjE1LCAwLjQyLCAwLjM2LCAxLCAgIDAsIDAsIDFcclxuXTtcclxuXHJcbmxldCBzdXJmYWNlSW5kID0gWzAsIDEsIDIsIDAsIDIsIDMsIDQsIDUsIDYsIDQsIDYsIDcsXTtcclxuZXhwb3J0IHsgc3VyZmFjZURhdGEsIHN1cmZhY2VJbmQgfTtcclxuXHJcbi8qKiogXHJcbiAqIFBsYXllciB0YW5rIGRhdGFcclxuICoqKi9cclxubGV0IHggPSAxLCB5ID0gMTtcclxuY29uc3QgaCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5jbGllbnRIZWlnaHQ7XHJcbmNvbnN0IHcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuY2xpZW50V2lkdGg7ICBcclxuaWYgKGggPiB3KSB7XHJcbiAgeSAqPSAodyAvIGgpO1xyXG59XHJcbmVsc2UgaWYgKHcgPiBoKSB7XHJcbiAgeCAqPSAoaCAvIHcpO1xyXG59XHJcbmxldCBhcnREYXRhID0gW1xyXG4gIC0xICogeCwgLTAuNSAqIHksIDAsICAgMCwgMSwgMCwgMSwgIDAsIDAsIDEsIFxyXG4gIC0wLjUgKiB4LCAwLjUgKiB5LCAwLCAgMCwgMSwgMCwgMSwgIDAsIDAsIDEsIFxyXG4gIDAuNSAqIHgsIDAuNSAqIHksIDAsICAgMCwgMSwgMCwgMSwgIDAsIDAsIDEsIFxyXG4gIDEgKiB4LCAtMC41ICogeSwgMCwgICAgMCwgMSwgMCwgMSwgIDAsIDAsIDEsIFxyXG4gIDAuNzUgKiB4LCAxICogeSwgMCwgICAgMCwgMSwgMCwgMSwgIDAsIDAsIDEsIFxyXG4gIDEgKiB4LCAwLjUgKiB5LCAwLCAgICAgMCwgMSwgMCwgMSwgIDAsIDAsIDEsXHJcbl07XHJcblxyXG5sZXQgYXJ0SW5kID0gWzAsIDEsIDIsIDIsIDQsIDUsIDAsIDIsIDNdO1xyXG5cclxubGV0IGFydEVuRGF0YSA9IFtcclxuICAtMSAqIHgsIC0wLjUgKiB5LCAwLCAgIDEsIDAsIDAsIDEsICAwLCAwLCAxLCBcclxuICAtMC41ICogeCwgMC41ICogeSwgMCwgIDEsIDAsIDAsIDEsICAwLCAwLCAxLCBcclxuICAwLjUgKiB4LCAwLjUgKiB5LCAwLCAgIDEsIDAsIDAsIDEsICAwLCAwLCAxLCBcclxuICAxICogeCwgLTAuNSAqIHksIDAsICAgIDEsIDAsIDAsIDEsICAwLCAwLCAxLCBcclxuICAtMC43NSAqIHgsIDEgKiB5LCAwLCAgIDEsIDAsIDAsIDEsICAwLCAwLCAxLCBcclxuICAtMSAqIHgsIDAuNSAqIHksIDAsICAgIDEsIDAsIDAsIDEsICAwLCAwLCAxLFxyXG5dO1xyXG5cclxubGV0IGFydEVuSW5kID0gWzAsIDEsIDIsIDEsIDQsIDUsIDAsIDIsIDNdO1xyXG5cclxuXHJcbmV4cG9ydCB7IGFydERhdGEsIGFydEluZCwgYXJ0RW5EYXRhLCBhcnRFbkluZCB9O1xyXG5cclxuLyoqKlxyXG4gKiBTcXVhcmUgZGF0YVxyXG4gKioqL1xyXG5sZXQgc3F1YXJlRGF0YSA9IFtcclxuICAtMC4xICogeCwgLTAuMSAqIHksIDAsICAgMCwgMSwgMSwgMSwgICAwLCAwLCAxLCBcclxuICAtMC4xICogeCwgMC4xICogeSwgMCwgICAgMCwgMSwgMSwgMSwgICAwLCAwLCAxLCBcclxuICAwLjEgKiB4LCAwLjEgKiB5LCAwLCAgICAgMCwgMSwgMSwgMSwgICAwLCAwLCAxLCBcclxuICAwLjEgKiB4LCAtMC4xICogeSwgMCwgICAgMCwgMSwgMSwgMSwgICAwLCAwLCAxLFxyXG5dO1xyXG5cclxubGV0IHNxdWFyZUluZCA9IFswLCAxLCAyLCAwLCAyLCAzXTtcclxuXHJcbmV4cG9ydCB7IHNxdWFyZURhdGEsIHNxdWFyZUluZCB9O1xyXG4vKioqXHJcbiAqIEhleGFoZWRyb24gKGN1YmUpIGRhdGFcclxuICoqKi9cclxuXHJcbmxldCBjdWJEYXRhID0gW1xyXG4gIC0xLCAtMSwgMSwgLTEsIDEsIC0xLCAxLCAxLCAtMSwgLTEsIC0xLCAxLCAxLCAxLCAtMSwgLTEsIDEsIDEsIC0xLCAtMSwgMSwgMSxcclxuICAxLCAtMSwgLTEsIDEsIDEsIDEsIC0xLCAtMSwgMSwgLTEsIDEsIDEsIDEsIC0xLCAxLCAxLCAtMSwgLTEsIDEsIC0xLCAxLCAxLCAtMSxcclxuICAxLCAxLCAtMSwgLTEsIC0xLCAxLCAxLCAxLCAtMSwgMSwgMSwgMSwgLTEsIC0xLCAtMSwgMSwgMSwgLTEsIDEsIC0xLCAtMSwgMSxcclxuICAtMSwgLTEsIC0xLCAxLCAtMSwgLTEsIC0xLCAxLCAtMSwgMSwgLTEsIC0xLCAtMSwgMSwgLTEsIC0xLCAxLCAtMSwgMSwgMSwgLTEsXHJcbiAgMSwgLTEsIC0xLCAtMSwgLTEsIDEsIC0xLCAxLCAtMSwgLTEsIDEsIC0xLCAtMSwgMSwgLTEsIDEsIDEsIC0xLCAxLCAtMSwgMSwgLTEsXHJcbiAgMSwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgLTEsIDEsIC0xLCAtMSwgLTEsIC0xLCAxLCAtMSwgLTEsIDEsIC0xLCAtMSwgLTEsIC0xLFxyXG4gIC0xLCAxLCAxLCAtMSwgLTEsIDEsIC0xLCAtMSwgLTEsIC0xLCAxLCAxLCAxLCAtMSwgMSwgMSwgLTEsIC0xLCAtMSwgLTEsIDEsIC0xLFxyXG4gIDEsIC0xLCAtMSwgMSwgLTEsIC0xLCAtMSwgLTEsIDEsIDEsIDEsIC0xLCAtMSwgMSwgLTEsIC0xLCAxLCAtMSwgMSwgLTEsIDEsIDEsXHJcbiAgMSwgMSwgLTEsIC0xLCAxLCAxLCAxLCAtMSwgMSwgLTEsIC0xLCAxLCAtMSwgLTEsIDEsIDEsIDEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsXHJcbiAgLTEsIDEsIC0xLCAtMSwgMSwgMSwgLTEsIC0xLCAxLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAxLCAtMSwgLTEsIDEsIC0xLCAtMSxcclxuICAtMSwgMSwgLTEsIC0xLCAxLCAtMSwgLTEsIDEsIC0xLCAtMSwgLTEsIDEsIC0xLCAxLCAxLCAtMSwgMSwgMSwgLTEsIC0xLCAtMSxcclxuXTtcclxuXHJcbmxldCBjdWJJbmQgPSBbXHJcbiAgMCwgMSwgMiwgMCwgMiwgMywgNCwgNSwgNiwgNCwgNiwgNywgOCwgOSwgMTAsIDgsIDEwLCAxMSwgMTIsIDEzLCAxNCwgMTIsIDE0LFxyXG4gIDE1LCAxNiwgMTcsIDE4LCAxNiwgMTgsIDE5LCAyMCwgMjEsIDIyLCAyMCwgMjIsIDIzLFxyXG5dO1xyXG5cclxuZXhwb3J0IHsgY3ViRGF0YSwgY3ViSW5kIH07XHJcblxyXG4vKioqXHJcbiAqIFRldHJhaGVkcm9uIGRhdGFcclxuICoqKi9cclxuXHJcbmxldCB0ZXRyRGF0YSA9IFtcclxuICAwLCAxLCAwLCAtMSwgLTEsIC0xLCAwLCAwLCAxLCAwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAwLCAtMSwgLTEsIC0xLCAxLCAtMSxcclxuICAtMSwgLTEsIC0xLCAtMSwgMCwgMSwgLTEsIC0xLCAwLCAtMSwgMSwgLTEsIC0xLCAtMSwgMCwgMCwgLTEsIDEsXHJcbl07XHJcblxyXG5sZXQgdGV0ckluZCA9IFswLCAxLCAyLCAwLCAyLCAzLCAwLCAxLCAzLCAxLCAyLCAzXTtcclxuXHJcbmV4cG9ydCB7IHRldHJEYXRhLCB0ZXRySW5kIH07XHJcblxyXG4vKioqXHJcbiAqIE9jdGFoZWRyb24gZGF0YVxyXG4gKioqL1xyXG5cclxubGV0IG9jdGFEYXRhID0gW1xyXG4gIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDEsIDIsIDEsIC0xLCAwLCAxLCAwLCAwLCAwLCAxLCAwLCAxLCAyLCAtMSwgMCwgLTEsIDAsIDAsXHJcbiAgMCwgMSwgMCwgMSwgMCwgMSwgMCwgLTEsIDAsIDAsIDAsIDEsIDIsIDEsIDAsIDEsIDAsIDEsIDAsIDAsIDAsIDEsIDIsIDEsIDIsIDAsXHJcbiAgLTEsIDAsIDAsIDAsIDAsIDEsIDEsIDAsIDEsXHJcbl07XHJcblxyXG5sZXQgb2N0YUluZCA9IFtcclxuICAwLCAxLCAyLCAwLCAyLCAzLCAwLCAzLCA0LCAwLCAxLCA0LCAxLCA0LCA1LCAzLCA0LCA1LCAyLCAzLCA1LCAxLCAyLCA1LFxyXG5dO1xyXG5cclxuZXhwb3J0IHsgb2N0YURhdGEsIG9jdGFJbmQgfTtcclxuXHJcbi8qKipcclxuICogRG9kZWNhaGVkcm9uIGRhdGFcclxuICoqKi9cclxuXHJcbmxldCBkb2RlY2FEYXRhID0gW1xyXG4gIDAuMTQ5LCAtMC42MzEsIC0wLjQ1OSwgMCwgMSwgMCwgMSwgMSwgMCwgMCwgLTAuMzksIC0wLjYzMSwgLTAuMjg0LCAxLCAwLCAwLCAxLFxyXG4gIDEsIDAsIDAsIC0wLjM5LCAtMC42MzEsIDAuMjg0LCAxLCAxLCAwLCAxLCAxLCAwLCAwLCAwLjE0OSwgLTAuNjMxLCAwLjQ1OSwgMSxcclxuICAwLCAwLCAxLCAtMSwgMCwgMCwgMC40ODMsIC0wLjYzMSwgMCwgMCwgMSwgMCwgMSwgLTEsIDAsIDAsIC0wLjE0OSwgMC42MzEsXHJcbiAgMC40NTksIDEsIDEsIDAuNCwgMSwgMCwgMSwgMCwgLTAuNDgzLCAwLjYzMSwgMCwgMSwgMSwgMC41LCAwLjQsIDAsIDEsIDAsXHJcbiAgLTAuMTQ5LCAwLjYzMSwgLTAuNDU5LCAwLCAwLCAwLCAxLCAwLCAxLCAwLCAwLjM5LCAwLjYzMSwgLTAuMjg0LCAwLCAwLCAwLCAxLFxyXG4gIDAsIDEsIDAsIDAuMzksIDAuNjMxLCAwLjI4NCwgMCwgMCwgMCwgMSwgMCwgMSwgMCwgMC43ODEsIC0wLjE0OSwgMCwgMCwgMCwgMCxcclxuICAxLCAwLCAxLCAwLCAwLjI0MSwgLTAuMTQ5LCAtMC43NDMsIDAsIDAsIDAsIDEsIDAsIDEsIDAsIC0wLjYzMSwgLTAuMTQ5LFxyXG4gIC0wLjQ1OSwgMCwgMCwgMCwgMSwgMCwgMSwgMCwgLTAuNjMxLCAtMC4xNDksIDAuNDU5LCAwLCAwLCAwLCAxLCAwLCAxLCAwLFxyXG4gIDAuMjQxLCAtMC4xNDksIDAuNzQzLCAwLCAwLCAwLCAxLCAwLCAxLCAwLCAtMC4yNDEsIDAuMTQ5LCAwLjc0MywgMCwgMCwgMCwgMSxcclxuICAwLCAxLCAwLCAtMC43ODEsIDAuMTQ5LCAwLCAwLCAwLCAwLCAxLCAwLCAxLCAwLCAtMC4yNDEsIDAuMTQ5LCAtMC43NDMsIDAsIDAsXHJcbiAgMCwgMSwgMCwgMSwgMCwgMC42MzEsIDAuMTQ5LCAtMC40NTksIDAsIDAsIDAsIDEsIDAsIDEsIDAsIDAuNjMxLCAwLjE0OSwgMC40NTksXHJcbiAgMCwgMCwgMCwgMSwgMCwgMSwgMCxcclxuXTtcclxuXHJcbmxldCBkb2RlY2FJbmQgPSBbXHJcbiAgMCwgMSwgMiwgMCwgMiwgMywgMCwgMywgNCwgNSwgNiwgNywgNSwgNywgOSwgNywgOCwgOSwgNSwgOSwgMTUsIDksIDE0LCAxNSwgOSxcclxuICAxNCwgMTksIDIsIDEzLCAxNSwgMiwgMywgMTUsIDMsIDE0LCAxNSwgNSwgNiwgMTUsIDYsIDE1LCAxNiwgMTMsIDE1LCAxNiwgMywgNCxcclxuICAxNCwgNCwgMTQsIDE5LCA0LCAxMCwgMTksIDEsIDIsIDEzLCAxLCAxMiwgMTMsIDEyLCAxMywgMTYsIDcsIDgsIDE3LCA4LCAxMSxcclxuICAxNywgOCwgMTEsIDE4LCAxMCwgMTEsIDE4LCA0LCAxMCwgMTEsIDAsIDQsIDExLCA4LCA5LCAxOSwgOCwgMTgsIDE5LCAxMCwgMTgsXHJcbiAgMTksIDAsIDEsIDExLCAxLCAxMSwgMTcsIDEsIDEyLCAxNywgMTIsIDE2LCAxNywgNiwgMTYsIDE3LCA2LCA3LCAxNyxcclxuXTtcclxuXHJcbmV4cG9ydCB7IGRvZGVjYURhdGEsIGRvZGVjYUluZCB9O1xyXG5cclxuLyoqKlxyXG4gKiBJY29zYWhlZHJvbiBkYXRhXHJcbiAqKiovXHJcblxyXG5sZXQgaWNvc2FEYXRhID0gW1xyXG4gIDAsIC0xLCAwLCAwLCAxLCAwLCAxLCAxLCAwLCAwLCAtMC4yNzYsIC0wLjQ0NywgLTAuODUxLCAxLCAwLCAwLCAxLCAxLCAwLCAwLFxyXG4gIDAuNzI0LCAtMC40NDcsIC0wLjUyNiwgMSwgMSwgMCwgMSwgMSwgMCwgMCwgMC43MjQsIC0wLjQ0NywgMC41MjYsIDEsIDAsIDAsIDEsXHJcbiAgLTEsIDAsIDAsIC0wLjI3NiwgLTAuNDQ3LCAwLjg1MSwgMCwgMSwgMCwgMSwgLTEsIDAsIDAsIC0wLjg5NCwgLTAuNDQ3LCAwLCAxLFxyXG4gIDEsIDAuNCwgMSwgMCwgMSwgMCwgLTAuNzI0LCAwLjQ0NywgMC41MjYsIDEsIDEsIDAuNSwgMC40LCAwLCAxLCAwLCAtMC43MjQsXHJcbiAgMC40NDcsIC0wLjUyNiwgMCwgMCwgMSwgMSwgMSwgMCwgMCwgMC4yNzYsIDAuNDQ3LCAtMC44NTEsIDEsIDAsIDEsIDEsIC0xLCAwLFxyXG4gIDAsIDAuODk0LCAwLjQ0NywgMCwgMCwgMSwgMSwgMSwgLTEsIDAsIDAsIDAuMjc2LCAwLjQ0NywgMC44NTEsIDEsIDAsIDEsIDEsIDAsXHJcbiAgMSwgMCwgMCwgMSwgMCwgMSwgMC41LCAxLCAwLjMsIDAsIDEsIDAsXHJcbl07XHJcblxyXG5sZXQgaWNvc2FJbmQgPSBbXHJcbiAgMCwgMSwgMiwgMCwgMSwgNSwgMCwgNCwgNSwgMCwgMywgNCwgMCwgMiwgMywgNiwgMTAsIDExLCA2LCA3LCAxMSwgNywgOCwgMTEsIDgsXHJcbiAgOSwgMTEsIDksIDEwLCAxMSwgMiwgMywgOSwgMSwgMiwgOCwgMSwgNSwgNywgNCwgNSwgNiwgMywgNCwgMTAsIDQsIDYsIDEwLCA1LFxyXG4gIDYsIDcsIDEsIDcsIDgsIDIsIDgsIDksIDMsIDksIDEwLFxyXG5dO1xyXG5cclxuZXhwb3J0IHsgaWNvc2FEYXRhLCBpY29zYUluZCB9O1xyXG5cclxuLyogRU5EIE9GICdidWZmZXJzLmpzJyBGSUxFICovXHJcbiIsIi8vLyBNYWluIG91dHB1dCBtb2R1bGUuXHJcbmltcG9ydCB7IG1hdDQsIHZlYzMgfSBmcm9tIFwiLi9tdGgvbWF0cjQuanNcIjtcclxuaW1wb3J0IHsgY2FtZXJhIH0gZnJvbSBcIi4vbXRoL2NhbWVyYS5qc1wiO1xyXG5pbXBvcnQgeyBwcmltIH0gZnJvbSBcIi4vcm5kL3JuZHByaW0uanNcIjtcclxuaW1wb3J0IHtcclxuICBjdWJEYXRhLFxyXG4gIGN1YkluZCxcclxuICB0ZXRyRGF0YSxcclxuICB0ZXRySW5kLFxyXG4gIG9jdGFEYXRhLFxyXG4gIG9jdGFJbmQsXHJcbiAgZG9kZWNhRGF0YSxcclxuICBkb2RlY2FJbmQsXHJcbiAgaWNvc2FEYXRhLFxyXG4gIGljb3NhSW5kLFxyXG4gIHN1cmZhY2VEYXRhLFxyXG4gIHN1cmZhY2VJbmQsXHJcbiAgYXJ0RW5EYXRhLFxyXG4gIGFydEVuSW5kLFxyXG4gIGFydERhdGEsXHJcbiAgYXJ0SW5kLFxyXG4gIHNxdWFyZURhdGEsXHJcbiAgc3F1YXJlSW5kLFxyXG59IGZyb20gXCIuL2RhdGEvYnVmZmVycy5qc1wiO1xyXG5cclxuLy8gUmVhZCB0ZXh0IGZyb20gZmlsZSBieSBVUkwgZnVuY3Rpb24uXHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoUmVzb3VyY2UocmVzVVJMKSB7XHJcbiAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChyZXNVUkwpO1xyXG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xyXG5cclxuICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgfSBjYXRjaChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gTG9hZCBzaGFkZXIgZnVuY3Rpb24uXHJcbmZ1bmN0aW9uIGxvYWRTaGFkZXIoZ2wsIHR5cGUsIHNvdXJjZSkge1xyXG4gIGNvbnN0IHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcih0eXBlKTtcclxuXHJcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICBhbGVydChcIkVycm9yIGxvYWQgc2hhZGVyXCIgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikpO1xyXG4gIH1cclxuICByZXR1cm4gc2hhZGVyO1xyXG59XHJcblxyXG4vLyBEcmF3IGJ1bGxldCBzaG90IGFuZCBjb2xpc2lvbiB3aXRoIGVuZW15IHRhbmsuXHJcbi8vICh4MSwgeTEpIC0gc3RhcnQgcG9zaXRpb24gb2YgYnVsbGV0XHJcbi8vICh4MiwgeTIpIC0gZW5lbXkncyB0YW5rIHBvc2l0aW9uLlxyXG4vLyBmbGFnIChib29sKSAtICh0cnVlKTogZHJhdyBmbHlpbmcgYnVsbGV0LCAoZmFsc2UpOiBidWxsZXQgaXMgbm90IG1vdmluZy5cclxuZnVuY3Rpb24gc2hvdEFuZENvbGlzaW9uKHgxLCB5MSwgc3BlZWQsIHNpbiwgY29zLCB4MiwgeTIsIHRpbWUsIGNhbSwgcHJpbSwgZmxhZykge1xyXG4gIGxldCBkZWx0YSA9IDc7XHJcblxyXG4gIGlmIChmbGFnID09PSB0cnVlKSB7XHJcbiAgICBsZXQgQSA9IDI7IC8vIGFjY2VsZXJhdGlvblxyXG4gICAgbGV0IFN4ID0gc3BlZWQgKiBjb3MgKiB0aW1lOyAvLyBQcm9qIG9mIHNwZWVkIG9uIE94XHJcbiAgICBsZXQgU3kgPSAoc3BlZWQgKiBzaW4gLSBBICogdGltZSkgKiB0aW1lOyAvLyBQcm9qIG9mIHNwZWVkIG9uIE95XHJcblxyXG4gICAgaWYgKHkxICsgU3kgPCAtMTAgfHxcclxuICAgICh4MSArIFN4ID4gLTAuNSAqIGRlbHRhICYmIHgxICsgU3ggPCAwLjUgKiBkZWx0YSAmJiB5MSArIFN5IDwgMS41ICogZGVsdGEgLSAxMCkpIHtcclxuICAgICAgU3kgPSAwO1xyXG4gICAgICBTeCA9IDA7XHJcbiAgICAgIHByaW0uZHJhdyhjYW0sIG1hdDQoKS50cmFuc2xhdGUoeDEsIHkxLCAwKSk7XHJcbiAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG4gICAgcHJpbS5kcmF3KGNhbSwgbWF0NCgpLnRyYW5zbGF0ZSh4MSArIFN4LCB5MSArIFN5LCAwKSk7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICB4MSArIFN4IDw9IHgyICsgMC41ICYmXHJcbiAgICAgIHgxICsgU3ggPj0geDIgLSAwLjUgJiZcclxuICAgICAgeTEgKyBTeSA8PSB5MiArIDAuNSAmJlxyXG4gICAgICB5MSArIFN5ID49IHkyIC0gMC41XHJcbiAgICApIHtcclxuICAgICAgU3kgPSAwO1xyXG4gICAgICBTeCA9IDA7XHJcbiAgICAgIC8vIGFsZXJ0KFwi0KHRgtC+0LvQutC90L7QstC10L3QuNC1XCIpO1xyXG4gICAgICByZXR1cm4gMTtcclxuICAgIH1cclxuICAgIHJldHVybiAtMTtcclxuICB9IGVsc2Uge1xyXG4gICAgcHJpbS5kcmF3KGNhbSwgbWF0NCgpLnRyYW5zbGF0ZSh4MSwgeTEsIDApKTtcclxuICAgIHJldHVybiAtMTtcclxuICB9XHJcbn1cclxuXHJcbi8vIExvY2FsIHJvb20gZGF0YS5cclxubGV0IHJvb21EYXRhR0w7XHJcbmxldCBsZWZ0RmxhZyA9IGZhbHNlLCByaWdodEZsYWcgPSBmYWxzZTtcclxubGV0IGxlZnRTdGFydFRpbWUsIHJpZ2h0U3RhcnRUaW1lO1xyXG5sZXQgbGVmdFNpbiwgbGVmdENvcztcclxubGV0IHJpZ2h0U2luLCByaWdodENvcztcclxubGV0IGxlZnRTcGVlZCwgcmlnaHRTcGVlZDtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSb29tRGF0YUdMKHJvb21EYXRhKSB7XHJcbiAgcm9vbURhdGFHTCA9IHJvb21EYXRhO1xyXG5cclxuICBpZiAocm9vbURhdGFHTCA9PSB1bmRlZmluZWQpIHtcclxuICAgIGxlZnRGbGFnID0gZmFsc2U7XHJcbiAgICByaWdodEZsYWcgPSBmYWxzZTtcclxuICAgIGxlZnRTdGFydFRpbWUgPSAwO1xyXG4gICAgcmlnaHRTdGFydFRpbWUgPSAwO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLy8gQ29weSBkYXRhIHRvIGxvY2FsIGNsYXNzLlxyXG4gIGlmIChyb29tRGF0YUdMLnNpZGUgPT0gXCJyXCIpIHtcclxuICAgIC8vIFNob3QgZmxhZ1xyXG4gICAgcmlnaHRGbGFnID0gcm9vbURhdGFHTC5pc1Nob3Q7XHJcbiAgICBsZWZ0RmxhZyA9IHJvb21EYXRhR0wuZUlzU2hvdDtcclxuICAgIC8vIFNob3Qgc3RhcnQgdGltZVxyXG4gICAgcmlnaHRTdGFydFRpbWUgPSByb29tRGF0YUdMLnN0YXJ0U2hvdDtcclxuICAgIGxlZnRTdGFydFRpbWUgPSByb29tRGF0YUdMLmVTdGFydFNob3Q7XHJcbiAgICAvLyBTaG90IGFuZ2xlXHJcbiAgICByaWdodFNpbiA9IHJvb21EYXRhR0wuc2luQW5nbGU7XHJcbiAgICByaWdodENvcyA9IHJvb21EYXRhR0wuY29zQW5nbGU7XHJcbiAgICBsZWZ0U2luID0gcm9vbURhdGFHTC5lU2luQW5nbGU7XHJcbiAgICBsZWZ0Q29zID0gcm9vbURhdGFHTC5lQ29zQW5nbGU7XHJcbiAgICAvLyBTcGVlZFxyXG4gICAgcmlnaHRTcGVlZCA9IHJvb21EYXRhLnNwZWVkO1xyXG4gICAgbGVmdFNwZWVkID0gcm9vbURhdGEuZVNwZWVkO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBTaG90IGZsYWdcclxuICAgIHJpZ2h0RmxhZyA9IHJvb21EYXRhR0wuZUlzU2hvdDtcclxuICAgIGxlZnRGbGFnID0gcm9vbURhdGFHTC5pc1Nob3Q7XHJcbiAgICAvLyBTaG90IHN0YXJ0IHRpbWVcclxuICAgIHJpZ2h0U3RhcnRUaW1lID0gcm9vbURhdGFHTC5lU3RhcnRTaG90O1xyXG4gICAgbGVmdFN0YXJ0VGltZSA9IHJvb21EYXRhR0wuc3RhcnRTaG90O1xyXG4gICAgLy8gU2hvdCBhbmdsZVxyXG4gICAgbGVmdFNpbiA9IHJvb21EYXRhR0wuc2luQW5nbGU7XHJcbiAgICBsZWZ0Q29zID0gcm9vbURhdGFHTC5jb3NBbmdsZTtcclxuICAgIHJpZ2h0U2luID0gcm9vbURhdGFHTC5lU2luQW5nbGU7XHJcbiAgICByaWdodENvcyA9IHJvb21EYXRhR0wuZUNvc0FuZ2xlO1xyXG4gICAgLy8gU3BlZWRcclxuICAgIHJpZ2h0U3BlZWQgPSByb29tRGF0YS5lU3BlZWQ7XHJcbiAgICBsZWZ0U3BlZWQgPSByb29tRGF0YS5zcGVlZDtcclxuICB9XHJcbn1cclxuXHJcbi8qIEdMIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9uICovXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0R0woKSB7XHJcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpO1xyXG4gIGNvbnN0IGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XHJcblxyXG4gIC8vIEdldCBsb2FkIHNoYWRlcnMgcHJvbWlzZXMuXHJcbiAgbGV0IHZzUHIgPSBmZXRjaFJlc291cmNlKFwiLi9zaGFkZXJzL3ZlcnQuZ2xzbFwiKTtcclxuICBsZXQgZnNQciA9IGZldGNoUmVzb3VyY2UoXCIuL3NoYWRlcnMvZnJhZy5nbHNsXCIpO1xyXG5cclxuICBQcm9taXNlLmFsbChbdnNQciwgZnNQcl0pLnRoZW4oKHJlcykgPT4ge1xyXG4gICAgLy8gU2hhZGVyIGluaXRpYWxpemF0aW9uLlxyXG4gICAgY29uc3QgdmVydGV4U2ggPSBsb2FkU2hhZGVyKGdsLCBnbC5WRVJURVhfU0hBREVSLCByZXNbMF0pO1xyXG4gICAgY29uc3QgZnJhZ21lbnRTaCA9IGxvYWRTaGFkZXIoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgcmVzWzFdKTtcclxuICAgIGNvbnN0IHNoZHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XHJcblxyXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHNoZHByb2dyYW0sIHZlcnRleFNoKTtcclxuICAgIGdsLmF0dGFjaFNoYWRlcihzaGRwcm9ncmFtLCBmcmFnbWVudFNoKTtcclxuICAgIGdsLmxpbmtQcm9ncmFtKHNoZHByb2dyYW0pO1xyXG5cclxuICAgIC8vIEVuYWJsZSBvcGVuR0wgZnVuY3Rpb25zLlxyXG4gICAgZ2wuZW5hYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG5cclxuICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihzaGRwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpIHtcclxuICAgICAgYWxlcnQoXCJFcnJvciBpbiBwcm9ncmFtXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIExvYWQgc3VyZmFjZS5cclxuICAgIGxldCBzdXJmYWNlQWcgPSBuZXcgcHJpbShnbCwgZ2wuVFJJQU5HTEVTLCBzdXJmYWNlRGF0YSwgc3VyZmFjZUluZCwgc2hkcHJvZ3JhbSk7XHJcblxyXG4gICAgLy8gTG9hZCBtb2RlbHMuXHJcbiAgICBsZXQgbGVmdFRhbmsgPSBuZXcgcHJpbShnbCwgZ2wuVFJJQU5HTEVTLCBhcnREYXRhLCBhcnRJbmQsIHNoZHByb2dyYW0pO1xyXG4gICAgbGV0IHJpZ2h0VGFuayA9IG5ldyBwcmltKGdsLCBnbC5UUklBTkdMRVMsIGFydEVuRGF0YSwgYXJ0RW5JbmQsIHNoZHByb2dyYW0pO1xyXG5cclxuICAgIGxldCBsZWZ0QnVsbGV0ID0gbmV3IHByaW0oZ2wsIGdsLlRSSUFOR0xFUywgc3F1YXJlRGF0YSwgc3F1YXJlSW5kLCBzaGRwcm9ncmFtKTtcclxuICAgIGxldCByaWdodEJ1bGxldCA9IG5ldyBwcmltKGdsLCBnbC5UUklBTkdMRVMsIHNxdWFyZURhdGEsIHNxdWFyZUluZCwgc2hkcHJvZ3JhbSk7XHJcblxyXG4gICAgbGV0IGNhbSA9IGNhbWVyYSgpO1xyXG5cclxuICAgIC8vIFBsYXllcnMgY29vcmRzLlxyXG4gICAgbGV0IHJpZ2h0UG9zWCwgcmlnaHRQb3NZO1xyXG4gICAgbGV0IGxlZnRQb3NYLCBsZWZ0UG9zWTtcclxuXHJcbiAgICBpZiAocm9vbURhdGFHTC5zaWRlID09IFwiclwiKSB7XHJcbiAgICAgIHJpZ2h0UG9zWCA9IHJvb21EYXRhR0wucG9zaXRpb25bMF07XHJcbiAgICAgIHJpZ2h0UG9zWSA9IHJvb21EYXRhR0wucG9zaXRpb25bMV07XHJcbiAgICAgIGxlZnRQb3NYID0gcm9vbURhdGFHTC5lUG9zWzBdO1xyXG4gICAgICBsZWZ0UG9zWSA9IHJvb21EYXRhR0wuZVBvc1sxXTtcclxuICAgICAgcmlnaHRTcGVlZCA9IHJvb21EYXRhR0wuc3BlZWQ7XHJcbiAgICAgIGxlZnRTcGVlZCA9IHJvb21EYXRhR0wuZVNwZWVkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmlnaHRQb3NYID0gcm9vbURhdGFHTC5lUG9zWzBdO1xyXG4gICAgICByaWdodFBvc1kgPSByb29tRGF0YUdMLmVQb3NbMV07XHJcbiAgICAgIGxlZnRQb3NYID0gcm9vbURhdGFHTC5wb3NpdGlvblswXTtcclxuICAgICAgbGVmdFBvc1kgPSByb29tRGF0YUdMLnBvc2l0aW9uWzFdO1xyXG4gICAgICByaWdodFNwZWVkID0gcm9vbURhdGFHTC5lU3BlZWQ7XHJcbiAgICAgIGxlZnRTcGVlZCA9IHJvb21EYXRhR0wuc3BlZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHRpbWVGcm9tU3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgY29uc3QgZHJhd1JlbmRlciA9ICgpID0+IHtcclxuICAgICAgaWYgKHJvb21EYXRhR0wgPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvcigwLjMsIDAuMywgMC40LCAxKTtcclxuICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGdsLmNsZWFyQ29sb3IoMC4zLCAwLjQ3LCAwLjgsIDEpO1xyXG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAgIGxldCByVGltZSA9IChEYXRlLm5vdygpIC0gcmlnaHRTdGFydFRpbWUpIC8gMTAwMC4wO1xyXG4gICAgICBsZXQgbFRpbWUgPSAoRGF0ZS5ub3coKSAtIGxlZnRTdGFydFRpbWUpIC8gMTAwMC4wO1xyXG5cclxuICAgICAgLy8gU3VyZmFjZSBkcmF3aW5nLlxyXG4gICAgICBzdXJmYWNlQWcuZHJhdyhjYW0sIG1hdDQoKS5zY2FsZSg3LCA3LCA3KS50cmFuc2xhdGUoMCwgLTEwLCAwKSwgdGltZUZyb21TdGFydCk7XHJcblxyXG4gICAgICAvLyBMZWZ0IHNpZGUuXHJcbiAgICAgIGxlZnRUYW5rLmRyYXcoY2FtLCBtYXQ0KCkudHJhbnNsYXRlKGxlZnRQb3NYLCBsZWZ0UG9zWSwgMCksIHRpbWVGcm9tU3RhcnQpO1xyXG4gICAgICBpZiAoc2hvdEFuZENvbGlzaW9uKGxlZnRQb3NYICsgMC41LCBsZWZ0UG9zWSArIDAuOCwgIC8vIEJ1bGxldCBzdGFydCBwb3NpdGlvbi5cclxuICAgICAgICAgIGxlZnRTcGVlZCwgbGVmdFNpbiwgbGVmdENvcywgICAgICAgICAgICAgICAgICAgICAvLyBCdWxsZXQgc3BlZWQuXHJcbiAgICAgICAgICByaWdodFBvc1gsIHJpZ2h0UG9zWSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5lbXkgcG9zaXRpb24uXHJcbiAgICAgICAgICBsVGltZSwgY2FtLCBsZWZ0QnVsbGV0LCBsZWZ0RmxhZykgIT0gLTEpIHsgICAgICAgLy8gVGltZSwgY2FtZXJhLCBwcmltaXRpdmUsIHNob290RmxhZy5cclxuICAgICAgICBsZWZ0RmxhZyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSaWdodCBzaWRlLlxyXG4gICAgICByaWdodFRhbmsuZHJhdyhjYW0sIG1hdDQoKS50cmFuc2xhdGUocmlnaHRQb3NYLCByaWdodFBvc1ksIDApLCB0aW1lRnJvbVN0YXJ0KTtcclxuICAgICAgaWYgKHNob3RBbmRDb2xpc2lvbihyaWdodFBvc1ggLSAwLjUsIHJpZ2h0UG9zWSArIDAuOCwgICAgLy8gQnVsbGV0IHN0YXJ0IHBvc2l0aW9uLlxyXG4gICAgICAgICAgcmlnaHRTcGVlZCwgcmlnaHRTaW4sIHJpZ2h0Q29zLCAgICAgICAgICAgICAgICAgICAgICAvLyBCdWxsZXQgc3BlZWQuXHJcbiAgICAgICAgICBsZWZ0UG9zWCwgbGVmdFBvc1ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuZW15IHBvc2l0aW9uLlxyXG4gICAgICAgICAgclRpbWUsIGNhbSwgcmlnaHRCdWxsZXQsIHJpZ2h0RmxhZykgIT0gLTEpIHsgICAgICAgICAvLyBUaW1lLCBjYW1lcmEsIHByaW1pdGl2ZSwgc2hvb3RGbGFnLlxyXG4gICAgICAgIHJpZ2h0RmxhZyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdSZW5kZXIpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgaWYgKHJvb21EYXRhR0wgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRyYXdSZW5kZXIoKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuLy8gRU5EIE9GICdtYWluLmpzJyBGSUxFLlxyXG4iLCJpbXBvcnQgeyBpbyB9IGZyb20gXCJzb2NrZXQuaW8tY2xpZW50XCI7XHJcblxyXG4vLyBNeSBmaWxlcyBpbXBvcnRzLlxyXG5pbXBvcnQge0RhdGEsIFN0YXRlfSBmcm9tIFwiLi9jbGFzc2VzLmpzXCI7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gXCIuL3V0aWxzLmpzXCI7XHJcbmltcG9ydCAqIGFzIGNvbnRyb2wgZnJvbSBcIi4vZ2FtZV9lbmdpbmUuanNcIjtcclxuXHJcbi8vIE91dHB1dCByZXN1bHQgb2YgZ2FtZS5cclxuZnVuY3Rpb24gZ2FtZVJlc3VsdChyZXMpIHtcclxuICBpZiAocmVzID09IDEpIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1yZXNcIikuaW5uZXJUZXh0ID0gXCJZb3Ugd29uISEhXCI7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lLXJlc1wiKS5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgfSwgMjAwMCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1yZXNcIikuaW5uZXJUZXh0ID0gXCJZb3UgbG9zZVwiO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1yZXNcIikuaW5uZXJUZXh0ID0gXCJcIjtcclxuICAgIH0sIDIwMDApO1xyXG4gIH1cclxufSBcclxuXHJcbi8vIFVwZGF0ZSBVSSB1cHBlciB6b25lIHdpdGggc3RhdGlzdGljcy5cclxuZnVuY3Rpb24gdXBkYXRlVXBwZXJVSShpZCkge1xyXG4gIGlmIChpZCA9PSAxKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJvb20taW5mb1wiKS5pbm5lclRleHQgPSBgUm9vbSBJRDogJHtyb29tRGF0YS5yb29tSWR9XFxuXHJcbiAgICAgICAgICBZb3VyIElEOiAke3Jvb21EYXRhLnBsYXllcklkfWA7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNtYWxsLWluZm9cIikuaW5uZXJUZXh0ID0gYFlvdXIgSFA6ICR7cm9vbURhdGEubXlIcH1cXG5cclxuICAgICAgICAgIFlvdXIgcG9zOiAke3Jvb21EYXRhLnBvc2l0aW9uWzBdfToke3Jvb21EYXRhLnBvc2l0aW9uWzFdfVxcblxyXG4gICAgICAgICAgWW91IGFyZSAke3Jvb21EYXRhLnNpZGUgPT0gXCJsXCIgPyBcImdyZWVuXCIgOiBcInJlZFwifSBwbGF5ZXJgO1xyXG4gIH0gZWxzZSBpZiAoaWQgPT0gMCkge1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJyb29tLWluZm9cIikuaW5uZXJUZXh0ID0gXCJXYWl0aW5nIGZvciBvcHBvbmVudC4uLlwiO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbWFsbC1pbmZvXCIpLmlubmVyVGV4dCA9IFwiXCI7XHJcbiAgfSBlbHNlIGlmIChpZCA9PSAyKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJvb20taW5mb1wiKS5pbm5lclRleHQgPSBcIllvdSBhcmUgaW4gbG9iYnlcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic21hbGwtaW5mb1wiKS5pbm5lclRleHQgPSBcIlwiO1xyXG4gIH1cclxufVxyXG5cclxuLy8gVXBkYXRlIFVJIGRvd24gem9uZSB3aXRoIHR1cm4gb3Igc2hvb3Qgc3VjY2Vzcy5cclxuZnVuY3Rpb24gdXBkYXRlRG93blVJKGlkLCBtc2cpIHtcclxuICBpZiAoaWQgPT0gXCJ0dXJuXCIpIHtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHVybi1pbmZvXCIpLmlubmVyVGV4dCA9IG1zZztcclxuICB9IGVsc2UgaWYgKGlkID09IFwic3VjY2Vzc1wiKSB7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob290LWluZm9cIikuaW5uZXJUZXh0ID0gbXNnO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3QtaW5mb1wiKS5pbm5lclRleHQgPSBcIlwiO1xyXG4gICAgfSwgMTUwMCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBMb2NhbCByb29tIGRhdGEuXHJcbmxldCByb29tRGF0YSA9IG5ldyBEYXRhKCk7XHJcbmxldCBzdGFydFRpbWU7XHJcbmxldCBsb2JieUZsYWcgPSAxO1xyXG5cclxuLy8gQ2xpZW50LXNpZGUuXHJcbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XHJcbiAgY29uc3Qgc29ja2V0ID0gaW8oKTtcclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBVc2VyIGNvbm5lY3RlZC5cclxuICBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcclxuXHJcbiAgICAvLyBSb29tIGNyZWF0ZWQsIGhhdmUgb3Bwb25lbnQsIGdldCBzdGFydCBkYXRhLCBpbml0aWFsaXplIGNhbnZhcyB3ZWJHTCwgc2V0IFVJLlxyXG4gICAgc29ja2V0Lm9uKFwiRm91bmQgcm9vbVwiLCAoZGF0YUFycmF5KSA9PiB7XHJcbiAgICAgIFV0aWxzLnNldFJvb21EYXRhKHJvb21EYXRhLCBkYXRhQXJyYXksIHNvY2tldCk7XHJcbiAgICAgIGNvbnRyb2wuZ2V0Um9vbURhdGFHTChyb29tRGF0YSk7XHJcbiAgICAgIGNvbnRyb2wuaW5pdEdMKCk7XHJcbiAgICAgIHVwZGF0ZURvd25VSShcInR1cm5cIiwgcm9vbURhdGEuc3RhdGUgPT0gU3RhdGUuQU5HTEVfQ0hPT1NFXHJcbiAgICAgID8gXCJJdCdzIHlvdXIgdHVybiB0byBtYWtlIG1vdmUhXCJcclxuICAgICAgOiBcIldhaXQgZm9yIG9wcG9uZW50XCIpO1xyXG4gICAgICB1cGRhdGVVcHBlclVJKDEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2VuZCByZXF1ZXN0IHRvIGpvaW4gdmFpdGVycyByb29tLlxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqb2luXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgICBpZiAobG9iYnlGbGFnICE9IDApIHtcclxuICAgICAgICBsb2JieUZsYWcgPSAwO1xyXG4gICAgICAgIHNvY2tldC5lbWl0KFwiSm9pbiB3YWl0ZXJzXCIsICcnKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3V0cHV0IGN1cnJlbnQgYW5nbGUuXHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAoZSkgPT4ge1xyXG4gICAgICBpZiAocm9vbURhdGEuc3RhdGUgPT0gU3RhdGUuQU5HTEVfQ0hPT1NFKSB7IC8vIFNldCBzaG9vdCBhbmdsZS5cclxuICAgICAgICBsZXQgbXlDYW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIik7XHJcbiAgICAgICAgbGV0IG1vdXNlWCA9IChlLnBhZ2VYIC0gZS50YXJnZXQub2Zmc2V0TGVmdCkgLyBteUNhbi5jbGllbnRXaWR0aCAqIDIwO1xyXG4gICAgICAgIGxldCBtb3VzZVkgPSAyMCAtIChlLnBhZ2VZIC0gZS50YXJnZXQub2Zmc2V0VG9wKSAvIG15Q2FuLmNsaWVudEhlaWdodCAqIDIwO1xyXG5cclxuICAgICAgICByb29tRGF0YS5zZXRBbmdsZShtb3VzZVgsIG1vdXNlWSk7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbmdsZVwiKS5pbm5lclRleHQgPSBgU2luOiAke3Jvb21EYXRhLnNpbkFuZ2xlLnRvRml4ZWQoNCl9XFxuQ29zOiAke3Jvb21EYXRhLmNvc0FuZ2xlLnRvRml4ZWQoNCl9YDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2VuZCBkYXRhIGFib3V0IHNob290IHRvIHNlcnZlci5cclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgICAgaWYgKHJvb21EYXRhLnN0YXRlID09IFN0YXRlLkFOR0xFX0NIT09TRSkgeyAvLyBTZXQgc2hvb3QgYW5nbGUuXHJcbiAgICAgICAgbGV0IG15Q2FuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpO1xyXG4gICAgICAgIHJvb21EYXRhLnNldEFuZ2xlKFxyXG4gICAgICAgICAgKGUucGFnZVggLSBlLnRhcmdldC5vZmZzZXRMZWZ0KSAvIG15Q2FuLmNsaWVudFdpZHRoICogMjAsXHJcbiAgICAgICAgICAyMCAtIChlLnBhZ2VZIC0gZS50YXJnZXQub2Zmc2V0VG9wKSAvIG15Q2FuLmNsaWVudEhlaWdodCAqIDIwKTtcclxuICAgICAgICByb29tRGF0YS5zdGF0ZSA9IFN0YXRlLlNQRUVEX0NIT09TRTtcclxuICAgICAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xyXG4gICAgICB9IGVsc2UgaWYgKHJvb21EYXRhLnN0YXRlID09IFN0YXRlLlNQRUVEX0NIT09TRSkgeyAvLyBTZXQgc2hvb3Qgc3BlZWQuXHJcblxyXG4gICAgICAgIC8vIGNvbnN0IHRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xyXG4gICAgICAgIC8vIHJvb21EYXRhLnNwZWVkID0gKE1hdGguYWJzKE1hdGguc2luKHRpbWUpKSAqIDE1ICsgNSkgKiAwICsgMTA7XHJcbiAgICAgICAgcm9vbURhdGEuc3BlZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNwZWVkXCIpLnZhbHVlO1xyXG4gICAgICAgIHJvb21EYXRhLnN0YXJ0U2hvdCA9IERhdGUubm93KCk7XHJcblxyXG4gICAgICAgIC8vIEdpdmUgc2hvb3QgZGF0YSB0byBzZXJ2ZXIuXHJcbiAgICAgICAgcm9vbURhdGEuaXNTaG90ID0gdHJ1ZTtcclxuICAgICAgICBzb2NrZXQuZW1pdChcIlNob290IGRhdGFcIiwgW3Jvb21EYXRhLnJvb21JZCwgcm9vbURhdGEuc3BlZWQsIHJvb21EYXRhLnNpbkFuZ2xlLCByb29tRGF0YS5jb3NBbmdsZSwgcm9vbURhdGEuc3RhcnRTaG90XSk7XHJcbiAgICAgICAgY29udHJvbC5nZXRSb29tRGF0YUdMKHJvb21EYXRhKTtcclxuXHJcbiAgICAgICAgcm9vbURhdGEuc3RhdGUgPSBTdGF0ZS5XQUlUSU5HO1xyXG4gICAgICAgIHVwZGF0ZURvd25VSShcInR1cm5cIiwgXCJXYWl0IGZvciBvcHBvbmVudFwiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2VuZCBkYXRhIGFib3V0IGJ1dHRvbiBjbGljayB0byBzZXJ2ZXIgKG1vdmluZykuXHJcblxyXG4gICAgLy8gUm9vbSBkaXNiYW5kZWQgLSBsb3N0IG9wcG9uZW50L1lvdSBhcmUgbmV3IHBsYXllci5cclxuICAgIHNvY2tldC5vbihcIk5vIG9wcG9uZW50XCIsICgpID0+IHtcclxuICAgICAgY29udHJvbC5nZXRSb29tRGF0YUdMKHVuZGVmaW5lZCk7XHJcbiAgICAgIHJvb21EYXRhLnJvb21JZCA9IDA7XHJcbiAgICAgIHJvb21EYXRhLnN0YXRlID0gU3RhdGUuV0FJVElORztcclxuICAgICAgdXBkYXRlVXBwZXJVSSgwKTtcclxuICAgICAgdXBkYXRlRG93blVJKFwidHVyblwiLCBcIlwiKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvc3Qgcm9vbSwgbW92ZSB0byBsb2JieS5cclxuICAgIHNvY2tldC5vbihcIkxvc3Qgcm9vbVwiLCAoKSA9PiB7XHJcbiAgICAgIGNvbnRyb2wuZ2V0Um9vbURhdGFHTCh1bmRlZmluZWQpO1xyXG4gICAgICByb29tRGF0YS5yb29tSWQgPSAwO1xyXG4gICAgICByb29tRGF0YS5zdGF0ZSA9IFN0YXRlLldBSVRJTkc7XHJcbiAgICAgIGxvYmJ5RmxhZyA9IDE7XHJcbiAgICAgIHVwZGF0ZVVwcGVyVUkoMik7XHJcbiAgICAgIHVwZGF0ZURvd25VSShcInR1cm5cIiwgXCJcIik7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZXN1bHQgb2YgcGxheWVyIHNob290LlxyXG4gICAgc29ja2V0Lm9uKFwiU2VsZiBzaG9vdCByZXNcIiwgKHJlcykgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICB1cGRhdGVEb3duVUkoXCJzdWNjZXNzXCIsIHJlc1swXSA9PSB0cnVlID8gXCJTdWNjZXNzXCIgOiBcIk1pc3NlZFwiKTtcclxuICAgICAgfSwgcmVzWzFdICogMTAwMCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBFbmVteSBoYXZlIG5vIGhwLlxyXG4gICAgc29ja2V0Lm9uKFwiRW5kIGdhbWVcIiwgKHJlcykgPT4ge1xyXG4gICAgICBjb250cm9sLmdldFJvb21EYXRhR0wodW5kZWZpbmVkKTtcclxuICAgICAgcm9vbURhdGEucm9vbUlkID0gMDtcclxuICAgICAgcm9vbURhdGEuc3RhdGUgPSBTdGF0ZS5XQUlUSU5HO1xyXG4gICAgICBsb2JieUZsYWcgPSAxO1xyXG4gICAgICB1cGRhdGVVcHBlclVJKDIpO1xyXG4gICAgICB1cGRhdGVEb3duVUkoXCJ0dXJuXCIsIFwiXCIpO1xyXG4gICAgICBnYW1lUmVzdWx0KDEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVzdWx0IG9mIGVuZW15IHNob290LlxyXG4gICAgc29ja2V0Lm9uKFwiRGFtYWdlXCIsIChyZXMpID0+IHtcclxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgaWYgKE51bWJlcihyZXNbMF0pKSB7XHJcbiAgICAgICAgICByb29tRGF0YS5teUhwIC09IDEwMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdXBkYXRlVXBwZXJVSSgxKTtcclxuICAgICAgICAvLyBDa2VjayBpZiBwbGF5ZXIgaGF2ZSBubyBocC5cclxuICAgICAgICBpZiAocm9vbURhdGEubXlIcCA8PSAwKSB7XHJcbiAgICAgICAgICBzb2NrZXQuZW1pdChcIkdhbWUgb3ZlclwiLCByb29tRGF0YS5yb29tSWQpO1xyXG4gICAgICAgICAgY29udHJvbC5nZXRSb29tRGF0YUdMKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICByb29tRGF0YS5yb29tSWQgPSAwO1xyXG4gICAgICAgICAgbG9iYnlGbGFnID0gMTtcclxuICAgICAgICAgIHVwZGF0ZVVwcGVyVUkoMik7XHJcbiAgICAgICAgICB1cGRhdGVEb3duVUkoXCJ0dXJuXCIsIFwiXCIpO1xyXG4gICAgICAgICAgZ2FtZVJlc3VsdCgwKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHJlc1sxXSAqIDEwMDApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUExheWVyJ3MgdHVybiB0byBtYWtlIG1vdmUgYW5kIGVuZW15IHNob290IHJlc3VsdC5cclxuICAgIHNvY2tldC5vbihcIkNoYW5nZWQgdHVyblwiLCAoZGF0YUFycmF5KSA9PiB7XHJcbiAgICAgIHVwZGF0ZURvd25VSShcInR1cm5cIiwgXCJOb3cgaXQncyB5b3VyIHR1cm5cIik7XHJcbiAgICAgIHJvb21EYXRhLnN0YXRlID0gU3RhdGUuQU5HTEVfQ0hPT1NFO1xyXG4gICAgICByb29tRGF0YS5lU2luQW5nbGUgPSBkYXRhQXJyYXlbMl07XHJcbiAgICAgIHJvb21EYXRhLmVDb3NBbmdsZSA9IGRhdGFBcnJheVszXTtcclxuICAgICAgcm9vbURhdGEuZVNwZWVkID0gZGF0YUFycmF5WzFdO1xyXG4gICAgICByb29tRGF0YS5lSXNTaG90ID0gdHJ1ZTtcclxuICAgICAgcm9vbURhdGEuZVN0YXJ0U2hvdCA9IGRhdGFBcnJheVs0XTtcclxuICAgICAgY29udHJvbC5nZXRSb29tRGF0YUdMKHJvb21EYXRhKTsgLy8gR2l2ZSByb29tIGRhdGEgdG8gb3BlbkdMIGNhbnZhcy5cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBQbGF5ZXIgZGlzY29ubmVjdGVkIGZyb20gc2VydmVyLlxyXG4gIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKCkgPT4ge1xyXG4gICAgc29ja2V0Lm9uKFwiTWVzc2FnZUZyb21TZXJ2ZXJcIiwgKG1zZykgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhtc2cpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XHJcbiAgbWFpbigpO1xyXG59KTsiXSwibmFtZXMiOlsid2l0aE5hdGl2ZUJsb2IiLCJ3aXRoTmF0aXZlQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJsb29rdXAiLCJkZWNvZGUiLCJwcm90b2NvbCIsImdsb2JhbFRoaXMiLCJlbmNvZGUiLCJYTUxIdHRwUmVxdWVzdCIsIlNvY2tldCIsIlJFU0VSVkVEX0VWRU5UUyIsIkVuZ2luZSIsImlvIiwiVXRpbHMuc2V0Um9vbURhdGEiLCJjb250cm9sLmdldFJvb21EYXRhR0wiLCJjb250cm9sLmluaXRHTCJdLCJtYXBwaW5ncyI6Ijs7O0lBQUEsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQzNCLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDNUIsWUFBWSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUMzQixZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQzNCLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDOUIsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUM5QixZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQzNCLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUk7SUFDekMsSUFBSSxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsR0FB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QUFDLENBQUM7SUFDcEMsQ0FBQztJQWlCTSxNQUFNQyxRQUFNLEdBQUcsQ0FBQyxNQUFNLEtBQUs7SUFDbEMsSUFBSSxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7SUFDbkgsSUFBSSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtJQUMzQyxRQUFRLFlBQVksRUFBRSxDQUFDO0lBQ3ZCLFFBQVEsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7SUFDL0MsWUFBWSxZQUFZLEVBQUUsQ0FBQztJQUMzQixTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNGLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNqQyxRQUFRLFFBQVEsR0FBR0QsUUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRCxRQUFRLFFBQVEsR0FBR0EsUUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEQsUUFBUSxRQUFRLEdBQUdBLFFBQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BELFFBQVEsUUFBUSxHQUFHQSxRQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FB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QU8sQ0FBQyxFQUFFLEVBQUU7SUFDaEIsUUFBUSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDN0IsS0FBSztJQUNMO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxJQUFJLE1BQU0sR0FBRztJQUNiO0lBQ0EsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkI7SUFDQSxRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDO0lBQ2xDLFFBQVEsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsQztJQUNBLFFBQVEsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNuQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuUSxLQUFLO0lBQ0w7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLElBQUksTUFBTSxHQUFHO0lBQ2IsUUFBUSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLEtBQUs7SUFDTDtJQUNBO0lBQ0E7SUFDQTtJQUNB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LENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztJQUM5QixRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQzlCLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDN0IsUUFBUSxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztJQUM1QixLQUFLO0FBQ0w7SUFDQSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFO0lBQzdCO0lBQ0EsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3pELFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3JHO0lBQ0EsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3pELFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3JHLEtBQUs7SUFDTCxDQUFDOztJQ3BDRDtJQUNPLFNBQVMsV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0lBQ3pEO0lBQ0EsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENB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QyxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25CLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLEtBQUssQ0FBQztJQUNOLEdBQUc7SUFDSDtJQUNBLEVBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRTtJQUNqQixJQUFJLE9BQU8sSUFBSTtJQUNmLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLEtBQUssQ0FBQztJQUNOLEdBQUc7SUFDSDtJQUNBLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRTtJQUNsQixJQUFJLElBQUksQ0FBQztJQUNULE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUIsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQjtJQUNBLElBQUksT0FBTyxJQUFJO0lBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25CLFFBQVEsQ0FBQztJQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQixRQUFRLENBQUM7SUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixRQUFRLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVCLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsUUFBUSxDQUFDO0lBQ1QsS0FBSyxDQUFDO0lBQ04sR0FBRztJQUNIO0lBQ0EsRUFBRSxPQUFPLEdBQUc7SUFDWixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLEdBQUc7SUFDSCxDQUFDO0FBQ0Q7SUFDTyxTQUFTLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRTtJQUM5QixFQUFFLE9BQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0Q7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7QUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0FBQ0E7SUFDQTs7SUM5S0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtBQUNBO0FBNEJBO0lBQ0E7SUFDQTtJQUNBO0FBQ0E7SUFDQTtJQUNBLE1BQU0sS0FBSyxDQUFDO0lBQ1osRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7SUFDN0IsSUFBSSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEI7SUFDQSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxLQUFLO0lBQzdCLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7SUFDdEMsUUFBUSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sTUFBTSxJQUFJLE9BQU8sR0FBRyxJQUFJLFVBQVUsRUFBRTtJQUMzQyxRQUFRLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEMsT0FBTztJQUNQLEtBQUssQ0FBQztJQUNOLEdBQUc7QUFDSDtJQUNBLEVBQUUsV0FBVyxDQUFDLENBQUMsR0FBRyxJQUFJLEVBQUU7SUFDeEIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7SUFD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RSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3JCLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDckIsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNyQixRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sQ0FBQztJQUNSLE1BQU0sT0FBTyxJQUFJLENBQUM7SUFDbEIsS0FBSyxDQUFDLENBQUM7SUFDUCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsS0FBSztJQUM1QyxNQUFNLElBQUksT0FBTyxDQUFDLElBQUksUUFBUSxFQUFFO0lBQ2hDLFFBQVEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsT0FBTztJQUNQLE1BQU0sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEMsS0FBSyxDQUFDLENBQUM7SUFDUCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLO0lBQ2xELE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQztJQUNmLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDckIsUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNyQixRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3JCLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7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QUNyQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUNuRCxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQ2pELElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ25ELElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbkQsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbkQsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztJQUNqRCxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckIsSUFBSSxPQUFPLElBQUksQ0FBQztJQUNoQixHQUFHO0FBQ0g7SUFDQSxFQUFFLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFO0lBQzNCLElBQUksT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RCxHQUFHO0FBQ0g7SUFDQSxFQUFFLFNBQVMsR0FBRztJQUNkLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3QjtJQUNBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUNoQyxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDbEMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQixPQUFPO0lBQ1AsS0FBSztJQUNMLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsR0FBRztBQUNIO0lBQ0EsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFO0lBQ1QsSUFBSSxJQUFJLElBQUksQ0FBQztJQUNiLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtJQUN2QixNQUFNLElBQUksR0FBRyxDQUFDLENBQUM7SUFDZixLQUFLLE1BQU07SUFDWCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLEtBQUs7SUFDTCxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUc7SUFDYixNQUFNO0lBQ04sUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsT0FBTztJQUNQLE1BQU07SUFDTixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuQyxPQUFPO0lBQ1AsTUFBTTtJQUNOLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLE9BQU87SUFDUCxNQUFNO0lBQ04sUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsT0FBTztJQUNQLEtBQUssQ0FBQztJQUNOLElBQUksT0FBTyxJQUFJLENBQUM7SUFDaEIsR0FBRztBQUNIO0lBQ0EsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDekQsSUFBSTtJQUNKLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0lBQ3JCLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0lBQ3JCLE1BQU07SUFDTixHQUFHO0FBQ0g7SUFDQSxFQUFFLE1BQU0sR0FBRztJQUNYLElBQUksSUFBSSxHQUFHO0lBQ1gsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixRQUFRLElBQUksQ0FBQyxTQUFTO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFNBQVM7SUFDVCxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLFFBQVEsSUFBSSxDQUFDLFNBQVM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsU0FBUztJQUNULE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsUUFBUSxJQUFJLENBQUMsU0FBUztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixTQUFTO0lBQ1QsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixRQUFRLElBQUksQ0FBQyxTQUFTO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFVBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0QixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLFNBQVMsQ0FBQztBQUNWO0lBQ0EsSUFBSSxPQUFPLEdBQUcsQ0FBQztJQUNmLEdBQUc7QUFDSDtJQUNBLEVBQUUsT0FBTyxHQUFHO0lBQ1osSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdCLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzVCO0lBQ0EsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUU7SUFDbEIsTUFBTSxJQUFJLENBQUMsR0FBRztJQUNkLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEIsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNwQixRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEIsT0FBTyxDQUFDO0FBQ1I7SUFDQSxNQUFNLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLEtBQUs7QUFDTDtJQUNBO0lBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxJQUFJLENBQUMsU0FBUztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTO0lBQ3JCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxNQUFNLElBQUksQ0FBQyxTQUFTO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVM7SUFDckIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0lBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTO0lBQ3JCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxNQUFNLElBQUksQ0FBQyxTQUFTO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVM7SUFDckIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztJQUNkLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNYLE1BQU0sSUFBSSxDQUFDLFNBQVM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0lBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxJQUFJLENBQUMsU0FBUztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTO0lBQ3JCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxNQUFNLElBQUksQ0FBQyxTQUFTO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVM7SUFDckIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNkO0lBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTO0lBQ3JCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDZDtJQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNYLE1BQU0sSUFBSSxDQUFDLFNBQVM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFHLEdBQUcsQ0FBQztJQUNkLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNYLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUztJQUNyQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1gsTUFBTSxJQUFJLENBQUMsU0FBUztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwQixPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ2QsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNmLElBQUksT0FBTyxJQUFJLENBQUM7SUFDaEIsR0FBRztBQUNIO0lBQ0EsRUFBRSxXQUFXLEdBQUc7SUFDaEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHO0lBQ2IsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQixNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2xCLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEIsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQixLQUFLLENBQUM7SUFDTixJQUFJLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLEdBQUc7QUFDSDtJQUNBLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFO0lBQ3hCLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUU7SUFDckMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUU7SUFDeEMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN4QyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUc7SUFDYixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNoQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0RCxLQUFLLENBQUM7SUFDTixJQUFJLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLEdBQUc7QUFDSDtJQUNBLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQ2hELElBQUksSUFBSSxDQUFDLENBQUMsR0FBRztJQUNiLE1BQU0sQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEMsTUFBTTtJQUNOLFFBQVEsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztJQUN4QyxRQUFRLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUM7SUFDeEMsUUFBUSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ3BDLFFBQVEsQ0FBQztJQUNULE9BQU87SUFDUCxLQUFLLENBQUM7SUFDTixJQUFJLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLEdBQUc7QUFDSDtJQUNBLEVBQUUsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFO0lBQ2xELElBQUksSUFBSSxDQUFDLENBQUMsR0FBRztJQUNiLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEtBQUssS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxLQUFLLEdBQUcsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FB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QUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUIsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsUUFBUSxDQUFDO0lBQ1QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFCLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BCLFFBQVEsQ0FBQztJQUNULEtBQUssQ0FBQztJQUNOLEdBQUc7QUFDSDtJQUNBLEVBQUUsZUFBZSxDQUFDLENBQUMsRUFBRTtJQUNyQixJQUFJLE9BQU8sSUFBSTtJQUNmLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FB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Q0FBQyxDQUFDO0lBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixLQUFLLENBQUM7SUFDTixJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRztJQUNmLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLEtBQUssQ0FBQztJQUNOLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHO0lBQ2xCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNCLEtBQUssQ0FBQztJQUNOLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekQsR0FBRztBQUNIO0lBQ0E7SUFDQSxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtJQUMzQyxJQUFJLElBQUksRUFBRSxHQUFHLFFBQVE7SUFDckIsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDO0FB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R0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLFNBQVMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNsRDtJQUNBLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ2xELEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ2xELEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUNsRCxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDbEQsQ0FBQyxDQUFDO0FBQ0Y7SUFDQSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFFdkQ7SUFDQTtJQUNBO0lBQ0E7SUFDQSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQixNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFlBQVksQ0FBQztJQUN2RCxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUN0RCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDWCxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDZixDQUFDO0lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDaEIsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUNELElBQUksT0FBTyxHQUFHO0lBQ2QsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzdDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDN0MsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDN0MsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM3QyxFQUFFLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM3QyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM3QyxDQUFDLENBQUM7QUFDRjtJQUNBLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN6QztJQUNBLElBQUksU0FBUyxHQUFHO0lBQ2hCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM3QyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzdDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzdDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDN0MsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM3QyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzdDLENBQUMsQ0FBQztBQUNGO0lBQ0EsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBSTNDO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSSxVQUFVLEdBQUc7SUFDakIsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ2hELEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDaEQsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDaEQsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUNoRCxDQUFDLENBQUM7QUFDRjtJQUNBLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMs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QjtJQUNBLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFO0lBQzdELE1BQU0sS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDaEMsS0FBSztBQUNMO0lBQ0E7SUFDQSxJQUFJLElBQUksU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDcEY7SUFDQTtJQUNBLElBQUksSUFBSSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMzRSxJQUFJLElBQUksU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDaEY7SUFDQSxJQUFJLElBQUksVUFBVSxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbkYsSUFBSSxJQUFJLFdBQVcsR0FBRyxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3BGO0lBQ0EsSUFBSSxJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQztBQUN2QjtJQUNBO0lBQ0EsSUFBSSxJQUFJLFNBQVMsRUFBRSxTQUFTLENBQUM7SUFDN0IsSUFBSSxJQUFJLFFBQVEsRUFBRSxRQUFRLENBQUM7QUFDM0I7SUFDQSxJQUFJLElBQUksVUFBVSxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUU7SUFDaEMsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FB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LElBQUksUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUU7SUFDaEMsVUFBVSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEQsVUFBVUEsYUFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMzQyxVQUFVLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLFVBQVUsU0FBUyxHQUFHLENBQUMsQ0FBQztJQUN4QixVQUFVLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQixVQUFVLFlBQVksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbkMsVUFBVSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsU0FBUztJQUNULE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDeEIsS0FBSyxDQUFDLENBQUM7QUFDUDtJQUNBO0lBQ0EsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLFNBQVMsS0FBSztJQUM3QyxNQUFNLFlBQVksQ0FBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUNqRCxNQUFNLFFBQVEsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUMxQyxNQUFNLFFBQVEsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLE1BQU0sUUFBUSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEMsTUFBTSxRQUFRLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxNQUFNLFFBQVEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQzlCLE1BQU0sUUFBUSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekMsTUFBTUEsYUFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0QyxLQUFLLENBQUMsQ0FBQztJQUNQLEdBQUcsQ0FBQyxDQUFDO0FBQ0w7SUFDQTtJQUNBLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTTtJQUNoQyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxHQUFHLEtBQUs7SUFDNUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZCLEtBQUssQ0FBQyxDQUFDO0lBQ1AsR0FBRyxDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0Q7SUFDQSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE1BQU07SUFDdEMsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNULENBQUMsQ0FBQzs7Ozs7OyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDEsMiwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3XX0=
