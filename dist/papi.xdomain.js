// XDomain - v0.7.3 - https://github.com/jpillora/xdomain
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2015
(function(window,undefined) {
// XHook - v1.3.3 - https://github.com/jpillora/xhook
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2015
(function(window,undefined) {
var AFTER, BEFORE, COMMON_EVENTS, EventEmitter, FIRE, FormData, NativeFormData, NativeXMLHttp, OFF, ON, READY_STATE, UPLOAD_EVENTS, XHookFormData, XHookHttpRequest, XMLHTTP, convertHeaders, depricatedProp, document, fakeEvent, mergeObjects, msie, proxyEvents, slice, xhook, _base,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

document = window.document;

BEFORE = 'before';

AFTER = 'after';

READY_STATE = 'readyState';

ON = 'addEventListener';

OFF = 'removeEventListener';

FIRE = 'dispatchEvent';

XMLHTTP = 'XMLHttpRequest';

FormData = 'FormData';

UPLOAD_EVENTS = ['load', 'loadend', 'loadstart'];

COMMON_EVENTS = ['progress', 'abort', 'error', 'timeout'];

msie = parseInt((/msie (\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);

if (isNaN(msie)) {
  msie = parseInt((/trident\/.*; rv:(\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
}

(_base = Array.prototype).indexOf || (_base.indexOf = function(item) {
  var i, x, _i, _len;
  for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
    x = this[i];
    if (x === item) {
      return i;
    }
  }
  return -1;
});

slice = function(o, n) {
  return Array.prototype.slice.call(o, n);
};

depricatedProp = function(p) {
  return p === "returnValue" || p === "totalSize" || p === "position";
};

mergeObjects = function(src, dst) {
  var k, v;
  for (k in src) {
    v = src[k];
    if (depricatedProp(k)) {
      continue;
    }
    try {
      dst[k] = src[k];
    } catch (_error) {}
  }
  return dst;
};

proxyEvents = function(events, src, dst) {
  var event, p, _i, _len;
  p = function(event) {
    return function(e) {
      var clone, k, val;
      clone = {};
      for (k in e) {
        if (depricatedProp(k)) {
          continue;
        }
        val = e[k];
        clone[k] = val === src ? dst : val;
      }
      return dst[FIRE](event, clone);
    };
  };
  for (_i = 0, _len = events.length; _i < _len; _i++) {
    event = events[_i];
    if (dst._has(event)) {
      src["on" + event] = p(event);
    }
  }
};

fakeEvent = function(type) {
  var msieEventObject;
  if (document.createEventObject != null) {
    msieEventObject = document.createEventObject();
    msieEventObject.type = type;
    return msieEventObject;
  } else {
    try {
      return new Event(type);
    } catch (_error) {
      return {
        type: type
      };
    }
  }
};

EventEmitter = function(nodeStyle) {
  var emitter, events, listeners;
  events = {};
  listeners = function(event) {
    return events[event] || [];
  };
  emitter = {};
  emitter[ON] = function(event, callback, i) {
    events[event] = listeners(event);
    if (events[event].indexOf(callback) >= 0) {
      return;
    }
    i = i === undefined ? events[event].length : i;
    events[event].splice(i, 0, callback);
  };
  emitter[OFF] = function(event, callback) {
    var i;
    if (event === undefined) {
      events = {};
      return;
    }
    if (callback === undefined) {
      events[event] = [];
    }
    i = listeners(event).indexOf(callback);
    if (i === -1) {
      return;
    }
    listeners(event).splice(i, 1);
  };
  emitter[FIRE] = function() {
    var args, event, i, legacylistener, listener, _i, _len, _ref;
    args = slice(arguments);
    event = args.shift();
    if (!nodeStyle) {
      args[0] = mergeObjects(args[0], fakeEvent(event));
    }
    legacylistener = emitter["on" + event];
    if (legacylistener) {
      legacylistener.apply(undefined, args);
    }
    _ref = listeners(event).concat(listeners("*"));
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      listener = _ref[i];
      listener.apply(undefined, args);
    }
  };
  emitter._has = function(event) {
    return !!(events[event] || emitter["on" + event]);
  };
  if (nodeStyle) {
    emitter.listeners = function(event) {
      return slice(listeners(event));
    };
    emitter.on = emitter[ON];
    emitter.off = emitter[OFF];
    emitter.fire = emitter[FIRE];
    emitter.once = function(e, fn) {
      var fire;
      fire = function() {
        emitter.off(e, fire);
        return fn.apply(null, arguments);
      };
      return emitter.on(e, fire);
    };
    emitter.destroy = function() {
      return events = {};
    };
  }
  return emitter;
};

xhook = EventEmitter(true);

xhook.EventEmitter = EventEmitter;

xhook[BEFORE] = function(handler, i) {
  if (handler.length < 1 || handler.length > 2) {
    throw "invalid hook";
  }
  return xhook[ON](BEFORE, handler, i);
};

xhook[AFTER] = function(handler, i) {
  if (handler.length < 2 || handler.length > 3) {
    throw "invalid hook";
  }
  return xhook[ON](AFTER, handler, i);
};

xhook.enable = function() {
  window[XMLHTTP] = XHookHttpRequest;
  if (NativeFormData) {
    window[FormData] = XHookFormData;
  }
};

xhook.disable = function() {
  window[XMLHTTP] = xhook[XMLHTTP];
  window[FormData] = NativeFormData;
};

convertHeaders = xhook.headers = function(h, dest) {
  var header, headers, k, name, v, value, _i, _len, _ref;
  if (dest == null) {
    dest = {};
  }
  switch (typeof h) {
    case "object":
      headers = [];
      for (k in h) {
        v = h[k];
        name = k.toLowerCase();
        headers.push("" + name + ":\t" + v);
      }
      return headers.join('\n');
    case "string":
      headers = h.split('\n');
      for (_i = 0, _len = headers.length; _i < _len; _i++) {
        header = headers[_i];
        if (/([^:]+):\s*(.+)/.test(header)) {
          name = (_ref = RegExp.$1) != null ? _ref.toLowerCase() : void 0;
          value = RegExp.$2;
          if (dest[name] == null) {
            dest[name] = value;
          }
        }
      }
      return dest;
  }
};

NativeFormData = window[FormData];

XHookFormData = function(form) {
  var entries;
  this.fd = form ? new NativeFormData(form) : new NativeFormData();
  this.form = form;
  entries = [];
  Object.defineProperty(this, 'entries', {
    get: function() {
      var fentries;
      fentries = !form ? [] : slice(form.querySelectorAll("input,select")).filter(function(e) {
        var _ref;
        return ((_ref = e.type) !== 'checkbox' && _ref !== 'radio') || e.checked;
      }).map(function(e) {
        return [e.name, e.type === "file" ? e.files : e.value];
      });
      return fentries.concat(entries);
    }
  });
  this.append = (function(_this) {
    return function() {
      var args;
      args = slice(arguments);
      entries.push(args);
      return _this.fd.append.apply(_this.fd, args);
    };
  })(this);
};

if (NativeFormData) {
  xhook[FormData] = NativeFormData;
  window[FormData] = XHookFormData;
}

NativeXMLHttp = window[XMLHTTP];

xhook[XMLHTTP] = NativeXMLHttp;

XHookHttpRequest = window[XMLHTTP] = function() {
  var ABORTED, currentState, emitFinal, emitReadyState, facade, hasError, hasErrorHandler, readBody, readHead, request, response, setReadyState, status, transiting, writeBody, writeHead, xhr;
  ABORTED = -1;
  xhr = new xhook[XMLHTTP]();
  request = {};
  status = null;
  hasError = void 0;
  transiting = void 0;
  response = void 0;
  readHead = function() {
    var key, name, val, _ref;
    response.status = status || xhr.status;
    if (!(status === ABORTED && msie < 10)) {
      response.statusText = xhr.statusText;
    }
    if (status !== ABORTED) {
      _ref = convertHeaders(xhr.getAllResponseHeaders());
      for (key in _ref) {
        val = _ref[key];
        if (!response.headers[key]) {
          name = key.toLowerCase();
          response.headers[name] = val;
        }
      }
    }
  };
  readBody = function() {
    if (!xhr.responseType || xhr.responseType === "text") {
      response.text = xhr.responseText;
      response.data = xhr.responseText;
    } else if (xhr.responseType === "document") {
      response.xml = xhr.responseXML;
      response.data = xhr.responseXML;
    } else {
      response.data = xhr.response;
    }
    if ("responseURL" in xhr) {
      response.finalUrl = xhr.responseURL;
    }
  };
  writeHead = function() {
    facade.status = response.status;
    facade.statusText = response.statusText;
  };
  writeBody = function() {
    if ('text' in response) {
      facade.responseText = response.text;
    }
    if ('xml' in response) {
      facade.responseXML = response.xml;
    }
    if ('data' in response) {
      facade.response = response.data;
    }
    if ('finalUrl' in response) {
      facade.responseURL = response.finalUrl;
    }
  };
  emitReadyState = function(n) {
    while (n > currentState && currentState < 4) {
      facade[READY_STATE] = ++currentState;
      if (currentState === 1) {
        facade[FIRE]("loadstart", {});
      }
      if (currentState === 2) {
        writeHead();
      }
      if (currentState === 4) {
        writeHead();
        writeBody();
      }
      facade[FIRE]("readystatechange", {});
      if (currentState === 4) {
        setTimeout(emitFinal, 0);
      }
    }
  };
  emitFinal = function() {
    if (!hasError) {
      facade[FIRE]("load", {});
    }
    facade[FIRE]("loadend", {});
    if (hasError) {
      facade[READY_STATE] = 0;
    }
  };
  currentState = 0;
  setReadyState = function(n) {
    var hooks, process;
    if (n !== 4) {
      emitReadyState(n);
      return;
    }
    hooks = xhook.listeners(AFTER);
    process = function() {
      var hook;
      if (!hooks.length) {
        return emitReadyState(4);
      }
      hook = hooks.shift();
      if (hook.length === 2) {
        hook(request, response);
        return process();
      } else if (hook.length === 3 && request.async) {
        return hook(request, response, process);
      } else {
        return process();
      }
    };
    process();
  };
  facade = request.xhr = EventEmitter();
  xhr.onreadystatechange = function(event) {
    try {
      if (xhr[READY_STATE] === 2) {
        readHead();
      }
    } catch (_error) {}
    if (xhr[READY_STATE] === 4) {
      transiting = false;
      readHead();
      readBody();
    }
    setReadyState(xhr[READY_STATE]);
  };
  hasErrorHandler = function() {
    hasError = true;
  };
  facade[ON]('error', hasErrorHandler);
  facade[ON]('timeout', hasErrorHandler);
  facade[ON]('abort', hasErrorHandler);
  facade[ON]('progress', function() {
    if (currentState < 3) {
      setReadyState(3);
    } else {
      facade[FIRE]("readystatechange", {});
    }
  });
  if ('withCredentials' in xhr || xhook.addWithCredentials) {
    facade.withCredentials = false;
  }
  facade.status = 0;
  facade.open = function(method, url, async, user, pass) {
    currentState = 0;
    hasError = false;
    transiting = false;
    request.headers = {};
    request.headerNames = {};
    request.status = 0;
    response = {};
    response.headers = {};
    request.method = method;
    request.url = url;
    request.async = async !== false;
    request.user = user;
    request.pass = pass;
    setReadyState(1);
  };
  facade.send = function(body) {
    var hooks, k, modk, process, send, _i, _len, _ref;
    _ref = ['type', 'timeout', 'withCredentials'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      modk = k === "type" ? "responseType" : k;
      if (modk in facade) {
        request[k] = facade[modk];
      }
    }
    request.body = body;
    send = function() {
      var header, value, _j, _len1, _ref1, _ref2;
      proxyEvents(COMMON_EVENTS, xhr, facade);
      if (facade.upload) {
        proxyEvents(COMMON_EVENTS.concat(UPLOAD_EVENTS), xhr.upload, facade.upload);
      }
      transiting = true;
      xhr.open(request.method, request.url, request.async, request.user, request.pass);
      _ref1 = ['type', 'timeout', 'withCredentials'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        k = _ref1[_j];
        modk = k === "type" ? "responseType" : k;
        if (k in request) {
          xhr[modk] = request[k];
        }
      }
      _ref2 = request.headers;
      for (header in _ref2) {
        value = _ref2[header];
        xhr.setRequestHeader(header, value);
      }
      if (request.body instanceof XHookFormData) {
        request.body = request.body.fd;
      }
      xhr.send(request.body);
    };
    hooks = xhook.listeners(BEFORE);
    process = function() {
      var done, hook;
      if (!hooks.length) {
        return send();
      }
      done = function(userResponse) {
        if (typeof userResponse === 'object' && (typeof userResponse.status === 'number' || typeof response.status === 'number')) {
          mergeObjects(userResponse, response);
          if (__indexOf.call(userResponse, 'data') < 0) {
            userResponse.data = userResponse.response || userResponse.text;
          }
          setReadyState(4);
          return;
        }
        process();
      };
      done.head = function(userResponse) {
        mergeObjects(userResponse, response);
        return setReadyState(2);
      };
      done.progress = function(userResponse) {
        mergeObjects(userResponse, response);
        return setReadyState(3);
      };
      hook = hooks.shift();
      if (hook.length === 1) {
        return done(hook(request));
      } else if (hook.length === 2 && request.async) {
        return hook(request, done);
      } else {
        return done();
      }
    };
    process();
  };
  facade.abort = function() {
    status = ABORTED;
    if (transiting) {
      xhr.abort();
    } else {
      facade[FIRE]('abort', {});
    }
  };
  facade.setRequestHeader = function(header, value) {
    var lName, name;
    lName = header != null ? header.toLowerCase() : void 0;
    name = request.headerNames[lName] = request.headerNames[lName] || header;
    if (request.headers[name]) {
      value = request.headers[name] + ', ' + value;
    }
    request.headers[name] = value;
  };
  facade.getResponseHeader = function(header) {
    var name;
    name = header != null ? header.toLowerCase() : void 0;
    return response.headers[name];
  };
  facade.getAllResponseHeaders = function() {
    return convertHeaders(response.headers);
  };
  if (xhr.overrideMimeType) {
    facade.overrideMimeType = function() {
      return xhr.overrideMimeType.apply(xhr, arguments);
    };
  }
  if (xhr.upload) {
    facade.upload = request.upload = EventEmitter();
  }
  return facade;
};

if (typeof this.define === "function" && this.define.amd) {
  define("xhook", [], function() {
    return xhook;
  });
} else {
  (this.exports || this).xhook = xhook;
}

}.call(this,window));
var CHECK_INTERVAL, COMPAT_VERSION, XD_CHECK, console, cookies, createSocket, currentOrigin, document, emitter, feature, frames, getFrame, guid, handleSocket, initMaster, initSlave, initdMaster, initdSlave, instOf, jsonEncode, location, log, logger, masters, onMessage, parseUrl, setupEmitter, slaves, slice, sockets, startPostMessage, strip, toRegExp, warn, xdomain, xhook, _i, _len, _ref;

initdMaster = false;

slaves = function(s) {
  var origin, path;
  if (!initdMaster) {
    initMaster();
  }
  for (origin in s) {
    path = s[origin];
    log("adding slave: " + origin);
    slaves[origin] = path;
  }
};

frames = {};

getFrame = function(origin, proxyPath) {
  var frame;
  if (frames[origin]) {
    return frames[origin];
  }
  frame = document.createElement("iframe");
  frame.id = frame.name = guid();
  log("creating iframe " + frame.id);
  frame.src = "" + origin + proxyPath;
  frame.setAttribute('style', 'display:none;');
  document.body.appendChild(frame);
  return frames[origin] = frame.contentWindow;
};

initMaster = function() {
  var convertFormData, convertToArrayBuffer, handleRequest;
  initdMaster = true;
  convertToArrayBuffer = function(args, done) {
    var isBlob, isFile, name, obj, reader;
    name = args[0], obj = args[1];
    isBlob = instOf(obj, 'Blob');
    isFile = instOf(obj, 'File');
    if (!(isBlob || isFile)) {
      return 0;
    }
    reader = new FileReader();
    reader.onload = function() {
      args[1] = null;
      if (isFile) {
        args[2] = obj.name;
      }
      return done(['XD_BLOB', args, this.result, obj.type]);
    };
    reader.readAsArrayBuffer(obj);
    return 1;
  };
  convertFormData = function(entries, send) {
    var c;
    entries.forEach(function(args, i) {
      var file, name, value, _i, _len;
      name = args[0], value = args[1];
      if (instOf(value, 'FileList')) {
        entries.splice(i, 1);
        for (_i = 0, _len = value.length; _i < _len; _i++) {
          file = value[_i];
          entries.splice(i, 0, [name, file]);
        }
      }
    });
    c = 0;
    entries.forEach(function(args, i) {
      c += convertToArrayBuffer(args, function(newargs) {
        entries[i] = newargs;
        if (--c === 0) {
          send();
        }
      });
    });
    if (c === 0) {
      send();
    }
  };
  handleRequest = function(request, socket) {
    var entries, obj, send;
    socket.on("xhr-event", function() {
      return request.xhr.dispatchEvent.apply(null, arguments);
    });
    socket.on("xhr-upload-event", function() {
      return request.xhr.upload.dispatchEvent.apply(null, arguments);
    });
    obj = strip(request);
    obj.headers = request.headers;
    if (request.withCredentials) {
      if (cookies.master) {
        obj.headers[cookies.master] = document.cookie;
      }
      obj.slaveCookie = cookies.slave;
    }
    send = function() {
      return socket.emit("request", obj);
    };
    if (request.body) {
      obj.body = request.body;
      if (instOf(obj.body, 'FormData')) {
        entries = obj.body.entries;
        obj.body = ["XD_FD", entries];
        convertFormData(entries, send);
        return;
      }
    }
    send();
  };
  if (!('addWithCredentials' in xhook)) {
    xhook.addWithCredentials = true;
  }
  return xhook.before(function(request, callback) {
    var frame, p, socket;
    p = parseUrl(request.url);
    if (!p || p.origin === currentOrigin) {
      return callback();
    }
    if (!slaves[p.origin]) {
      if (p) {
        log("no slave matching: '" + p.origin + "'");
      }
      return callback();
    }
    log("proxying request to slave: '" + p.origin + "'");
    if (request.async === false) {
      warn("sync not supported");
      return callback();
    }
    frame = getFrame(p.origin, slaves[p.origin]);
    socket = createSocket(guid(), frame);
    socket.on("response", function(resp) {
      callback(resp);
      return socket.close();
    });
    request.xhr.addEventListener('abort', function() {
      return socket.emit("abort");
    });
    if (socket.ready) {
      handleRequest(request, socket);
    } else {
      socket.once('ready', function() {
        return handleRequest(request, socket);
      });
    }
  });
};

initdSlave = false;

masters = function(m) {
  var origin, path;
  if (!initdSlave) {
    initSlave();
  }
  for (origin in m) {
    path = m[origin];
    log("adding master: " + origin);
    masters[origin] = path;
  }
};

handleSocket = null;

initSlave = function() {
  initdSlave = true;
  log("handling incoming sockets...");
  handleSocket = function(origin, socket) {
    var master, masterRegex, pathRegex, regex;
    if (origin === "null") {
      origin = "*";
    }
    pathRegex = null;
    for (master in masters) {
      regex = masters[master];
      try {
        masterRegex = toRegExp(master);
        if (masterRegex.test(origin)) {
          pathRegex = toRegExp(regex);
          break;
        }
      } catch (_error) {}
    }
    if (!pathRegex) {
      warn("blocked request from: '" + origin + "'");
      return;
    }
    socket.once("request", function(req) {
      var args, blob, entries, fd, k, p, v, xhr, _i, _len, _ref;
      log("request: " + req.method + " " + req.url);
      p = parseUrl(req.url);
      if (!(p && pathRegex.test(p.path))) {
        warn("blocked request to path: '" + p.path + "' by regex: " + pathRegex);
        socket.close();
        return;
      }
      xhr = new XMLHttpRequest();
      xhr.open(req.method, req.url);
      xhr.addEventListener("*", function(e) {
        return socket.emit('xhr-event', e.type, strip(e));
      });
      if (xhr.upload) {
        xhr.upload.addEventListener("*", function(e) {
          return socket.emit('xhr-upload-event', e.type, strip(e));
        });
      }
      socket.once("abort", function() {
        return xhr.abort();
      });
      xhr.onreadystatechange = function() {
        var resp;
        if (xhr.readyState !== 4) {
          return;
        }
        resp = {
          status: xhr.status,
          statusText: xhr.statusText,
          data: xhr.response,
          headers: xhook.headers(xhr.getAllResponseHeaders())
        };
        try {
          resp.text = xhr.responseText;
        } catch (_error) {}
        return socket.emit('response', resp);
      };
      if (req.withCredentials) {
        xhr.withCredentials = true;
        if (req.slaveCookie) {
          req.headers[req.slaveCookie] = document.cookie;
        }
      }
      if (req.timeout) {
        xhr.timeout = req.timeout;
      }
      if (req.type) {
        xhr.responseType = req.type;
      }
      _ref = req.headers;
      for (k in _ref) {
        v = _ref[k];
        xhr.setRequestHeader(k, v);
      }
      if (req.body instanceof Array && req.body[0] === "XD_FD") {
        fd = new xhook.FormData();
        entries = req.body[1];
        for (_i = 0, _len = entries.length; _i < _len; _i++) {
          args = entries[_i];
          if (args[0] === "XD_BLOB" && args.length === 4) {
            blob = new Blob([args[2]], {
              type: args[3]
            });
            args = args[1];
            args[1] = blob;
          }
          fd.append.apply(fd, args);
        }
        req.body = fd;
      }
      xhr.send(req.body || null);
    });
    log("slave listening for requests on socket: " + socket.id);
  };
  if (window === window.parent) {
    return warn("slaves must be in an iframe");
  } else {
    return window.parent.postMessage("XDPING_" + COMPAT_VERSION, '*');
  }
};

XD_CHECK = "XD_CHECK";

sockets = {};

jsonEncode = true;

createSocket = function(id, frame) {
  var check, checks, emit, pendingEmits, ready, sock;
  ready = false;
  sock = sockets[id] = xhook.EventEmitter(true);
  sock.id = id;
  sock.once('close', function() {
    sock.destroy();
    return sock.close();
  });
  pendingEmits = [];
  sock.emit = function() {
    var args, extra;
    args = slice(arguments);
    extra = typeof args[1] === "string" ? " -> " + args[1] : "";
    log("send socket: " + id + ": " + args[0] + extra);
    args.unshift(id);
    if (ready) {
      emit(args);
    } else {
      pendingEmits.push(args);
    }
  };
  emit = function(args) {
    if (jsonEncode) {
      args = JSON.stringify(args);
    }
    frame.postMessage(args, "*");
  };
  sock.close = function() {
    sock.emit('close');
    log("close socket: " + id);
    sockets[id] = null;
  };
  sock.once(XD_CHECK, function(obj) {
    jsonEncode = typeof obj === "string";
    ready = sock.ready = true;
    sock.emit('ready');
    log("ready socket: " + id + " (emit #" + pendingEmits.length + " pending)");
    while (pendingEmits.length) {
      emit(pendingEmits.shift());
    }
  });
  checks = 0;
  check = (function(_this) {
    return function() {
      frame.postMessage([id, XD_CHECK, {}], "*");
      if (ready) {
        return;
      }
      if (checks++ >= xdomain.timeout / CHECK_INTERVAL) {
        warn("Timeout waiting on iframe socket");
        emitter.fire("timeout");
        sock.fire("abort");
      } else {
        setTimeout(check, CHECK_INTERVAL);
      }
    };
  })(this);
  setTimeout(check);
  log("new socket: " + id);
  return sock;
};

onMessage = function(fn) {
  if (document.addEventListener) {
    return window.addEventListener("message", fn);
  } else {
    return window.attachEvent("onmessage", fn);
  }
};

startPostMessage = function() {
  return onMessage(function(e) {
    var d, extra, id, sock;
    d = e.data;
    if (typeof d === "string") {
      if (/^XDPING(_(V\d+))?$/.test(d) && RegExp.$2 !== COMPAT_VERSION) {
        return warn("your master is not compatible with your slave, check your xdomain.js version");
      } else if (/^xdomain-/.test(d)) {
        d = d.split(",");
      } else if (jsonEncode) {
        try {
          d = JSON.parse(d);
        } catch (_error) {
          return;
        }
      }
    }
    if (!(d instanceof Array)) {
      return;
    }
    id = d.shift();
    if (!/^xdomain-/.test(id)) {
      return;
    }
    sock = sockets[id];
    if (sock === null) {
      return;
    }
    if (sock === undefined) {
      if (!handleSocket) {
        return;
      }
      sock = createSocket(id, e.source);
      handleSocket(e.origin, sock);
    }
    extra = typeof d[1] === "string" ? " -> " + d[1] : "";
    log("receive socket: " + id + ": " + d[0] + extra);
    sock.fire.apply(sock, d);
  });
};

'use strict';

xhook = (this.exports || this).xhook;

xdomain = function(o) {
  if (!o) {
    return;
  }
  if (o.masters) {
    masters(o.masters);
  }
  if (o.slaves) {
    slaves(o.slaves);
  }
};

xdomain.masters = masters;

xdomain.slaves = slaves;

xdomain.debug = false;

xdomain.timeout = 15e3;

CHECK_INTERVAL = 100;

cookies = xdomain.cookies = {
  master: "Master-Cookie",
  slave: "Slave-Cookie"
};

document = window.document;

location = window.location;

currentOrigin = xdomain.origin = location.protocol + '//' + location.host;

guid = function() {
  return 'xdomain-' + Math.round(Math.random() * Math.pow(2, 32)).toString(16);
};

slice = function(o, n) {
  return Array.prototype.slice.call(o, n);
};

console = window.console || {};

emitter = null;

setupEmitter = function() {
  emitter = xhook.EventEmitter(true);
  xdomain.on = emitter.on;
  xdomain.off = emitter.off;
};

if (xhook) {
  setupEmitter();
}

logger = function(type) {
  return function(str) {
    str = "xdomain (" + currentOrigin + "): " + str;
    emitter.fire(type, str);
    if (type === 'log' && !xdomain.debug) {
      return;
    }
    if (type in xdomain) {
      xdomain[type](str);
    } else if (type in console) {
      console[type](str);
    } else if (type === 'warn') {
      alert(str);
    }
  };
};

log = logger('log');

warn = logger('warn');

_ref = ['postMessage', 'JSON'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  feature = _ref[_i];
  if (!window[feature]) {
    warn("requires '" + feature + "' and this browser does not support it");
    return;
  }
}

instOf = function(obj, global) {
  if (!(global in window)) {
    return false;
  }
  return obj instanceof window[global];
};

COMPAT_VERSION = "V1";

parseUrl = xdomain.parseUrl = function(url) {
  if (/^((https?:)?\/\/[^\/\?]+)(\/.*)?/.test(url)) {
    return {
      origin: (RegExp.$2 ? '' : location.protocol) + RegExp.$1,
      path: RegExp.$3
    };
  } else {
    log("failed to parse absolute url: " + url);
    return null;
  }
};

toRegExp = function(obj) {
  var str;
  if (obj instanceof RegExp) {
    return obj;
  }
  str = obj.toString().replace(/\W/g, function(str) {
    return "\\" + str;
  }).replace(/\\\*/g, ".*");
  return new RegExp("^" + str + "$");
};

strip = function(src) {
  var dst, k, v, _ref1;
  dst = {};
  for (k in src) {
    if (k === "returnValue") {
      continue;
    }
    v = src[k];
    if ((_ref1 = typeof v) !== "function" && _ref1 !== "object") {
      dst[k] = v;
    }
  }
  return dst;
};

(function() {
  var attrs, fn, k, prefix, script, _j, _k, _len1, _len2, _ref1, _ref2;
  attrs = {
    debug: function(value) {
      if (typeof value !== "string") {
        return;
      }
      return xdomain.debug = value !== "false";
    },
    slave: function(value) {
      var p, s;
      if (!value) {
        return;
      }
      p = parseUrl(value);
      if (!p) {
        return;
      }
      s = {};
      s[p.origin] = p.path;
      return slaves(s);
    },
    master: function(value) {
      var m, p;
      if (!value) {
        return;
      }
      if (value === "*") {
        p = {
          origin: "*",
          path: "*"
        };
      } else {
        p = parseUrl(value);
      }
      if (!p) {
        return;
      }
      m = {};
      m[p.origin] = p.path.replace(/^\//, "") ? p.path : "*";
      return masters(m);
    }
  };
  _ref1 = document.getElementsByTagName("script");
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    script = _ref1[_j];
    if (/xdomain/.test(script.src)) {
      _ref2 = ['', 'data-'];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        prefix = _ref2[_k];
        for (k in attrs) {
          fn = attrs[k];
          fn(script.getAttribute(prefix + k));
        }
      }
    }
  }
})();

startPostMessage();

if (typeof this.define === "function" && this.define.amd) {
  define("xdomain", ["xhook"], function(xh) {
    xhook = xh;
    setupEmitter();
    return xdomain;
  });
} else {
  (this.exports || this).xdomain = xdomain;
}

}.call(this,window));
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Papi = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

//import Promise from 'bluebird'; // XXX No longer require advanced features of bluebird. just use babels promise lib instead

var _resourceSchema = require('./resource-schema');

var _resourceSchema2 = _interopRequireDefault(_resourceSchema);

function hasXDomain() {
  return typeof window !== 'undefined' && window.xdomain != null;
}

var Papi = (function (_ResourceSchema) {
  _inherits(Papi, _ResourceSchema);

  function Papi() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Papi);

    _ResourceSchema.apply(this, arguments);

    this.options = options;
    this.options.host = options.host || 'https://api.pressly.com';

    if (hasXDomain()) {
      var slaves = {};
      slaves[this.options.host] = '/proxy.html';
      window.xdomain.slaves(slaves);
    }

    this.requestMiddlewares = [];
    this.responseMiddlewares = [];

    this.auth = {
      session: null,

      get: function get() {
        return _this.request('get', '/session').then(function (res) {
          return _this.auth.set(res.body);
        });
      },

      set: function set(session) {
        if (!session.jwt) {
          throw new Error('Papi:Auth: Invalid session response - missing jwt');
        }

        _this.auth.session = session;

        return _this.auth.session;
      },

      isLoggedIn: function isLoggedIn() {
        return !!_this.auth.session && !_this.auth.isExpired();
      },

      isExpired: function isExpired() {
        // XXX this should be using a jwt lib to figure out if the token has expired
        // XXX We do not currently include an expiry param in our tokens so just return false.
        return false;
      },

      login: function login(email, password) {
        return _this.request('post', '/auth/login', { data: { email: email, password: password } }).then(function (res) {
          return _this.auth.set(res.body);
        });
      },

      requestPasswordReset: function requestPasswordReset(email) {
        return _this.request('post', '/auth/password_reset/send', { data: { email: email } });
      },

      logout: function logout() {
        return _this.request('delete', '/session').then(function (res) {
          _this.auth.session = null;

          return res;
        });
      }
    };
  }

  // <= IE10, does not support static method inheritance

  Papi.prototype.request = function request(method, path) {
    var _this2 = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    return new Promise(function (resolve, reject) {
      var url = /^(https?:)?\/\//.test(path) ? path : _this2.options.host + path;

      // Doesn't allow the delete keyword because it is reserved
      if (method == 'delete') {
        method = 'del';
      }

      var req = _superagent2['default'][method](url);
      var res = {};

      req.set('Content-Type', 'application/json');

      if (options.timeout || _this2.options.timeout) {
        req.timeout(options.timeout || _this2.options.timeout);
      }

      // Allow sending cookies from origin
      if (typeof req.withCredentials == 'function' && !hasXDomain()) {
        req.withCredentials();
      }

      // Send Authorization header when we have a JSON Web Token set in the session
      if (_this2.auth.session && _this2.auth.session.jwt) {
        req.set('Authorization', 'Bearer ' + _this2.auth.session.jwt);
      }

      req.set('Accept', 'application/vnd.pressly.v0.12+json');

      // Query params to be added to the url
      if (options.query) {
        req.query(options.query);
      }

      // Data to send (with get requests these are converted into query params)
      if (options.data) {
        if (method == 'get') {
          req.query(options.data);
        } else {
          req.send(options.data);
        }
      }

      var beginRequest = function beginRequest() {
        if (_this2.requestMiddlewares.length) {
          var offset = 0;
          var next = function next() {
            var layer = _this2.requestMiddlewares[++offset] || endRequest;
            req.next = next;
            return layer(req, res, next, resolve, reject);
          };

          _this2.requestMiddlewares[0](req, res, next, resolve, reject);
        } else {
          endRequest();
        }
      };

      var endRequest = function endRequest() {
        req.end(function (err, completedRes) {
          if (err) {
            return reject(err);
          } else {
            res = completedRes;
            beginResponse();
          }
        });
      };

      var beginResponse = function beginResponse() {
        if (_this2.responseMiddlewares.length) {
          var offset = 0;
          var next = function next() {
            var layer = _this2.responseMiddlewares[++offset] || endResponse;
            req.next = next;
            return layer(req, res, next, resolve, reject);
          };

          _this2.responseMiddlewares[0](req, res, next, resolve, reject);
        } else {
          endResponse();
        }
      };

      var endResponse = function endResponse() {
        resolve(res);
      };

      beginRequest();
    });
  };

  Papi.prototype.before = function before(middleware) {
    this.requestMiddlewares.push(middleware);
  };

  Papi.prototype.after = function after(middleware) {
    this.responseMiddlewares.push(middleware);
  };

  return Papi;
})(_resourceSchema2['default']);

exports['default'] = Papi;
if (Papi.defineSchema == undefined) {
  Papi.defineSchema = _resourceSchema2['default'].defineSchema;
}

Papi.defineSchema().resource('accounts').open().get('available', { on: 'resource' }).post('become', { on: 'member' }).resource('users').resource('hubs', { link: 'hubs' }).close().resource('organizations').open().resource('users').resource('hubs').resource('invites').close().resource('posts', { routeSegment: '/stream/posts/:id' }).resource('hubs').open().get('search', { on: 'resource' }).post('upgrade', { on: 'member' }).post('accept_invite', { on: 'member' }).post('reject_invite', { on: 'member' }).resource('apps').open().get('current', { on: 'resource', path: '/current' }).get('build', { on: 'member', path: '/build_app' }).get('status', { on: 'member' }).resource('styles').close().resource('addons').open().resource('configs').close().resource('analytics').open().get('summary', { on: 'resource' }).get('visitors', { on: 'resource' }).get('pageviews', { on: 'resource' }).get('duration', { on: 'resource' }).close().resource('feeds').open().resource('assets', { modelName: 'FeedAsset' }).close().resource('invites').open().post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).post('accept', { on: 'member', routeSegment: '/invites/:hash' }).post('reject', { on: 'member', routeSegment: '/invites/:hash' }).close().resource('recommendations').resource('users').open().post('grant_access', { on: 'resource' })['delete']('revoke_access', { on: 'member' }).close().resource('collections').open().put('reorder', { on: 'resource' }).close().resource('tags').resource('assets', { routeSegment: '/stream/:id' }).open().put('feature', { on: 'member' }).put('unfeature', { on: 'member' }).put('hide', { on: 'member' }).put('unhide', { on: 'member' }).put('lock', { on: 'member' }).put('unlock', { on: 'member' }).resource('likes').resource('comments').close().resource('drafts').open().put('publish', { on: 'member' }).close().close().resource('invites').open().get('incoming', { on: 'resource' }).get('outgoing', { on: 'resource' }).post('bulk_invite', { on: 'resource' }).post('resend', { on: 'member' }).post('accept', { on: 'member', key: 'hash' }).post('reject', { on: 'member', key: 'hash' }).close().resource('code_revisions').open().get('fetch_repo', { on: 'member' })

// This resource links to the root hubs resource
.resource('hubs', { link: 'hubs' }).close().resource('signup').open().get('account_uid_available', { on: 'member' }).get('account_email_available', { on: 'member' }).close().resource('users').open().get('roles', { on: 'resource' }).resource('hubs').resource('organizations').close().resource('discover').open().resource('users', { link: 'users' }).resource('organizations', { link: 'organizations' }).resource('hubs', { link: 'hubs' }).resource('posts').close().resource('stream').open().resource('following').close();
module.exports = exports['default'];
},{"./resource-schema":21,"superagent":125}],2:[function(require,module,exports){
'use strict';

//import {extend, filter, pick, difference, keys, functions} from 'lodash';
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var extend = require('lodash/object/extend');
var keys = require('lodash/object/keys');
var functions = require('lodash/object/functions');
var pick = require('lodash/object/pick');
var filter = require('lodash/collection/filter');
var difference = require('lodash/array/difference');

var Model = (function () {
  function Model(data) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Model);

    extend(this, data);

    this.$newRecord = true;
  }

  Model.prototype.$delete = function $delete(params) {
    return this.$resource().request({ method: 'delete', query: params });
  };

  Model.prototype.$save = function $save(params) {
    var _this = this;

    var method = this.$newRecord ? 'post' : 'put';

    return this.$resource().request({ method: method, data: this, query: params }).then(function (res) {
      _this.$newRecord = false;
      _this.$resource().sync(res);

      return extend(_this, res);
    });
  };

  Model.prototype.$attributes = function $attributes() {
    return filter(difference(keys(this), functions(this)), function (x) {
      return x[0] != '$';
    });
  };

  Model.prototype.$data = function $data() {
    return pick(this, this.$attributes());
  };

  return Model;
})();

exports['default'] = Model;
module.exports = exports['default'];
},{"lodash/array/difference":23,"lodash/collection/filter":29,"lodash/object/extend":116,"lodash/object/functions":117,"lodash/object/keys":118,"lodash/object/pick":121}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Account = (function (_Model) {
  _inherits(Account, _Model);

  function Account() {
    _classCallCheck(this, Account);

    _Model.apply(this, arguments);
  }

  return Account;
})(_model2['default']);

exports['default'] = Account;
module.exports = exports['default'];
},{"../model":2}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var App = (function (_Model) {
  _inherits(App, _Model);

  function App() {
    _classCallCheck(this, App);

    _Model.apply(this, arguments);
  }

  return App;
})(_model2['default']);

exports['default'] = App;
module.exports = exports['default'];
},{"../model":2}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

//import {chain, all, isEmpty} from 'lodash';
var all = require('lodash/collection/all');
var pick = require('lodash/object/pick');
var isEmpty = require('lodash/lang/isEmpty');

var DISPLAY_STATES = {
  VISIBLE: 1,
  FEATURED: 2,
  HIGHLIGHTED: 4,
  LOCKED: 8
};

var Asset = (function (_Model) {
  _inherits(Asset, _Model);

  function Asset() {
    _classCallCheck(this, Asset);

    _Model.apply(this, arguments);
  }

  Asset.prototype.isVisible = function isVisible() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) === DISPLAY_STATES.VISIBLE;
  };

  Asset.prototype.isHidden = function isHidden() {
    return (this.display_state & DISPLAY_STATES.VISIBLE) !== DISPLAY_STATES.VISIBLE;
  };

  Asset.prototype.isFeatured = function isFeatured() {
    return (this.display_state & DISPLAY_STATES.FEATURED) === DISPLAY_STATES.FEATURED;
  };

  Asset.prototype.isHighlighted = function isHighlighted() {
    return (this.display_state & DISPLAY_STATES.HIGHLIGHTED) === DISPLAY_STATES.HIGHLIGHTED;
  };

  Asset.prototype.isLocked = function isLocked() {
    return (this.display_state & DISPLAY_STATES.LOCKED) === DISPLAY_STATES.LOCKED;
  };

  Asset.prototype.isOriginal = function isOriginal() {
    return all(pick(this.source, 'network', 'uid', 'url'), isEmpty);
  };

  return Asset;
})(_model2['default']);

exports['default'] = Asset;
module.exports = exports['default'];
},{"../model":2,"lodash/collection/all":25,"lodash/lang/isEmpty":108,"lodash/object/pick":121}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var CodeRevision = (function (_Model) {
  _inherits(CodeRevision, _Model);

  function CodeRevision() {
    _classCallCheck(this, CodeRevision);

    _Model.apply(this, arguments);
  }

  return CodeRevision;
})(_model2['default']);

exports['default'] = CodeRevision;
module.exports = exports['default'];
},{"../model":2}],7:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Collection = (function (_Model) {
  _inherits(Collection, _Model);

  function Collection() {
    _classCallCheck(this, Collection);

    _Model.apply(this, arguments);
  }

  return Collection;
})(_model2['default']);

exports['default'] = Collection;
module.exports = exports['default'];
},{"../model":2}],8:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Comment = (function (_Model) {
  _inherits(Comment, _Model);

  function Comment() {
    _classCallCheck(this, Comment);

    _Model.apply(this, arguments);
  }

  return Comment;
})(_model2['default']);

exports['default'] = Comment;
module.exports = exports['default'];
},{"../model":2}],9:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Draft = (function (_Model) {
  _inherits(Draft, _Model);

  function Draft() {
    _classCallCheck(this, Draft);

    _Model.apply(this, arguments);
  }

  return Draft;
})(_model2['default']);

exports['default'] = Draft;
module.exports = exports['default'];
},{"../model":2}],10:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var FeedAsset = (function (_Model) {
  _inherits(FeedAsset, _Model);

  function FeedAsset() {
    _classCallCheck(this, FeedAsset);

    _Model.apply(this, arguments);
  }

  return FeedAsset;
})(_model2['default']);

exports['default'] = FeedAsset;
module.exports = exports['default'];
},{"../model":2}],11:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Feed = (function (_Model) {
  _inherits(Feed, _Model);

  function Feed() {
    _classCallCheck(this, Feed);

    _Model.apply(this, arguments);
  }

  return Feed;
})(_model2['default']);

exports['default'] = Feed;
module.exports = exports['default'];
},{"../model":2}],12:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Hub = (function (_Model) {
  _inherits(Hub, _Model);

  function Hub() {
    _classCallCheck(this, Hub);

    _Model.apply(this, arguments);
  }

  return Hub;
})(_model2['default']);

exports['default'] = Hub;
module.exports = exports['default'];
},{"../model":2}],13:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

var _model = require('../model');

exports.Base = _interopRequire(_model);

var _account = require('./account');

exports.Account = _interopRequire(_account);

var _organization = require('./organization');

exports.Organization = _interopRequire(_organization);

var _app = require('./app');

exports.App = _interopRequire(_app);

var _asset = require('./asset');

exports.Asset = _interopRequire(_asset);

var _codeRevision = require('./code-revision');

exports.CodeRevision = _interopRequire(_codeRevision);

var _collection = require('./collection');

exports.Collection = _interopRequire(_collection);

var _comment = require('./comment');

exports.Comment = _interopRequire(_comment);

var _draft = require('./draft');

exports.Draft = _interopRequire(_draft);

var _feed = require('./feed');

exports.Feed = _interopRequire(_feed);

var _feedAsset = require('./feed-asset');

exports.FeedAsset = _interopRequire(_feedAsset);

var _hub = require('./hub');

exports.Hub = _interopRequire(_hub);

var _invite = require('./invite');

exports.Invite = _interopRequire(_invite);

var _like = require('./like');

exports.Like = _interopRequire(_like);

var _recommendation = require('./recommendation');

exports.Recommendation = _interopRequire(_recommendation);

var _style = require('./style');

exports.Style = _interopRequire(_style);

var _tag = require('./tag');

exports.Tag = _interopRequire(_tag);

var _user = require('./user');

exports.User = _interopRequire(_user);
},{"../model":2,"./account":3,"./app":4,"./asset":5,"./code-revision":6,"./collection":7,"./comment":8,"./draft":9,"./feed":11,"./feed-asset":10,"./hub":12,"./invite":14,"./like":15,"./organization":16,"./recommendation":17,"./style":18,"./tag":19,"./user":20}],14:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Invite = (function (_Model) {
  _inherits(Invite, _Model);

  function Invite() {
    _classCallCheck(this, Invite);

    _Model.apply(this, arguments);
  }

  return Invite;
})(_model2['default']);

exports['default'] = Invite;
module.exports = exports['default'];
},{"../model":2}],15:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Like = (function (_Model) {
  _inherits(Like, _Model);

  function Like() {
    _classCallCheck(this, Like);

    _Model.apply(this, arguments);
  }

  return Like;
})(_model2['default']);

exports['default'] = Like;
module.exports = exports['default'];
},{"../model":2}],16:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Organization = (function (_Model) {
  _inherits(Organization, _Model);

  function Organization() {
    _classCallCheck(this, Organization);

    _Model.apply(this, arguments);
  }

  return Organization;
})(_model2['default']);

exports['default'] = Organization;
module.exports = exports['default'];
},{"../model":2}],17:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Recommendation = (function (_Model) {
  _inherits(Recommendation, _Model);

  function Recommendation() {
    _classCallCheck(this, Recommendation);

    _Model.apply(this, arguments);
  }

  return Recommendation;
})(_model2['default']);

exports['default'] = Recommendation;
module.exports = exports['default'];
},{"../model":2}],18:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Style = (function (_Model) {
  _inherits(Style, _Model);

  function Style() {
    _classCallCheck(this, Style);

    _Model.apply(this, arguments);
  }

  return Style;
})(_model2['default']);

exports['default'] = Style;
module.exports = exports['default'];
},{"../model":2}],19:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var Tag = (function (_Model) {
  _inherits(Tag, _Model);

  function Tag() {
    _classCallCheck(this, Tag);

    _Model.apply(this, arguments);
  }

  return Tag;
})(_model2['default']);

exports['default'] = Tag;
module.exports = exports['default'];
},{"../model":2}],20:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

var User = (function (_Model) {
  _inherits(User, _Model);

  function User() {
    _classCallCheck(this, User);

    _Model.apply(this, arguments);
  }

  User.prototype.hasAccess = function hasAccess() {
    return this.access.status === 0;
  };

  return User;
})(_model2['default']);

exports['default'] = User;
module.exports = exports['default'];
},{"../model":2}],21:[function(require,module,exports){
'use strict';

//import {map, each, select, extend, last, capitalize, isObject, isArray, isEmpty} from 'lodash';
exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _resource = require('./resource');

var _resource2 = _interopRequireDefault(_resource);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

var map = require('lodash/collection/map');
var each = require('lodash/collection/each');
var select = require('lodash/collection/select');
var extend = require('lodash/object/extend');
var last = require('lodash/array/last');
var capitalize = require('lodash/string/capitalize');
var isObject = require('lodash/lang/isObject');
var isArray = require('lodash/lang/isArray');
var isEmpty = require('lodash/lang/isEmpty');

function singularize(string) {
  return string.replace(/s$/, '');
}

function classify(string) {
  return singularize(map(string.split("_"), function (s) {
    return capitalize(s);
  }).join(''));
}

var buildRoute = function buildRoute(resource) {
  var current = resource;
  var segments = [];

  var path;

  if (current.options.route) {
    path = current.options.route;
  } else {

    while (current) {
      var paramName = current.options.routeSegment ? parseRouteParams(current.options.routeSegment)[0] : current.options.paramName || 'id';

      if (current !== resource) {
        paramName = singularize(current.name) + capitalize(paramName);
      }

      var routeSegment = current.options.routeSegment ? current.options.routeSegment.replace(/\/:[^\/]+$/, '/:' + paramName) : '/' + current.name + '/:' + paramName;

      segments.unshift(routeSegment);

      current = current.parent;
    }

    path = segments.join('');
  }

  var params = {};
  each(parseRouteParams(path), function (paramName) {
    params[paramName] = null;
  });

  return { path: path, segments: segments, segment: segments[segments.length - 1], params: params, paramName: resource.options.paramName || 'id' };
};

var reRouteParams = /:[^\/]+/gi;
var parseRouteParams = function parseRouteParams(route) {
  return map(route.match(reRouteParams), function (param) {
    return param.slice(1);
  });
};

var buildKey = function buildKey(resource, name) {
  var current = resource;
  var segments = [];

  while (current) {
    segments.unshift(current.name);
    current = current.parent;
  }

  return segments.join('.');
};

var ResourceSchema = (function () {
  function ResourceSchema() {
    _classCallCheck(this, ResourceSchema);
  }

  /*
    Resource selector
     $resource();
    $resource(key);
    $resource(key, params);
    $resource(name, parentResource);
    $resource(name, params, parentResource);
  */

  ResourceSchema.prototype.$resource = function $resource() {
    var key = arguments[0];

    if (typeof key == 'undefined') {
      throw new Error("$resource: key is undefined");
    }

    var name = last(key.split('.'));
    var params = isObject(arguments[1]) && !(arguments[1] instanceof _resource2['default']) ? arguments[1] : undefined;
    var parentResource = arguments[2] || !params && arguments[1] || undefined;

    if (parentResource) {
      if (parentResource.children.indexOf(name) == -1) {
        throw new Error("$resource: key not found in parent resource.");
      }

      key = parentResource.key + '.' + name;
    }

    return new this.constructor.resourceClasses[key](this, parentResource).includeParams(params);
  };

  return ResourceSchema;
})();

exports['default'] = ResourceSchema;
;

ResourceSchema.defineSchema = function () {
  var API = this;

  API.resourceClasses = {};

  var pointer = function pointer(bucket, parentPointer) {
    return {
      current: null,

      resource: function resource(name, options) {
        options = options || {};
        var parent = parentPointer ? parentPointer.current : null;

        var def = { name: name, parent: parent, children: {}, options: options };

        if (options.link) {
          def.link = options.link;
        }

        def.key = buildKey(def);
        def.route = buildRoute(def);
        def.actions = [];
        def.modelName = options.modelName || classify(name);

        this.current = bucket[name] = def;

        // create a class for this specific resource and assign the definition
        var resourceClass = (function (_Resource) {
          _inherits(resourceClass, _Resource);

          function resourceClass() {
            _classCallCheck(this, resourceClass);

            _Resource.apply(this, arguments);
          }

          return resourceClass;
        })(_resource2['default']);

        resourceClass.definition = def;
        resourceClass.modelClass = models[def.modelName] || models.Base;

        API.resourceClasses[def.key] = resourceClass;

        return this;
      },

      open: function open() {
        return pointer(this.current.children, this);
      },

      close: function close() {
        return parentPointer;
      },

      action: function action(method, name, options) {
        if (parentPointer && parentPointer.current) {
          parentPointer.current.actions.push({ method: method, name: name, options: options });
        }

        if (options.on == 'resource') {
          var resourceClass = API.resourceClasses[parentPointer.current.key];

          if (!resourceClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding collection action to ${parentPointer.current.key}:`, method, name);

            resourceClass.prototype['$' + name] = function () {
              var _this = this;

              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

              return this.request(extend({ method: method, path: options.path || '/' + name }, { data: data })).then(function (res) {
                if (isArray(res)) {
                  return _this.hydrateCollection(res);
                } else {
                  return _this.hydrateModel(res);
                }
              });
            };
          }
        } else if (options.on == 'member') {
          var modelClass = API.resourceClasses[parentPointer.current.key].modelClass;

          if (!modelClass.prototype.hasOwnProperty('$' + name)) {
            //console.log(`- adding member action to ${parentPointer.current.key}:`, method, name);

            modelClass.prototype['$' + name] = function () {
              var _this2 = this;

              var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

              return this.$resource().request(extend({ method: method, path: options.path || '/' + name }, { data: data })).then(function (res) {
                return _this2.$resource().hydrateModel(res);
              });
            };
          }
        }

        return this;
      },

      get: function get() {
        return this.action.call(this, 'get', arguments[0], arguments[1]);
      },

      post: function post() {
        return this.action.call(this, 'post', arguments[0], arguments[1]);
      },

      put: function put() {
        return this.action.call(this, 'put', arguments[0], arguments[1]);
      },

      patch: function patch() {
        return this.action.call(this, 'patch', arguments[0], arguments[1]);
      },

      'delete': function _delete() {
        return this.action.call(this, 'delete', arguments[0], arguments[1]);
      }
    };
  };

  return extend({}, pointer({}));
};

// ResourceSchema.generateMarkdown = function() {
//   var API = this;
//   let markdown = "";
//
//   each(API.resourceClasses, (resourceClass) => {
//     var def = resourceClass.definition;
//
//     markdown += `###${def.modelName}\n\n`;
//     markdown += `**\`${def.key}\`**\n\n`;
//
//     if (def.parent) {
//       markdown += '#####Parent\n\n';
//       markdown += `- [${def.parent.modelName}](#${def.parent.modelName.toLowerCase()}) \`${def.parent.key}\`\n\n`;
//     }
//
//     if (!isEmpty(def.children)) {
//       markdown += '#####Children\n\n';
//       each(def.children, (child) => {
//         markdown += `- [${child.modelName}](#${child.modelName.toLowerCase()}) \`${child.key}\`\n`;
//       });
//     }
//
//     markdown += '\n\n';
//
//     if (def.link) {
//       let link = API.resourceClasses[def.link].definition;
//       markdown += `See [${link.modelName}](#${link.modelName.toLowerCase()}) \`${link.key}\`\n\n`;
//     }
//
//     let pathRoot = def.route.path.replace(/\/:.+$/, '');
//
//     markdown += '#####REST Endpoints\n\n';
//
//     markdown += `- \`GET\` ${pathRoot}\n`;
//     markdown += `- \`POST\` ${pathRoot}\n`;
//     markdown += `- \`GET\` ${def.route.path}\n`;
//     markdown += `- \`PUT\` ${def.route.path}\n`;
//     markdown += `- \`DELETE\` ${def.route.path}\n\n`;
//
//     if (!isEmpty(def.actions)) {
//       let memberActions = select(def.actions, (action) => {
//         return action.options.on == 'member';
//       });
//
//       let collectionActions = select(def.actions, (action) => {
//         return action.options.on == 'collection';
//       });
//
//
//       if (!isEmpty(collectionActions)) {
//         markdown += "*Collection Actions*\n\n";
//
//         each(collectionActions, (action) => {
//           markdown += `- \`${action.method.toUpperCase()}\` ${pathRoot}/${action.name}\n`
//         });
//       }
//
//       markdown += "\n\n";
//
//       if (!isEmpty(memberActions)) {
//         markdown += "*Member Actions*\n\n";
//
//         each(memberActions, (action) => {
//           markdown += `- \`${action.method.toUpperCase()}\` ${def.route.path}/${action.name}\n`
//         });
//       }
//     }
//
//     markdown += "\n\n";
//   });
//
//   console.log(markdown);
// };
module.exports = exports['default'];
},{"./models":13,"./resource":22,"lodash/array/last":24,"lodash/collection/each":27,"lodash/collection/map":33,"lodash/collection/select":34,"lodash/lang/isArray":107,"lodash/lang/isEmpty":108,"lodash/lang/isObject":112,"lodash/object/extend":116,"lodash/string/capitalize":122}],22:[function(require,module,exports){
'use strict';

//import {map, each, detect, where, findWhere, extend, clone, isEmpty, isArray, isObject, isNumber} from 'lodash';
exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var map = require('lodash/collection/map');
var each = require('lodash/collection/each');
var detect = require('lodash/collection/detect');
var where = require('lodash/collection/where');
var findWhere = require('lodash/collection/findWhere');
var extend = require('lodash/object/extend');
var clone = require('lodash/lang/clone');
var isObject = require('lodash/lang/isObject');
var isArray = require('lodash/lang/isArray');
var isEmpty = require('lodash/lang/isEmpty');
var isNumber = require('lodash/lang/isNumber');

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function singularize(string) {
  return string.replace(/s$/, '');
}

var parseHTTPLinks = function parseHTTPLinks(linksString) {
  var links = {};

  if (linksString && !isEmpty(linksString)) {
    each(linksString.split(','), function (link) {
      var _link$split = link.split(';');

      var href = _link$split[0];
      var rel = _link$split[1];

      href = href.replace(/<(.*)>/, '$1').trim();
      rel = rel.replace(/rel="(.*)"/, '$1').trim();
      links[rel] = href;
    });
  }

  return links;
};

var Resource = (function () {
  function Resource(api, parentResource) {
    var _this = this;

    var inherit = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    _classCallCheck(this, Resource);

    var def = this.constructor.definition;
    if (typeof def == 'undefined') {
      throw new Error("Resource: Must supply a proper definition");
    }

    this.api = api;

    this.options = {};

    this.name = def.name;
    this.key = def.key;

    this.children = map(def.children, function (child, name) {
      return name;
    }) || [];

    this.depth = parentResource ? parentResource.depth + 1 : 1;

    this.route = deepClone(def.route);
    this.route.queryParams = {};

    // Prepare route params, extends the route params from the parentResource
    if (parentResource) {
      var parentParams = {};

      each(parentResource.route.params, function (value, paramName) {
        if (parentResource.key != _this.key && paramName == 'id') {
          paramName = singularize(parentResource.name) + 'Id';
        }

        parentParams[paramName] = value;
      });

      extend(this.route.params, parentParams);

      if (inherit) {
        this.route.queryParams = clone(parentResource.route.queryParams);
      }
    }

    this.parent = function () {
      return parentResource || def.parent && this.api.$resource(def.parent.key) || null;
    };
  }

  Resource.prototype.createResource = function createResource() {
    var inherit = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

    return new this.constructor(this.api, this, inherit);
  };

  Resource.prototype.request = function request() {
    var _this2 = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    return this.api.request(options.method || 'get', this.buildRoute(options.path), extend({}, this.options, { query: extend({}, this.route.queryParams, options.query), data: options.data })).then(function (res) {
      _this2.setResponse(res);
      return res.body;
    });
  };

  Resource.prototype.buildRoute = function buildRoute(appendPath) {
    var route = this.route.segments.join('');

    each(this.route.params, function (value, paramName) {
      route = route.replace('/:' + paramName, value ? '/' + value : '');
    });

    if (appendPath) {
      route += appendPath;
    }

    return route;
  };

  Resource.prototype.includeParams = function includeParams(params) {
    var _this3 = this;

    each(params, function (value, paramName) {
      if (_this3.route.params.hasOwnProperty(paramName)) {
        _this3.route.params[paramName] = value;
      } else {
        // Break out query params from route params
        _this3.route.queryParams[paramName] = value;
      }
    });

    return this;
  };

  Resource.prototype.query = function query(params) {
    extend(this.route.queryParams, params);

    return this;
  };

  Resource.prototype.limit = function limit(rpp) {
    this.query({ limit: rpp });

    return this;
  };

  Resource.prototype.timeout = function timeout(ms) {
    this.options.timeout = ms;

    return this;
  };

  Resource.prototype.$get = function $get(params) {
    var resource = this.createResource(true).includeParams(params);

    return resource.request().then(function (res) {
      return resource.hydrateModel(res);
    });
  };

  Resource.prototype.$find = function $find(params) {
    if (params && !isObject(params)) {
      params = { id: params };
    }

    var resource = this.createResource(true).includeParams(params);

    return resource.request().then(function (res) {
      return resource.hydrateModel(res);
    });
  };

  Resource.prototype.$all = function $all(params) {
    var resource = this.createResource(true).includeParams(params);

    return resource.request().then(function (res) {
      return resource.hydrateCollection(res);
    });
  };

  Resource.prototype.$create = function $create() {
    var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var resource = this.createResource();
    return resource.hydrateModel(data, { newRecord: true });
  };

  Resource.prototype.setResponse = function setResponse(res) {
    this.status = res.status;
    this.headers = res.headers;

    if (res.headers && res.headers.link) {
      this.links = parseHTTPLinks(res.headers.link);
    }
  };

  Resource.prototype.sync = function sync(data) {
    // Set route params based on data from the model
    // This is important step to take if the model queried from an all, queryParams, or action
    if (data[this.route.paramName]) {
      this.route.params[this.route.paramName] = data[this.route.paramName];
    }
  };

  Resource.prototype.hydrateModel = function hydrateModel(data) {
    var _this4 = this;

    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var model = new this.constructor.modelClass(data);

    if (!options.newRecord) {
      model.$newRecord = false;
    }

    this.sync(data);

    // Set a reference to the resource on the model
    model.$resource = function (name) {
      if (isEmpty(name)) {
        return _this4;
      } else {
        return _this4.api.$resource(name, _this4);
      }
    };

    return model;
  };

  Resource.prototype.hydrateCollection = function hydrateCollection(data) {
    var _this5 = this;

    var collection = map(data, function (item) {
      // Models in a collection need a new resource created
      var resource = _this5.createResource();

      var model = resource.hydrateModel(item);

      return model;
    });

    var getPage = function getPage(page) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (_this5.links.hasOwnProperty(page)) {
        return _this5.api.request('get', _this5.links[page]).then(function (res) {
          if (options.append || options.prepend) {
            _this5.setResponse(res);

            var method = options.append ? 'push' : 'unshift';

            each(res.body, function (item) {
              collection[method](_this5.hydrateModel(item));
            });

            return collection;
          } else {
            // XXX Not implemented yet.
            // Should create a new resource and hydrate
            return [];
          }
        });
      }
    };

    var methods = {
      $resource: function $resource() {
        return _this5;
      },

      $nextPage: function $nextPage() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return getPage('next', options);
      },

      $prevPage: function $prevPage() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        return getPage('prev', options);
      },

      $hasPage: function $hasPage(name) {
        return _this5.links.hasOwnProperty(name);
      },

      $find: function $find(id) {
        return detect(collection, function (item) {
          return item.id == id;
        });
      },

      $findWhere: function $findWhere(params) {
        return findWhere(collection, params);
      },

      $where: function $where(params) {
        return where(collection, params);
      },

      $create: function $create() {
        var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        var resource = _this5.createResource();
        return resource.hydrateModel(data, { newRecord: true });
      },

      $add: function $add(model, idx) {
        if (model === undefined) model = {};
        var applySorting = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

        if (typeof model == 'object' && !(model instanceof _this5.constructor.modelClass)) {
          model = collection.$create(model);
        }

        if (isNumber(idx)) {
          collection.splice(idx, 0, model);
        } else {
          collection.push(model);
        }

        if (applySorting) {
          collection.$sort();
        }

        return model;
      },

      $remove: function $remove(arg) {
        // Remove multiples
        if (isArray(arg)) {
          var models = arg;
          each(models, function (model) {
            collection.$remove(model);
          });

          return models;
        }

        var idx;
        if (isNumber(arg)) {
          idx = arg;
        } else if (arg instanceof _this5.constructor.modelClass) {
          idx = collection.indexOf(arg);
        }

        if (idx >= 0 && idx < collection.length) {
          return collection.splice(idx, 1)[0];
        }
      },

      $reposition: function $reposition(fromIdx, toIdx) {
        if (fromIdx != toIdx && (fromIdx >= 0 && fromIdx < collection.length) && (toIdx >= 0 && toIdx < collection.length)) {
          var model = collection.$remove(fromIdx);

          if (model) {
            return collection.$add(model, toIdx, false);
          }
        }
      },

      $sort: function $sort() {},

      $delete: function $delete(model) {
        var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        if (model instanceof _this5.constructor.modelClass) {
          return model.$delete(params).then(function () {
            return collection.$remove(model);
          });
        }
      }
    };

    extend(collection, methods);

    return collection;
  };

  return Resource;
})();

exports['default'] = Resource;
module.exports = exports['default'];
},{"lodash/collection/detect":26,"lodash/collection/each":27,"lodash/collection/findWhere":31,"lodash/collection/map":33,"lodash/collection/where":35,"lodash/lang/clone":105,"lodash/lang/isArray":107,"lodash/lang/isEmpty":108,"lodash/lang/isNumber":111,"lodash/lang/isObject":112,"lodash/object/extend":116}],23:[function(require,module,exports){
var baseDifference = require('../internal/baseDifference'),
    baseFlatten = require('../internal/baseFlatten'),
    isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike'),
    restParam = require('../function/restParam');

/**
 * Creates an array of unique `array` values not included in the other
 * provided arrays using [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {...Array} [values] The arrays of values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 * @example
 *
 * _.difference([1, 2, 3], [4, 2]);
 * // => [1, 3]
 */
var difference = restParam(function(array, values) {
  return (isObjectLike(array) && isArrayLike(array))
    ? baseDifference(array, baseFlatten(values, false, true))
    : [];
});

module.exports = difference;

},{"../function/restParam":36,"../internal/baseDifference":50,"../internal/baseFlatten":56,"../internal/isArrayLike":93,"../internal/isObjectLike":98}],24:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],25:[function(require,module,exports){
module.exports = require('./every');

},{"./every":28}],26:[function(require,module,exports){
module.exports = require('./find');

},{"./find":30}],27:[function(require,module,exports){
module.exports = require('./forEach');

},{"./forEach":32}],28:[function(require,module,exports){
var arrayEvery = require('../internal/arrayEvery'),
    baseCallback = require('../internal/baseCallback'),
    baseEvery = require('../internal/baseEvery'),
    isArray = require('../lang/isArray'),
    isIterateeCall = require('../internal/isIterateeCall');

/**
 * Checks if `predicate` returns truthy for **all** elements of `collection`.
 * The predicate is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias all
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 * @example
 *
 * _.every([true, 1, null, 'yes'], Boolean);
 * // => false
 *
 * var users = [
 *   { 'user': 'barney', 'active': false },
 *   { 'user': 'fred',   'active': false }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.every(users, { 'user': 'barney', 'active': false });
 * // => false
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.every(users, 'active', false);
 * // => true
 *
 * // using the `_.property` callback shorthand
 * _.every(users, 'active');
 * // => false
 */
function every(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayEvery : baseEvery;
  if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
    predicate = undefined;
  }
  if (typeof predicate != 'function' || thisArg !== undefined) {
    predicate = baseCallback(predicate, thisArg, 3);
  }
  return func(collection, predicate);
}

module.exports = every;

},{"../internal/arrayEvery":40,"../internal/baseCallback":47,"../internal/baseEvery":52,"../internal/isIterateeCall":95,"../lang/isArray":107}],29:[function(require,module,exports){
var arrayFilter = require('../internal/arrayFilter'),
    baseCallback = require('../internal/baseCallback'),
    baseFilter = require('../internal/baseFilter'),
    isArray = require('../lang/isArray');

/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias select
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Array} Returns the new filtered array.
 * @example
 *
 * _.filter([4, 5, 6], function(n) {
 *   return n % 2 == 0;
 * });
 * // => [4, 6]
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
 * // => ['barney']
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.pluck(_.filter(users, 'active', false), 'user');
 * // => ['fred']
 *
 * // using the `_.property` callback shorthand
 * _.pluck(_.filter(users, 'active'), 'user');
 * // => ['barney']
 */
function filter(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  predicate = baseCallback(predicate, thisArg, 3);
  return func(collection, predicate);
}

module.exports = filter;

},{"../internal/arrayFilter":41,"../internal/baseCallback":47,"../internal/baseFilter":53,"../lang/isArray":107}],30:[function(require,module,exports){
var baseEach = require('../internal/baseEach'),
    createFind = require('../internal/createFind');

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias detect
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.result(_.find(users, function(chr) {
 *   return chr.age < 40;
 * }), 'user');
 * // => 'barney'
 *
 * // using the `_.matches` callback shorthand
 * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
 * // => 'pebbles'
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.result(_.find(users, 'active', false), 'user');
 * // => 'fred'
 *
 * // using the `_.property` callback shorthand
 * _.result(_.find(users, 'active'), 'user');
 * // => 'barney'
 */
var find = createFind(baseEach);

module.exports = find;

},{"../internal/baseEach":51,"../internal/createFind":81}],31:[function(require,module,exports){
var baseMatches = require('../internal/baseMatches'),
    find = require('./find');

/**
 * Performs a deep comparison between each element in `collection` and the
 * source object, returning the first element that has equivalent property
 * values.
 *
 * **Note:** This method supports comparing arrays, booleans, `Date` objects,
 * numbers, `Object` objects, regexes, and strings. Objects are compared by
 * their own, not inherited, enumerable properties. For comparing a single
 * own or inherited property value see `_.matchesProperty`.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {Object} source The object of property values to match.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * _.result(_.findWhere(users, { 'age': 36, 'active': true }), 'user');
 * // => 'barney'
 *
 * _.result(_.findWhere(users, { 'age': 40, 'active': false }), 'user');
 * // => 'fred'
 */
function findWhere(collection, source) {
  return find(collection, baseMatches(source));
}

module.exports = findWhere;

},{"../internal/baseMatches":67,"./find":30}],32:[function(require,module,exports){
var arrayEach = require('../internal/arrayEach'),
    baseEach = require('../internal/baseEach'),
    createForEach = require('../internal/createForEach');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"../internal/arrayEach":39,"../internal/baseEach":51,"../internal/createForEach":82}],33:[function(require,module,exports){
var arrayMap = require('../internal/arrayMap'),
    baseCallback = require('../internal/baseCallback'),
    baseMap = require('../internal/baseMap'),
    isArray = require('../lang/isArray');

/**
 * Creates an array of values by running each element in `collection` through
 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
 * `sum`, `uniq`, and `words`
 *
 * @static
 * @memberOf _
 * @alias collect
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function timesThree(n) {
 *   return n * 3;
 * }
 *
 * _.map([1, 2], timesThree);
 * // => [3, 6]
 *
 * _.map({ 'a': 1, 'b': 2 }, timesThree);
 * // => [3, 6] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee, thisArg) {
  var func = isArray(collection) ? arrayMap : baseMap;
  iteratee = baseCallback(iteratee, thisArg, 3);
  return func(collection, iteratee);
}

module.exports = map;

},{"../internal/arrayMap":42,"../internal/baseCallback":47,"../internal/baseMap":66,"../lang/isArray":107}],34:[function(require,module,exports){
module.exports = require('./filter');

},{"./filter":29}],35:[function(require,module,exports){
var baseMatches = require('../internal/baseMatches'),
    filter = require('./filter');

/**
 * Performs a deep comparison between each element in `collection` and the
 * source object, returning an array of all elements that have equivalent
 * property values.
 *
 * **Note:** This method supports comparing arrays, booleans, `Date` objects,
 * numbers, `Object` objects, regexes, and strings. Objects are compared by
 * their own, not inherited, enumerable properties. For comparing a single
 * own or inherited property value see `_.matchesProperty`.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {Object} source The object of property values to match.
 * @returns {Array} Returns the new filtered array.
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': false, 'pets': ['hoppy'] },
 *   { 'user': 'fred',   'age': 40, 'active': true, 'pets': ['baby puss', 'dino'] }
 * ];
 *
 * _.pluck(_.where(users, { 'age': 36, 'active': false }), 'user');
 * // => ['barney']
 *
 * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');
 * // => ['fred']
 */
function where(collection, source) {
  return filter(collection, baseMatches(source));
}

module.exports = where;

},{"../internal/baseMatches":67,"./filter":29}],36:[function(require,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],37:[function(require,module,exports){
(function (global){
var cachePush = require('./cachePush'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./cachePush":76,"./getNative":88}],38:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function arrayCopy(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = arrayCopy;

},{}],39:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],40:[function(require,module,exports){
/**
 * A specialized version of `_.every` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 */
function arrayEvery(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

module.exports = arrayEvery;

},{}],41:[function(require,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],42:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],43:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],44:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],45:[function(require,module,exports){
var keys = require('../object/keys');

/**
 * A specialized version of `_.assign` for customizing assigned values without
 * support for argument juggling, multiple sources, and `this` binding `customizer`
 * functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 */
function assignWith(object, source, customizer) {
  var index = -1,
      props = keys(source),
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (value === undefined && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = assignWith;

},{"../object/keys":118}],46:[function(require,module,exports){
var baseCopy = require('./baseCopy'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"../object/keys":118,"./baseCopy":49}],47:[function(require,module,exports){
var baseMatches = require('./baseMatches'),
    baseMatchesProperty = require('./baseMatchesProperty'),
    bindCallback = require('./bindCallback'),
    identity = require('../utility/identity'),
    property = require('../utility/property');

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"../utility/identity":123,"../utility/property":124,"./baseMatches":67,"./baseMatchesProperty":68,"./bindCallback":73}],48:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'),
    arrayEach = require('./arrayEach'),
    baseAssign = require('./baseAssign'),
    baseForOwn = require('./baseForOwn'),
    initCloneArray = require('./initCloneArray'),
    initCloneByTag = require('./initCloneByTag'),
    initCloneObject = require('./initCloneObject'),
    isArray = require('../lang/isArray'),
    isObject = require('../lang/isObject');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
cloneableTags[dateTag] = cloneableTags[float32Tag] =
cloneableTags[float64Tag] = cloneableTags[int8Tag] =
cloneableTags[int16Tag] = cloneableTags[int32Tag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[stringTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[mapTag] = cloneableTags[setTag] =
cloneableTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * The base implementation of `_.clone` without support for argument juggling
 * and `this` binding `customizer` functions.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The object `value` belongs to.
 * @param {Array} [stackA=[]] Tracks traversed source objects.
 * @param {Array} [stackB=[]] Associates clones with source counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
  var result;
  if (customizer) {
    result = object ? customizer(value, key, object) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return arrayCopy(value, result);
    }
  } else {
    var tag = objToString.call(value),
        isFunc = tag == funcTag;

    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = initCloneObject(isFunc ? {} : value);
      if (!isDeep) {
        return baseAssign(result, value);
      }
    } else {
      return cloneableTags[tag]
        ? initCloneByTag(value, tag, isDeep)
        : (object ? value : {});
    }
  }
  // Check for circular references and return its corresponding clone.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == value) {
      return stackB[length];
    }
  }
  // Add the source value to the stack of traversed objects and associate it with its clone.
  stackA.push(value);
  stackB.push(result);

  // Recursively populate clone (susceptible to call stack limits).
  (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
    result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
  });
  return result;
}

module.exports = baseClone;

},{"../lang/isArray":107,"../lang/isObject":112,"./arrayCopy":38,"./arrayEach":39,"./baseAssign":46,"./baseForOwn":59,"./initCloneArray":90,"./initCloneByTag":91,"./initCloneObject":92}],49:[function(require,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],50:[function(require,module,exports){
var baseIndexOf = require('./baseIndexOf'),
    cacheIndexOf = require('./cacheIndexOf'),
    createCache = require('./createCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.difference` which accepts a single array
 * of values to exclude.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values) {
  var length = array ? array.length : 0,
      result = [];

  if (!length) {
    return result;
  }
  var index = -1,
      indexOf = baseIndexOf,
      isCommon = true,
      cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
      valuesLength = values.length;

  if (cache) {
    indexOf = cacheIndexOf;
    isCommon = false;
    values = cache;
  }
  outer:
  while (++index < length) {
    var value = array[index];

    if (isCommon && value === value) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === value) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (indexOf(values, value, 0) < 0) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"./baseIndexOf":62,"./cacheIndexOf":75,"./createCache":80}],51:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":59,"./createBaseEach":78}],52:[function(require,module,exports){
var baseEach = require('./baseEach');

/**
 * The base implementation of `_.every` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`
 */
function baseEvery(collection, predicate) {
  var result = true;
  baseEach(collection, function(value, index, collection) {
    result = !!predicate(value, index, collection);
    return result;
  });
  return result;
}

module.exports = baseEvery;

},{"./baseEach":51}],53:[function(require,module,exports){
var baseEach = require('./baseEach');

/**
 * The base implementation of `_.filter` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"./baseEach":51}],54:[function(require,module,exports){
/**
 * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
 * without support for callback shorthands and `this` binding, which iterates
 * over `collection` using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @param {boolean} [retKey] Specify returning the key of the found element
 *  instead of the element itself.
 * @returns {*} Returns the found element or its key, else `undefined`.
 */
function baseFind(collection, predicate, eachFunc, retKey) {
  var result;
  eachFunc(collection, function(value, key, collection) {
    if (predicate(value, key, collection)) {
      result = retKey ? key : value;
      return false;
    }
  });
  return result;
}

module.exports = baseFind;

},{}],55:[function(require,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromRight) {
  var length = array.length,
      index = fromRight ? length : -1;

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],56:[function(require,module,exports){
var arrayPush = require('./arrayPush'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"../lang/isArguments":106,"../lang/isArray":107,"./arrayPush":43,"./isArrayLike":93,"./isObjectLike":98}],57:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":79}],58:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keysIn = require('../object/keysIn');

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"../object/keysIn":119,"./baseFor":57}],59:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":118,"./baseFor":57}],60:[function(require,module,exports){
var isFunction = require('../lang/isFunction');

/**
 * The base implementation of `_.functions` which creates an array of
 * `object` function property names filtered from those provided.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} props The property names to filter.
 * @returns {Array} Returns the new array of filtered property names.
 */
function baseFunctions(object, props) {
  var index = -1,
      length = props.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var key = props[index];
    if (isFunction(object[key])) {
      result[++resIndex] = key;
    }
  }
  return result;
}

module.exports = baseFunctions;

},{"../lang/isFunction":109}],61:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./toObject":103}],62:[function(require,module,exports){
var indexOfNaN = require('./indexOfNaN');

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"./indexOfNaN":89}],63:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"../lang/isObject":112,"./baseIsEqualDeep":64,"./isObjectLike":98}],64:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":107,"../lang/isTypedArray":114,"./equalArrays":83,"./equalByTag":84,"./equalObjects":85}],65:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./baseIsEqual":63,"./toObject":103}],66:[function(require,module,exports){
var baseEach = require('./baseEach'),
    isArrayLike = require('./isArrayLike');

/**
 * The base implementation of `_.map` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"./baseEach":51,"./isArrayLike":93}],67:[function(require,module,exports){
var baseIsMatch = require('./baseIsMatch'),
    getMatchData = require('./getMatchData'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"./baseIsMatch":65,"./getMatchData":87,"./toObject":103}],68:[function(require,module,exports){
var baseGet = require('./baseGet'),
    baseIsEqual = require('./baseIsEqual'),
    baseSlice = require('./baseSlice'),
    isArray = require('../lang/isArray'),
    isKey = require('./isKey'),
    isStrictComparable = require('./isStrictComparable'),
    last = require('../array/last'),
    toObject = require('./toObject'),
    toPath = require('./toPath');

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"../array/last":24,"../lang/isArray":107,"./baseGet":61,"./baseIsEqual":63,"./baseSlice":71,"./isKey":96,"./isStrictComparable":99,"./toObject":103,"./toPath":104}],69:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],70:[function(require,module,exports){
var baseGet = require('./baseGet'),
    toPath = require('./toPath');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"./baseGet":61,"./toPath":104}],71:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],72:[function(require,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],73:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":123}],74:[function(require,module,exports){
(function (global){
/** Native method references. */
var ArrayBuffer = global.ArrayBuffer,
    Uint8Array = global.Uint8Array;

/**
 * Creates a clone of the given array buffer.
 *
 * @private
 * @param {ArrayBuffer} buffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function bufferClone(buffer) {
  var result = new ArrayBuffer(buffer.byteLength),
      view = new Uint8Array(result);

  view.set(new Uint8Array(buffer));
  return result;
}

module.exports = bufferClone;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],75:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

module.exports = cacheIndexOf;

},{"../lang/isObject":112}],76:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

module.exports = cachePush;

},{"../lang/isObject":112}],77:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isIterateeCall = require('./isIterateeCall'),
    restParam = require('../function/restParam');

/**
 * Creates a `_.assign`, `_.defaults`, or `_.merge` function.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"../function/restParam":36,"./bindCallback":73,"./isIterateeCall":95}],78:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":86,"./isLength":97,"./toObject":103}],79:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":103}],80:[function(require,module,exports){
(function (global){
var SetCache = require('./SetCache'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
function createCache(values) {
  return (nativeCreate && Set) ? new SetCache(values) : null;
}

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./SetCache":37,"./getNative":88}],81:[function(require,module,exports){
var baseCallback = require('./baseCallback'),
    baseFind = require('./baseFind'),
    baseFindIndex = require('./baseFindIndex'),
    isArray = require('../lang/isArray');

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new find function.
 */
function createFind(eachFunc, fromRight) {
  return function(collection, predicate, thisArg) {
    predicate = baseCallback(predicate, thisArg, 3);
    if (isArray(collection)) {
      var index = baseFindIndex(collection, predicate, fromRight);
      return index > -1 ? collection[index] : undefined;
    }
    return baseFind(collection, predicate, eachFunc);
  };
}

module.exports = createFind;

},{"../lang/isArray":107,"./baseCallback":47,"./baseFind":54,"./baseFindIndex":55}],82:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"../lang/isArray":107,"./bindCallback":73}],83:[function(require,module,exports){
var arraySome = require('./arraySome');

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"./arraySome":44}],84:[function(require,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],85:[function(require,module,exports){
var keys = require('../object/keys');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":118}],86:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":69}],87:[function(require,module,exports){
var isStrictComparable = require('./isStrictComparable'),
    pairs = require('../object/pairs');

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"../object/pairs":120,"./isStrictComparable":99}],88:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":110}],89:[function(require,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],90:[function(require,module,exports){
/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = new array.constructor(length);

  // Add array properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],91:[function(require,module,exports){
var bufferClone = require('./bufferClone');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return bufferClone(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      var buffer = object.buffer;
      return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      var result = new Ctor(object.source, reFlags.exec(object));
      result.lastIndex = object.lastIndex;
  }
  return result;
}

module.exports = initCloneByTag;

},{"./bufferClone":74}],92:[function(require,module,exports){
/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  var Ctor = object.constructor;
  if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
    Ctor = Object;
  }
  return new Ctor;
}

module.exports = initCloneObject;

},{}],93:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":86,"./isLength":97}],94:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],95:[function(require,module,exports){
var isArrayLike = require('./isArrayLike'),
    isIndex = require('./isIndex'),
    isObject = require('../lang/isObject');

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"../lang/isObject":112,"./isArrayLike":93,"./isIndex":94}],96:[function(require,module,exports){
var isArray = require('../lang/isArray'),
    toObject = require('./toObject');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"../lang/isArray":107,"./toObject":103}],97:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],98:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],99:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"../lang/isObject":112}],100:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * A specialized version of `_.pick` which picks `object` properties specified
 * by `props`.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property names to pick.
 * @returns {Object} Returns the new object.
 */
function pickByArray(object, props) {
  object = toObject(object);

  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index];
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
}

module.exports = pickByArray;

},{"./toObject":103}],101:[function(require,module,exports){
var baseForIn = require('./baseForIn');

/**
 * A specialized version of `_.pick` which picks `object` properties `predicate`
 * returns truthy for.
 *
 * @private
 * @param {Object} object The source object.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Object} Returns the new object.
 */
function pickByCallback(object, predicate) {
  var result = {};
  baseForIn(object, function(value, key, object) {
    if (predicate(value, key, object)) {
      result[key] = value;
    }
  });
  return result;
}

module.exports = pickByCallback;

},{"./baseForIn":58}],102:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":106,"../lang/isArray":107,"../object/keysIn":119,"./isIndex":94,"./isLength":97}],103:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":112}],104:[function(require,module,exports){
var baseToString = require('./baseToString'),
    isArray = require('../lang/isArray');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"../lang/isArray":107,"./baseToString":72}],105:[function(require,module,exports){
var baseClone = require('../internal/baseClone'),
    bindCallback = require('../internal/bindCallback'),
    isIterateeCall = require('../internal/isIterateeCall');

/**
 * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
 * otherwise they are assigned by reference. If `customizer` is provided it's
 * invoked to produce the cloned values. If `customizer` returns `undefined`
 * cloning is handled by the method instead. The `customizer` is bound to
 * `thisArg` and invoked with up to three argument; (value [, index|key, object]).
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
 * The enumerable properties of `arguments` objects and objects created by
 * constructors other than `Object` are cloned to plain `Object` objects. An
 * empty object is returned for uncloneable values such as functions, DOM nodes,
 * Maps, Sets, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @param {Function} [customizer] The function to customize cloning values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {*} Returns the cloned value.
 * @example
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * var shallow = _.clone(users);
 * shallow[0] === users[0];
 * // => true
 *
 * var deep = _.clone(users, true);
 * deep[0] === users[0];
 * // => false
 *
 * // using a customizer callback
 * var el = _.clone(document.body, function(value) {
 *   if (_.isElement(value)) {
 *     return value.cloneNode(false);
 *   }
 * });
 *
 * el === document.body
 * // => false
 * el.nodeName
 * // => BODY
 * el.childNodes.length;
 * // => 0
 */
function clone(value, isDeep, customizer, thisArg) {
  if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
    isDeep = false;
  }
  else if (typeof isDeep == 'function') {
    thisArg = customizer;
    customizer = isDeep;
    isDeep = false;
  }
  return typeof customizer == 'function'
    ? baseClone(value, isDeep, bindCallback(customizer, thisArg, 3))
    : baseClone(value, isDeep);
}

module.exports = clone;

},{"../internal/baseClone":48,"../internal/bindCallback":73,"../internal/isIterateeCall":95}],106:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":93,"../internal/isObjectLike":98}],107:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":88,"../internal/isLength":97,"../internal/isObjectLike":98}],108:[function(require,module,exports){
var isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLike = require('../internal/isArrayLike'),
    isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike'),
    isString = require('./isString'),
    keys = require('../object/keys');

/**
 * Checks if `value` is empty. A value is considered empty unless it's an
 * `arguments` object, array, string, or jQuery-like collection with a length
 * greater than `0` or an object with own enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {Array|Object|string} value The value to inspect.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) && (isArray(value) || isString(value) || isArguments(value) ||
      (isObjectLike(value) && isFunction(value.splice)))) {
    return !value.length;
  }
  return !keys(value).length;
}

module.exports = isEmpty;

},{"../internal/isArrayLike":93,"../internal/isObjectLike":98,"../object/keys":118,"./isArguments":106,"./isArray":107,"./isFunction":109,"./isString":113}],109:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":112}],110:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":98,"./isFunction":109}],111:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(8.4);
 * // => true
 *
 * _.isNumber(NaN);
 * // => true
 *
 * _.isNumber('8.4');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"../internal/isObjectLike":98}],112:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],113:[function(require,module,exports){
var isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{"../internal/isObjectLike":98}],114:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"../internal/isLength":97,"../internal/isObjectLike":98}],115:[function(require,module,exports){
var assignWith = require('../internal/assignWith'),
    baseAssign = require('../internal/baseAssign'),
    createAssigner = require('../internal/createAssigner');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources overwrite property assignments of previous sources.
 * If `customizer` is provided it's invoked to produce the assigned values.
 * The `customizer` is bound to `thisArg` and invoked with five arguments:
 * (objectValue, sourceValue, key, object, source).
 *
 * **Note:** This method mutates `object` and is based on
 * [`Object.assign`](http://ecma-international.org/ecma-262/6.0/#sec-object.assign).
 *
 * @static
 * @memberOf _
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
 * // => { 'user': 'fred', 'age': 40 }
 *
 * // using a customizer callback
 * var defaults = _.partialRight(_.assign, function(value, other) {
 *   return _.isUndefined(value) ? other : value;
 * });
 *
 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var assign = createAssigner(function(object, source, customizer) {
  return customizer
    ? assignWith(object, source, customizer)
    : baseAssign(object, source);
});

module.exports = assign;

},{"../internal/assignWith":45,"../internal/baseAssign":46,"../internal/createAssigner":77}],116:[function(require,module,exports){
module.exports = require('./assign');

},{"./assign":115}],117:[function(require,module,exports){
var baseFunctions = require('../internal/baseFunctions'),
    keysIn = require('./keysIn');

/**
 * Creates an array of function property names from all enumerable properties,
 * own and inherited, of `object`.
 *
 * @static
 * @memberOf _
 * @alias methods
 * @category Object
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns the new array of property names.
 * @example
 *
 * _.functions(_);
 * // => ['after', 'ary', 'assign', ...]
 */
function functions(object) {
  return baseFunctions(object, keysIn(object));
}

module.exports = functions;

},{"../internal/baseFunctions":60,"./keysIn":119}],118:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":88,"../internal/isArrayLike":93,"../internal/shimKeys":102,"../lang/isObject":112}],119:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":94,"../internal/isLength":97,"../lang/isArguments":106,"../lang/isArray":107,"../lang/isObject":112}],120:[function(require,module,exports){
var keys = require('./keys'),
    toObject = require('../internal/toObject');

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"../internal/toObject":103,"./keys":118}],121:[function(require,module,exports){
var baseFlatten = require('../internal/baseFlatten'),
    bindCallback = require('../internal/bindCallback'),
    pickByArray = require('../internal/pickByArray'),
    pickByCallback = require('../internal/pickByCallback'),
    restParam = require('../function/restParam');

/**
 * Creates an object composed of the picked `object` properties. Property
 * names may be specified as individual arguments or as arrays of property
 * names. If `predicate` is provided it's invoked for each property of `object`
 * picking the properties `predicate` returns truthy for. The predicate is
 * bound to `thisArg` and invoked with three arguments: (value, key, object).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to pick, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.pick(object, 'user');
 * // => { 'user': 'fred' }
 *
 * _.pick(object, _.isString);
 * // => { 'user': 'fred' }
 */
var pick = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  return typeof props[0] == 'function'
    ? pickByCallback(object, bindCallback(props[0], props[1], 3))
    : pickByArray(object, baseFlatten(props));
});

module.exports = pick;

},{"../function/restParam":36,"../internal/baseFlatten":56,"../internal/bindCallback":73,"../internal/pickByArray":100,"../internal/pickByCallback":101}],122:[function(require,module,exports){
var baseToString = require('../internal/baseToString');

/**
 * Capitalizes the first character of `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * _.capitalize('fred');
 * // => 'Fred'
 */
function capitalize(string) {
  string = baseToString(string);
  return string && (string.charAt(0).toUpperCase() + string.slice(1));
}

module.exports = capitalize;

},{"../internal/baseToString":72}],123:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],124:[function(require,module,exports){
var baseProperty = require('../internal/baseProperty'),
    basePropertyDeep = require('../internal/basePropertyDeep'),
    isKey = require('../internal/isKey');

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"../internal/baseProperty":69,"../internal/basePropertyDeep":70,"../internal/isKey":96}],125:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  var tryAnotherContentType = this.xhr.getResponseHeader('content-type');
  if (tryAnotherContentType && tryAnotherContentType.length > 0) {
    this.header['content-type'] = tryAnotherContentType;
  }
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Force given parser
 * 
 * Sets the body parser no matter type.
 * 
 * @param {Function}
 * @api public
 */

Request.prototype.parse = function(fn){
  this._parser = fn;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this.getHeader('Content-Type');
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

Request.prototype.then = function (fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":126,"reduce":127}],126:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

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
  (this._callbacks[event] = this._callbacks[event] || [])
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
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
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
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
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
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
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

},{}],127:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}]},{},[1])(1)
});