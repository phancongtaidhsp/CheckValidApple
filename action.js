const { sendMail, changePassword } = require("./apple");
const { delay, getUrlViaOauth2, generatePassword } = require("./helper");

const action = async (mail, oath2token, proxiesApple) => {
  console.log("sending mail...");
  let sendMailRes = '';
  for (let i = 0; i < 5; i++) {
    console.log("sending mail " + i + "...");
    let proxyApple = proxiesApple[i];
    sendMailRes = await sendMail(mail, proxyApple);
    if (sendMailRes === 'successfully') {
      break;
    } else {
      await delay(2000);
    }
  }
  if (sendMailRes === 'successfully') {
    console.log("sending mail thanh cong...");
    let url = '';
    await delay(3000);
    for (let i = 0; i < 5; i++) {
      url = await getUrlViaOauth2(mail, oath2token);
      if (url) {
        break;
      }
      await delay(2000);
    }
    console.log(url);
    if (url) {
      for (let i = 0; i < 5; i++) {
        let proxyApple = proxiesApple[i];
        let passwd = generatePassword();
        const resChanged = await changePassword(passwd, url, proxyApple);
        if (resChanged === 'successfully') {
          console.log("doi pass thanh cong");
          return Promise.resolve([passwd, "pass"]);
        }
        await delay(2000);
      }
    }
    return Promise.resolve(['', "fail step 3"]);
  } else {
    return Promise.resolve(['', sendMailRes]);
  }
}

module.exports = {
  action
}