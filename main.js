const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const electron = require('electron');
const LineByLineReader = require('line-by-line');
const fs = require('fs-extra');
const { CHBMAppleID } = require('./ipv4');
const { sampleSize } = require('lodash');
const ipc = electron.ipcMain;

let win;
let lr;
let pause = false;
let currentIndex = 0;
let startTime = 0;
let interval;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

const run = async function (pathFileMail, pathFileProxy, thread) {
  let incompleteFile1 = isFileExists(pathFileMail);
  let incompleteFile2 = isFileExists(pathFileMail);
  if (incompleteFile1) {
    win.webContents.send('checkfiles', incompleteFile1);
    return;
  }
  if (incompleteFile2) {
    win.webContents.send('checkfiles', incompleteFile2);
    return;
  }
  win.webContents.send('disable', true);
  let listProxy = fs.readFileSync(pathFileProxy, 'utf8');
  listProxy = listProxy.split(/\r?\n/);
  let count = 0;
  let out = `${__dirname}\\..\\extraResources\\CHBM\\output.txt`;
  let objectThread = {};
  let startIndex = 0;
  lr = new LineByLineReader(pathFileMail, {
    start: currentIndex
  })
  lr.on('error', function (err) {
    // 'err' contains error object
    win.webContents.send('loi', err);
    win.webContents.send('disable', false);
  });

  lr.on('line', async function (info) {
    const [mail, pass] = info.split("|");
    let ix = startIndex;
    if (pause) {
      isDone = false;
      lr.close();
      return;
    }
    if (!listProxy[count]) {
      count = 0;
    }
    if (startIndex >= thread) {
      for (const key in objectThread) {
        if (Object.hasOwnProperty.call(objectThread, key)) {
          if (objectThread[key]?.checking === false) {
            ix = key;
            break;
          }
        }
      }
    }
    objectThread[ix] = { mail, checking: true, checked: false }
    try {
      (async() => {
        let vInfo = {};
        let tryTime = 0;
        do {
          let proxy = sampleSize(listProxy, 1)[0];
          vInfo = await CHBMAppleID(mail, pass, proxy);
          if (vInfo.status == "checked") {
            objectThread[ix] = { mail, checking: false, checked: vInfo.status === "checked" }
            let result = Object.values(vInfo).join("|") + "\n";
            fs.appendFileSync(out, result);
            win.webContents.send('success', 1, pause);
            lr.resume();
          } else {
            tryTime++;
          }
        } while (vInfo.status != 'checked' && tryTime < 5 && !pause);
        if(vInfo?.status != 'checked') {
          objectThread[ix] = { mail, checking: false, checked: vInfo.status === "checked" }
          let result = Object.values({...vInfo, status: "not checked"}).join("|") + "\n";
          fs.appendFileSync(out, result);
          win.webContents.send('fail', 1, pause);
          lr.resume();
        }
      })()
    } catch (error) {
      console.log(error);
    }


    if (startIndex >= thread - 1) {
      lr.pause()
    } else {
      startIndex++;
    }
    count++;
    currentIndex++;
    win.webContents.send('total', currentIndex);
  });


  lr.on('end', async function () {
    // All lines are read, file is closed now.
    if (interval) {
      clearInterval(interval)
    }
    win.webContents.send('disable', false);
  });
}

function isFileExists(pathFile) {
  const check = fs.pathExistsSync(pathFile);
  if (!check) return pathFile;
  return false;
}

ipc.on('start', async function (event, pathFileMail, pathFileProxy, thread) {
  let pathFolder = `${__dirname}\\..\\extraResources\\CHBM`;
  let incompleteFolder = isFileExists(pathFolder);
  if (incompleteFolder) {
    fs.mkdirSync(pathFolder);
  }
  pause = false;
  interval = setInterval(() => {
    startTime++;
    win.webContents.send('time', startTime);
  }, 1000);
  run(pathFileMail, pathFileProxy, thread);
})

ipc.on('pause', async function (event) {
  if (lr) {
    pause = true;
    if (interval) {
      clearInterval(interval)
    }
    win.webContents.send('info', "Đang tạm dừng...Vui lòng chờ...", true);
  }
})

ipc.on('result', function (event, pathFileMail) {
  let output = `${__dirname}\\..\\extraResources\\CHBM\\output.txt`;
  let incompleteFile1 = isFileExists(pathFileMail);
  if (incompleteFile1) {
    win.webContents.send('checkfiles', incompleteFile1);
    return;
  }
  let listMail = fs.readFileSync(pathFileMail, 'utf8');
  listMail = listMail.split(/\r?\n/);
  let listMailOutput = fs.readFileSync(output, 'utf8');
  listMailOutput = listMailOutput.split(/\r?\n/);
  // remove all mail success
  for (const maildata of listMailOutput) {
    let mail = maildata.split('|')?.[0];
    let indexMail = listMail.findIndex(m => m.includes(mail));
    if (maildata.includes("|checked|") && indexMail >= 0) {
      listMail = [...listMail.slice(0, indexMail), ...listMail.slice(indexMail + 1)];
    }
  }
  
  fs.writeFileSync(pathFileMail, listMail.join('\n'), 'utf8');
  win.webContents.send('result', true);
})