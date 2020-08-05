/// <reference types="electron" />

export = aardio;
export as namespace aardio;
type 
declare const aardio: aardio.ExternalEx

declare namespace aardio {

    type ExternalEx = External & {
        [key: string]: (...args: any[]) => Promise<any>;
    }

    interface External {

        /** 引用内置模块 */
        require<T = any>(moduleName: string): T;
        /** 引用内置Electron模块 */
        require(moduleName: 'electron'): typeof Electron;
        /** 调用aardio函数(即使在aasdl初始化以前仍然可以调用rpc函数) */
        xcall(method: string, ...args: any[]): Promise<any>;
        /** 注册aardio可调用的JS函数，如果同一进程内注册多个同名回调，仅回传最后一次回调的返回值，非aardio环境自动忽略不执行 */
        on(event: string, listener: (...args: any[]) => void): ExternalEx;
        /** 
         * 在aardio模块以及RPC函数服务端已准备就绪后（如果当前是浏览器渲染进程则DOM已准备就绪），
         * 执行此回调(如果当前已经准备就绪就直接执行) 
         */
        ready(listener: (win?: Electron.BrowserWindow) => void): ExternalEx; 
        /** 退出进程 */
        quit: () => void;
        /** 拖动标题栏，非aardio环境自动忽略不执行 */
        hitCaption: () => Promise<void>;
        /** 点击关闭窗口按钮，非aardio环境自动忽略不执行 */
        hitClose: () => Promise<void>;
        /** 点击最小化按钮，非aardio环境自动忽略不执行 */
        hitMin: () => Promise<void>;
        /** 点击最大化按钮，非aardio环境自动忽略不执行 */
        hitMax: () => Promise<boolean>;
        /** 窗口是否最大化，非aardio环境自动忽略不执行 */
        isZoomed: () => Promise<boolean>;
        /** 读取本地数据,此函数默认未定义，请在aardio的external接口导出该函数 */
        get: <T = any>(key: string) => Promise<T>;
        /** 写入本地数据,此函数默认未定义，请在aardio的external接口导出该函数 */
        set: <T>(key: string, value?: T) => Promise<void>;
        /** 获取electron主进程全局变量，仅在electron环境中有效 */
        getGlobal<T = any>(sharedObjectName: string): T
    }

    interface External {

         /** 返回主窗口 */
        getMainWindow(): Electron.BrowserWindow;

        /** electron渲染进程返回当前BrowserWindow对象,主进程中返回主窗口 */
        getCurrentWindow(): Electron.BrowserWindow;

        /** 
         * 创建electron窗口，
         * options未指定的选项将使用创建主窗口时指定的值,
         * 此函数仅在electron环境中有效 
         * */
        createBrowserWindow(options?: Electron.BrowserWindowConstructorOptions): Electron.BrowserWindow 

        /** 
         * 创建electron窗口并打开指定网址，
         * options未指定的选项将使用创建主窗口时指定的值,
         * loadUrl可使用相对于主窗口页面的相对路径，如果loadUrl首字符为斜杠则转换为根对于根目录的路径
         * 此函数仅在electron环境中有效 
         * */
        createBrowserWindow(options: Electron.BrowserWindowConstructorOptions,loadUrl: string, loadUrlOptions?: Electron.LoadURLOptions): Electron.BrowserWindow;

        /** 
         * electron主进程或渲染进程:
         * url可传入相对于Electron主窗口页面的相对路径，
         * 如果首字符为斜杠则转换为根对于根目录的路径
         * 返回完整URL
         * */
        fullUrl(url:string):string;
    }

    interface External {

        /** aardio模块以及RPC函数服务端是否已准备就绪（如果当前是浏览器渲染进程则DOM已准备就绪），在此之前RPC函数只能通过xcall调用 */
        isReady: boolean;
        /** aardio/rpc 服务器是否可用 */
        rpc: boolean;
        /** 当前是否在浏览器环境中运行，在Electron主进程运行为false */
        browser: boolean;
        /** 当前是否在Electron环境中运行 */
        electron: boolean;
        /** 当前是否在Electron 渲染进程中运行 */
        electronRenderer: boolean;
        /** 当前是否在aardio开发环境中运行，发布后为false */
        studioInvoke: boolean;
        /** 当前electron窗口句柄 */
        hwndElectron: number; 
        
        /** 
         * 在aardio中创建 electron.app 对象时传入的启动参数，
         * 这是一个electron多进程共享对象，读写已经存在的字段时会自动更新为最新的值。
         * 如果增加了字段请自行添加d.ts文件，并在aardio名字空间下添加StartEnviron接口的成员
         */
        startEnviron: StartEnviron;
    }

    interface StartEnviron {
        /** 
         * 主窗口启动的主页地址,
         * 如果主页置入主进程目录则默认使用file:协议， 
         * 置入aardio资源目录则默认使用http:协议
         * */
        indexUrl: string;
        /** 启动参数 */
        args ?: { [key: string]: string;  }
        /** 主进程启动目录,发布后为asar文件路径 */
        appPath: string;
        /** RPC服务以及嵌入HTTP服务端口 */
        rpcPort: number;
        /** 创建主窗口使用的参数 */
        browserWindow: Electron.BrowserWindowConstructorOptions;
        /** 应用程序英文名称 */
        name: string;
        /** 窗口默认标题,可在aardio中创建electron.app的第一个参数中指定，或使用win.title指定 */
        title: string;
        /** 主窗口使用的图标路径 */
        icon: string;
        /** 自定义启动令牌 */
        token?: string;
    }
}