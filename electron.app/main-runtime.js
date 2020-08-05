const aardio = require('aardio')  //启动RPC服务允许调aardio/electron互调函数,创建BrowserWindow主窗口
const {app, BrowserWindow} = require('electron') 

/*
aardio-electron 主进程已准备就绪,主窗口已创建触发此事件,
aardio对象的ready事件可叠加注册多个回调
*/
aardio.on('ready', (win) => { 
	//参数win是BrowserWindow对象
	win.maximize();
	
	win.on('closed', () => {  
    	
	})  
}) 

//可以继续设置其他aardio用到的RPC回调函数,
//注意RPC回调函数同名字不是叠加注册而是直接替换,但可以直接返回值.
aardio.on('main.hello', (str) => {
   
    return "electron主进程应答" + str;
}) 

app.on('window-all-closed', () => {
    app.quit();
      
    }) 