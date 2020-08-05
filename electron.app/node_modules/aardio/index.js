/*
可使用 npm i aardio 或 yarn add aardio 安装此模块
支持chrome.app,electron.app 等，可以让aardio,js可以相互调用函数
*/

(function (name, definition) {
  var hasDefine = typeof define === "function",
    hasExports = typeof module !== "undefined" && module.exports;

  if (hasDefine) {
    define(definition);
  } else if (hasExports) {
    module.exports = definition();
  } else {
    this[name] = definition();
  }
})("aardio", function () {
  let aardio = {};
  let startEnviron;
  let hasWindow = typeof window !== "undefined";

  if (typeof process === "object") {
    if (hasWindow) {
      aardio.browser = true;
      if (
        typeof window.process === "object" &&
        window.process.type === "renderer"
      ) {

        if (typeof window.require === "function") {
          aardio.require = window.require;
          const electron = aardio.require("electron").remote;
          startEnviron = electron.getGlobal("startEnviron");
        }

        aardio.electronRenderer = true;
        aardio.electron = true;
      }
    } else {
      if (module) {
        aardio.require =
          module[
          "eriuqer"
            .split("")
            .reverse()
            .join("")
          ];
      }

      if (process.env.aarStartEnviron) {
        startEnviron = JSON.parse(process.env.aarStartEnviron);
      }

      if (
        typeof process.versions === "object" &&
        Boolean(process.versions.electron)
      ) {
        aardio.electron = true;
      }
    }
  } else {
    aardio.browser = hasWindow;
    if (
      typeof navigator === "object" &&
      typeof navigator.userAgent === "string" &&
      navigator.userAgent.indexOf("Electron") >= 0
    ) {
      aardio.electron = true;
    }
  }

  let rpchttpServerUrl;
  let wsRpcServerUrl;
  let rpcAasdl;

  if (aardio.browser && !startEnviron) {
    let urlQuery = function (variable) {
      let query = window.location.search.slice(1);
      let vars = query.split("&");
      for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        if (pair[0] == variable) {
          return pair[1];
        }
      }
      return false;
    };

    let rpcServerPort;
    if (window) {
      rpcServerPort = urlQuery("rpcServerPort");
      if (typeof rpcServerPort == "string") {
        sessionStorage.setItem("rpcServerPort", rpcServerPort);
      } else {
        rpcServerPort = sessionStorage.getItem("rpcServerPort");
        if (!rpcServerPort) {
          rpcServerPort = "{{{$rpcServerPort}}}";
          if (rpcServerPort === "{{{$rpcServer" + "Port}}}") {
            rpcServerPort = null;
          }
        }
      }

      rpcAasdl = urlQuery("rpcAasdl");
      if (typeof rpcAasdl == "string") {
        rpcAasdl = decodeURIComponent(rpcAasdl)
        sessionStorage.setItem("rpcAasdl", rpcAasdl);
      } else {
        rpcAasdl = sessionStorage.getItem("rpcAasdl");
        if (!rpcAasdl) {
          rpcAasdl = '{{{$rpcAasdl}}}';
          if (rpcAasdl === '{{{$rpc" + "Aasdl}}}') {
            rpcAasdl = null;
          }
        }
      }

      if (rpcAasdl) { rpcAasdl = JSON.parse(rpcAasdl) }
    }

    if (rpcServerPort) {
      wsRpcServerUrl = "ws://127.0.0.1:" + rpcServerPort + "/rpc/ws";
      rpchttpServerUrl = "http://127.0.0.1:" + rpcServerPort + "/rpc/http";
    } else {
      let aardioReal = {
        rpc: false,
        studioInvoke: false,
        browser: true,
        electron: false,
        electronRenderer: false,
        hwndElectron: null,
        startEnviron: null
      };
      let aardioProxy = new Proxy(aardioReal, {
        get: function (target, key, receiver) {
          if (key === "default") {
            return aardioProxy;
          }
          let v = Reflect.get(target, key, receiver);
          if (v !== undefined) return v;
          return (...args) => {
            console.log(`aardio.${key}(${args}) `);
            return Promise.resolve(null);
          };
        }
      });
      aardioReal.default = aardioProxy;
      return aardioProxy;
    }
  } else if (startEnviron) {
    rpchttpServerUrl = startEnviron.rpchttpServerUrl;
    wsRpcServerUrl = startEnviron.rpcServerUrl;
  } else {
    throw new Error("StartEnviron Error!");
  }

  if (startEnviron && startEnviron.indexUrl) {
    /** @type {string} */
    let indexUrl = startEnviron.indexUrl;
    let appDir = indexUrl.replace(/([\\\/]+[^\\\/]+[\\\/]+)[^\\\/]*$/, "$1");

    aardio.fullUrl = function (path) {
      if (path.indexOf(":") > 0) return path;
      if (path[0] === "#") return `${indexUrl}${path}`

      if (path[0] === "/" || path[0] === "\\") {
        if (appDir.slice(0, 5) === "file:") {
          return `file:///${startEnviron.appPath}/${path}`
        }
        else {
          return `${appDir.match(/http:\/\/[^\/]*/, "")[0]}${path}`
        }
      }

      return `${appDir}${path}`
    }
  }
  else if (aardio.browser) {
    aardio.fullUrl = function (path) {
      if (path.indexOf(":") > 0) return path;
      if (window.location.protocol === "file:") {
        return `${(window.location.href).replace(/[^\\\/]*$/, "")}${path}`
      }
      return `${window.location.protocol}//${window.location.host}/${path}`
    }
  }

  aardio.getCurrentWindow = function () { };
  aardio.getMainWindow = function () { };

  let ws;
  if (!aardio.browser) {
    global.startEnviron = startEnviron;
    aardio.require("module").globalPaths.push(startEnviron.nodePath);

    const { app, BrowserWindow } = aardio.require("electron");
    let WebSocket = aardio.require("ws.asar");
    ws = new WebSocket(startEnviron.rpcMainServerUrl);

    if (typeof startEnviron.args === "object") {
      for (var k in startEnviron.args) {
        app.commandLine.appendSwitch(k, startEnviron.args[k] + "");
      }
    }

    aardio.createBrowserWindow = function (options, loadUrl, loadUrlOptions) {
      options = Object.assign(
        {
          frame: startEnviron.browserWindow.frame,
          resizable: true,
          center: true,
          width: 1024,
          minWidth: 800,
          height: 760,
          minHeight: 600,
          autoHideMenuBar: true,
          title: startEnviron.title,
          icon: startEnviron.icon,
          webPreferences: startEnviron.browserWindow.webPreferences
        },
        options
      );

      let win = new BrowserWindow(options);
      if (loadUrl) {
        loadUrl = aardio.fullUrl(loadUrl);
        win.loadURL(loadUrl, loadUrlOptions).catch((e) => { throw e; });
      }
      return win;
    };

    aardio.getGlobal = function (sharedObjectName) {
      return global[sharedObjectName];
    };
  } else {

    if (aardio.electronRenderer) {
      if (aardio.require) {
        const { BrowserWindow, getCurrentWindow, getGlobal } = aardio.require(
          "electron"
        ).remote;
        startEnviron = getGlobal("startEnviron");

        aardio.getGlobal = function (sharedObjectName) {
          return getGlobal(sharedObjectName);
        };

        aardio.getCurrentWindow = function () {
          return getCurrentWindow();
        };

        aardio.getMainWindow = function () { return BrowserWindow.fromId(startEnviron.mainWindowId) };

        aardio.createBrowserWindow = function (options, loadUrl, loadUrlOptions) {
          options = Object.assign(
            {
              frame: startEnviron.browserWindow.frame,
              resizable: true,
              center: true,
              width: 1024,
              minWidth: 800,
              height: 760,
              minHeight: 600,
              autoHideMenuBar: true,
              title: startEnviron.title,
              icon: startEnviron.icon,
              webPreferences: startEnviron.browserWindow.webPreferences
            },
            options
          );
          let win = new BrowserWindow(options);
          if (loadUrl) {
            loadUrl = aardio.fullUrl(loadUrl);
            win.loadURL(loadUrl, loadUrlOptions).catch((e) => { throw e; });
          }
          return win;
        };

        aardio.isZoomed = function () {
          return Promise.resolve(aardio.getCurrentWindow().isMaximized());
        };

        aardio.hitMax = function () {
          let win = aardio.getCurrentWindow();
          if (win.isMaximized()) {
            win.unmaximize();
          } else {
            win.maximize();
          }
          return Promise.resolve(win.isMaximized());
        };

        aardio.hitMin = function () {
          return Promise.resolve(aardio.getCurrentWindow().minimize());
        };

        aardio.hitClose = function () {
          return Promise.resolve(aardio.getCurrentWindow().close());
        };

        aardio.hwndElectron = aardio
          .getCurrentWindow()
          .getNativeWindowHandle()
          .readInt32LE();
      }
    }
    ws = new WebSocket(wsRpcServerUrl);
  }

  let rpcNotifications = new Object();
  let xcall;

  ws.onopen = function (e) { };
  ws.onclose = function (e) { };
  ws.onerror = function (e) {
    console.error(e);
  };
  ws.onmessage = function (e) {
    var rep = JSON.parse(e.data);
    if (typeof rep.method == "string") {
      var notify = rpcNotifications[rep.method];
      if (notify) {
        var result = emit(rep.method, ...rep.params);

        if (rep.id) {
          var clientRep = JSON.stringify({
            id: rep.id,
            jsonrpc: "2.0",
            result: result
          });
          ws.send(clientRep);
        }
      }
    }
  };

  function on(method, notify) {
    if (rpcNotifications[method]) {
      rpcNotifications[method].push(notify);
    } else {
      rpcNotifications[method] = [notify];
    }

    return aardio;
  }

  on("doScript", js => {
    if (!aardio.browser) global.eval("(()=>{" + js + "})()");
    else window.eval("(()=>{" + js + "})()");
  });

  function off(method, notify) {
    if (rpcNotifications[method]) {
      if (notify) {
        rpcNotifications[method] = rpcNotifications[method].filter(
          l => l != notify
        );
      } else {
        delete rpcNotifications[method];
      }
    }

    return aardio;
  }

  function emit(method, ...rest) {
    let result;
    if (rpcNotifications[method]) {
      rpcNotifications[method].forEach(notify => {
        result = notify.apply(aardio, rest);
      });
    }
    return result;
  }

  function aasdlParse(obj, ex, pk) {
    for (var k in obj) {
      let method = k;
      if (typeof pk == "string") method = pk + "." + k;
      else {
        if (ex[k]) {
          continue;
        }
      }

      if (typeof obj[k] == "object") {
        ex[k] = {};
        aasdlParse(obj[k], ex[k], method);
        continue;
      }

      ex[k] = function () {
        return xcall.apply(ex, [method, ...arguments]);
      };
    }
  }


  if (startEnviron && startEnviron.aasdl) { rpcAasdl = startEnviron.aasdl; }
  if (rpcAasdl) {
    aasdlParse(rpcAasdl, aardio);
    delete rpcAasdl;
  }

  function initRpcClient() {
    if (aardio.browser) {
      let onUrlReady = () => {
        aardio.isReady = true;
        emit("ready", aardio.getCurrentWindow());
        off("ready");

        xcall("$onUrlReady", document.location.href);
      }

      if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        window.setTimeout(onUrlReady);
      } else {
        document.addEventListener("DOMContentLoaded", function () {
          document.removeEventListener("DOMContentLoaded", arguments.callee, false);
          onUrlReady();
        });
      }
    } else {
      const { app, BrowserWindow } = aardio.require("electron");
      createWindow = function () {
        let win = new BrowserWindow(startEnviron.browserWindow);
        aardio.hwndElectron = win.getNativeWindowHandle().readInt32LE();
        startEnviron.mainWindowId = win.id;
        global.mainWindow = win;

        if (startEnviron.extensions) {
          startEnviron.extensions.forEach(ext =>
            BrowserWindow.addExtension(ext)
          );
        }

        win.on("closed", () => {
          ws = null;
          global.mainWindow = null;
          win = null;
        });

        if (startEnviron.indexUrl) {
          win.loadURL(startEnviron.indexUrl).then(
            () => { aardio.main.onIndexLoad(); }
          ).catch((e) => { throw e; })
        }

        aardio.isReady = true;
        emit("ready", win);

        aardio.main.onReady(aardio.hwndElectron);
      };

      aardio.getMainWindow = function () {
        return global.mainWindow;
      };

      aardio.getCurrentWindow = function () {
        return global.mainWindow;
      };

      if (!global.mainWindow) {
        if (app.isReady()) createWindow();
        else app.on("ready", createWindow);
      } else {
        aardio.isReady = true;
        emit("ready", global.mainWindow);
      }
    }
  }

  on("rpcClientId", id => {
    aardio.rpcClientId = id;
    emit("rpcReady");
    off("rpcReady");

    if (startEnviron && startEnviron.aasdl) {
      initRpcClient();
    } else {
      xcall("?")
        .then((aasdl, error) => {
          aasdlParse(JSON.parse(aasdl), aardio);
          initRpcClient();
        })
        .catch(e => {
          console.error(e);
        });
    }
  });

  const rpcReady = callback => {
    if (aardio.rpcClientId) {
      callback();
    } else {
      on("rpcReady", callback);
    }
  };

  if (!aardio.browser) {
    var http = aardio.require("http");
    xcall = function (method, ...args) {
      return new Promise((resolve, reject) => {
        rpcReady(() => {
          var reqData = JSON.stringify({
            method: method,
            id: method,
            jsonrpc: "2.0",
            params: args
          });

          var options = {
            host: "127.0.0.1",
            port: startEnviron.rpcPort,
            path: "/rpc/http",
            method: "POST",
            headers: {
              Connection: "close",
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(reqData, "utf8"),
              "Rpc-Client-Id": aardio.rpcClientId + ""
            }
          };

          var req = http.request(options, function (res) {
            var rawData = "";
            res.on("data", function (chunk) {
              rawData += chunk;
            });

            res.on("end", function () {
              if (!(rawData && rawData.length)) {
                console.error("调用aardio函数时返回空数据,请求数据:", reqData);
                return reject("RPC服务端返回空数据");
              }
              var repData = JSON.parse(rawData);
              if (repData.error) return reject(repData.error);
              else return resolve(repData.result);
            });
          });
          req.shouldKeepAlive = false;

          req.on("error", e => {
            console.error("调用aardio函数时遇到错误,请求数据: ", reqData);
            reject(e);
          });

          req.write(reqData);
          req.end();
        });
      });
    };
  } else {
    xcall = function (method, ...args) {
      var reqData = JSON.stringify({
        method: method,
        id: method,
        jsonrpc: "2.0",
        params: args
      });

      return new Promise((resolve, reject) => {
        rpcReady(() => {
          fetch(rpchttpServerUrl, {
            body: reqData,
            cache: "no-cache",
            headers: {
              "Content-Type": "application/json",
              "Rpc-Client-Id": aardio.rpcClientId + ""
            },
            method: "POST",
            mode: "cors"
          })
            .then(response => response.json())
            .then(json => {
              if (json.error) {
                console.error("调用aardio函数时遇到错误,请求数据：", reqData);
                reject(json.error);
              } else resolve(json.result);
            })
            .catch(e => reject(e));
        });
      });
    };
  }

  aardio.xcall = xcall;
  aardio.on = on;
  aardio.ready = callback => {
    if (aardio.isReady) {
      callback(aardio.getCurrentWindow());
    } else {
      on("ready", callback);
    }
  };

  aardio.startEnviron = startEnviron;
  aardio.studioInvoke = startEnviron && startEnviron.studioInvoke;
  aardio.rpc = true;
  return aardio;
});
