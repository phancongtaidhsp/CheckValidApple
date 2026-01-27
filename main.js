const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const electron = require('electron');
const LineByLineReader = require('line-by-line');
const fs = require('fs-extra');
const { sampleSize } = require('lodash');
const { action } = require('./action');
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
  let outsuccess = `${__dirname}\\..\\extraResources\\ChangePassHotmailApple\\success.txt`;
  let outfail = `${__dirname}\\..\\extraResources\\ChangePassHotmailApple\\fail.txt`;
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
    const [mail, oath2, token] = info.split("|");
    let oath2token = `${oath2}|${token}`;
    
    if (pause) {
      isDone = false;
      lr.close();
      return;
    }

    try {
      (async () => {
          let proxiesApple = sampleSize(listProxy, 5);
          let [passwd, status] = await action(mail, oath2token, proxiesApple);
          if (status == "pass") {
            let result = `${mail}|${passwd}` + "\n";
            fs.appendFileSync(outsuccess, result);
            win.webContents.send('success', 1, pause);
            lr.resume();
          } else {
            fs.appendFileSync(outfail, result);
            win.webContents.send('fail', 1, pause);
            lr.resume();
          }
      })()
    } catch (error) {
      lr.resume();
      console.log(error);
    }

    if (startIndex >= thread - 1) {
      lr.pause()
    } else {
      startIndex++;
    }
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
  let pathFolder = `${__dirname}\\..\\extraResources\\ChangePassHotmailApple`;
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

const xuatKetQua = (pathFileMail) => {
  let outsuccess = `${__dirname}\\..\\extraResources\\ChangePassHotmailApple\\success.txt`;
  let outfail = `${__dirname}\\..\\extraResources\\ChangePassHotmailApple\\fail.txt`;
  let incompleteFile1 = isFileExists(pathFileMail);
  if (incompleteFile1) {
    win.webContents.send('checkfiles', incompleteFile1);
    return;
  }
  let listMail = fs.readFileSync(pathFileMail, 'utf8');
  listMail = listMail.split(/\r?\n/);
  let listMailSuccess = fs.readFileSync(outsuccess, 'utf8');
  listMailSuccess = listMailSuccess.split(/\r?\n/);
  let listMailFail = fs.readFileSync(outfail, 'utf8');
  listMailFail = listMailFail.split(/\r?\n/);
  // remove all mail success
  for (const maildata of listMailSuccess) {
    let mail = maildata.split('|')?.[0];
    let indexMail = listMail.findIndex(m => m == mail);
    if (indexMail >= 0) {
      listMail = [...listMail.slice(0, indexMail), ...listMail.slice(indexMail + 1)];
    }
  }
  let newListMailFail = [...listMailFail];
  for (const maildata of listMailFail) {
    if (maildata.includes("khong ve mail") || maildata.includes("fail step 3") || maildata.includes("fail send mail") || maildata.includes("recaptcha")) {
      // remove fail in fail file
      let indexMail = newListMailFail.findIndex(m => m == maildata);
      if (indexMail >= 0) {
        newListMailFail = [...newListMailFail.slice(0, indexMail), ...newListMailFail.slice(indexMail + 1)];
      }
    } else {
      // remove fail in input file
      let mail = maildata.split('|')?.[0];
      let indexMail = listMail.findIndex(m => m == mail);
      if (indexMail >= 0) {
        listMail = [...listMail.slice(0, indexMail), ...listMail.slice(indexMail + 1)];
      }
    }
  }
  fs.writeFileSync(pathFileMail, listMail.join('\n'), 'utf8');
  fs.writeFileSync(outfail, newListMailFail.join('\n'), 'utf8');
}

ipc.on('result', function (event, pathFileMail) {
  xuatKetQua(pathFileMail);
  win.webContents.send('result', true);
})