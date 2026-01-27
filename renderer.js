
document.getElementById('start').addEventListener('click', function () {
  document.getElementById('thongbao').classList.add('hidden')
  let pathFileMail = document.getElementById('filepathmail').value
  let pathFileProxy = document.getElementById('filepathproxy').value
  if(pathFileMail[0] == '"') {
    pathFileMail = pathFileMail.substring(1)
  }
  if(pathFileMail[pathFileMail.length - 1] == '"') {
    pathFileMail = pathFileMail.substring(0, pathFileMail.length - 1)
  }
  if(pathFileProxy[0] == '"') {
    pathFileProxy = pathFileProxy.substring(1)
  }
  if(pathFileProxy[pathFileProxy.length - 1] == '"') {
    pathFileProxy = pathFileProxy.substring(0, pathFileProxy.length - 1)
  }
  let thread = document.getElementById('thread').value;
  window.electronAPI.start(pathFileMail, pathFileProxy, thread);
});

document.getElementById('pause').addEventListener('click', function () {
  window.electronAPI.pause();
});

document.getElementById('result').addEventListener('click', function () {
  let pathFileMail = document.getElementById('filepathmail').value;
  if (pathFileMail[0] == '"') {
    pathFileMail = pathFileMail.substring(1)
  }
  if (pathFileMail[pathFileMail.length - 1] == '"') {
    pathFileMail = pathFileMail.substring(0, pathFileMail.length - 1)
  }
  window.electronAPI.result(pathFileMail);
});