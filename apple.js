const axios = require('axios-https-proxy-fix');
const cheerio = require('cheerio');
const { getCaptchaResultNope } = require('./helper');

const instance = axios.create({
  timeout: 15000,
})

const getConfig = (proxy) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: 'https://iforgot.apple.com/password/verify/appleid',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      }
    };
    instance.request(options)
      .then(function (response) {
        const $ = cheerio.load(response.data);
        let sstt = null;
        let ssttt = null;
        let ifssp = null;
        let xAppleWebToken = null;
        $('#boot_args').each((index, element) => {
          const text = $(element).text();
          if (text.includes("sstt")) {
            const jsonObj = JSON.parse(text);
            sstt = jsonObj?.sstt;
            ssttt = encodeURIComponent(sstt);
          }
        })
        if (response?.headers?.['set-cookie']) {
          for (const c of response?.headers?.['set-cookie']) {
            if (c.includes("ifssp=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("ifssp")) {
                  ifssp = cc.split("=")?.[1];
                }
              }
            }
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        resolve([sstt, ssttt, ifssp, xAppleWebToken]);
      })
      .catch((error) => {
        resolve([null, null, null, null]);
      });
  })
}

const getCaptchaReq = (proxy, xAppleWebToken, ifssp, ssttt) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: 'https://iforgot.apple.com/captcha?captchaType=IMAGE',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; X-Apple-I-Web-Token=${xAppleWebToken}; ifssp=${ifssp}`,
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      }
    };
    instance.request(options)
      .then(function (response) {
        let captchaImage = null;
        let captchaId = null;
        let captchaToken = null;
        if (response?.data?.payload) {
          captchaImage = response?.data?.payload?.content;
          captchaId = response?.data?.id;
          captchaToken = response?.data?.token;
        }
        resolve([captchaImage, captchaId, captchaToken])
      })
      .catch((error) => {
        let captchaImage = null;
        let captchaId = null;
        let captchaToken = null;
        if (error?.response?.data?.payload) {
          captchaImage = error.response.data.payload.content;
          captchaId = error.response.data.id;
          captchaToken = error.response.data.token;
          resolve([captchaImage, captchaId, captchaToken])
        }
        resolve([null, null, null]);
      });
  })
}

const sendCaptcha = (proxy, email, xAppleWebToken, ifssp, ssttt, captchaId, captchaToken, textCaptcha) => {
  return new Promise((resolve) => {
    let data = JSON.stringify({
      "id": email,
      "captcha": {
        "id": captchaId,
        "answer": textCaptcha,
        "token": captchaToken
      }
    });
    var options = {
      method: 'POST',
      proxy,
      url: 'https://iforgot.apple.com/password/verify/appleid',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Origin': 'https://iforgot.apple.com',
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      maxRedirects: 0,
      data
    };
    instance.request(options)
      .then(function (response) {
        if (response?.data) {
          let jsonString = JSON.stringify(response?.data)
          if (jsonString.includes("is not active")) {
            resolve("This Apple ID is not active")
          } else if (jsonString.includes("trustedPhones")) {
            resolve("Verify phone")
          } else if (jsonString.includes("Please enter the characters you see or hear to continue")) {
            resolve("wrong captcha")
          } else if (jsonString.includes("not valid or not supported")) {
            resolve("This Apple ID is not valid or not supported")
          } else {
            resolve([null, null])
          }
        } else {
          resolve([null, null]);
        }
      })
      .catch((error) => {
        if (error?.response?.status == 302) {
          let location = null;
          let xAppleWebToken = null;
          location = error?.response?.headers?.location;
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
          resolve([location, xAppleWebToken]);
        } else if (error?.response?.data) {
          let jsonString = JSON.stringify(error?.response?.data)
          if (jsonString.includes("is not active")) {
            resolve("This Apple ID is not active")
          } else if (jsonString.includes("trustedPhones")) {
            resolve("Verify phone")
          } else if (jsonString.includes("Please enter the characters you see or hear to continue")) {
            resolve("wrong captcha")
          } else if (jsonString.includes("not valid or not supported")) {
            resolve("This Apple ID is not valid or not supported")
          } else {
            resolve([null, null])
          }
        } else {
          resolve([null, null]);
        }
      });
  })
}

const verifyCaptcha = (proxy, ifssp, xAppleWebToken, ssttt, location) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: `https://iforgot.apple.com${location}`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        let emailAddress = null;
        let sstt = null;
        let jsonString = JSON.stringify(response?.data);
        if (jsonString.includes("is not active")) {
          resolve("This Apple ID is not active")
        } else if (jsonString.includes("trustedPhones")) {
          resolve("Verify phone")
        } else if (jsonString.includes("Please enter the characters you see or hear to continue")) {
          resolve("wrong captcha")
        } else if (jsonString.includes("not valid or not supported")) {
          resolve("This Apple ID is not valid or not supported")
        } else if (response?.data?.emailAddress) {
          emailAddress = response?.data?.emailAddress;
          sstt = response?.data?.sstt;
        } else {
          sstt = response?.data?.sstt;
        }
        resolve([emailAddress, sstt]);
      })
      .catch((error) => {
        console.log("verifyCaptcha error...");
        console.log(error);
        resolve([null, null]);
      });
  })
}

const recoverOption = (proxy, ifssp, xAppleWebToken, ssttt) => {
  return new Promise((resolve) => {
    let data = JSON.stringify({
      "recoveryOption": "reset_password"
    });
    var options = {
      method: 'POST',
      proxy,
      url: `https://iforgot.apple.com/recovery/options`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; X-Apple-I-Web-Token=${xAppleWebToken}; ifssp=${ifssp}`,
        'Origin': 'https://iforgot.apple.com',
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      data,
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        resolve([null, null]);
      })
      .catch((error) => {
        let location = null;
        let xAppleWebToken = null;
        if (error?.response?.headers?.location) {
          location = error?.response?.headers?.location;
        }
        if (error?.response?.headers?.['set-cookie']) {
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        resolve([location, xAppleWebToken]);
      });
  })
}

const sendRequestMail = (proxy, ifssp, xAppleWebToken, ssttt) => {
  let data = JSON.stringify({
    "type": "questions"
  });
  return new Promise((resolve) => {
    var options = {
      method: 'POST',
      proxy,
      url: `https://iforgot.apple.com/password/authenticationmethod`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Origin': 'https://iforgot.apple.com',
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      data,
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        let emailAddress = null;
        let sstt = null;
        if (response?.data?.emailAddress) {
          emailAddress = response?.data?.emailAddress;
          sstt = response?.data?.sstt;
        }
        resolve([emailAddress, sstt]);
      })
      .catch((error) => {
        if (error?.response?.status == 302) {
          let location = null;
          let xAppleWebToken = null;
          location = error?.response?.headers?.location;
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
          resolve([location, xAppleWebToken]);
        } else {
          resolve([null, null]);
        }
      });
  })
}

const verifyBirthday = (proxy, ifssp, xAppleWebToken, ssttt, location, birthday) => {
  let data = null;
  if (birthday) {
    data = JSON.stringify({
      "monthOfYear": birthday.month,
      "dayOfMonth": birthday.day,
      "year": birthday.year
    });
  }
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: `https://iforgot.apple.com${location}`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      maxRedirects: 0
    };
    if (data) {
      options = {
        method: 'POST',
        url: 'https://iforgot.apple.com/password/verify/birthday',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Origin': 'https://iforgot.apple.com',
          'Referer': 'https://iforgot.apple.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sstt': ssttt,
          'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`
        },
        maxRedirects: 0,
        data: data
      }
    }
    instance.request(options)
      .then(function (response) {
        let ssttt = null;
        let xAppleWebToken = null;
        if (response?.headers?.['set-cookie']) {
          for (const c of response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        if (response?.headers?.sstt) {
          ssttt = response.headers.sstt;
        }
        resolve([ssttt, xAppleWebToken]);
      })
      .catch((error) => {
        if (error?.response?.status == 302) {
          let location = null;
          let xAppleWebToken = null;
          location = error?.response?.headers?.location;
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
          resolve([location, xAppleWebToken]);
        } else {
          resolve([null, null]);
        }
      });
  })
}

const verifyQuestion = (proxy, ifssp, xAppleWebToken, ssttt, location, questions) => {
  let data = null;
  if (questions) {
    data = JSON.stringify({
      "questions": questions
    });
  }
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: `https://iforgot.apple.com${location}`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      maxRedirects: 0
    };
    if (data) {
      options = {
        method: 'POST',
        url: 'https://iforgot.apple.com/password/verify/questions',
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
          'Origin': 'https://iforgot.apple.com',
          'Referer': 'https://iforgot.apple.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
          'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sstt': ssttt,
          'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`
        },
        maxRedirects: 0,
        data: data
      }
    }
    instance.request(options)
      .then(function (response) {
        let ssttt = null;
        let xAppleWebToken = null;
        let questions = [];
        if (response?.headers?.['set-cookie']) {
          for (const c of response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        if (response?.headers?.sstt) {
          ssttt = response.headers.sstt;
        }
        if (response?.data?.questions) {
          questions = response.data.questions.map(q => ({ id: q.id, number: q.number, question: q.question }));
        }
        resolve([ssttt, xAppleWebToken, questions]);
      })
      .catch((error) => {
        if (error?.response?.status == 302) {
          let location = null;
          let xAppleWebToken = null;
          let ssttt = null;
          location = error?.response?.headers?.location;
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
          if (error?.response?.headers?.location) {
            location = error?.response?.headers?.location;
            ssttt = location.split("sstt=")?.[1];
          }
          resolve([location, xAppleWebToken, ssttt]);
        } else {
          console.log(error);
          resolve([null, null]);
        }
      });
  })
}


const sendRequestChangePass = (proxy, url) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        resolve([null, null, null, null])
      })
      .catch((error) => {
        let xAppleWebToken = null;
        let ifssp = null;
        let location = null;
        let sstt = null;
        if (error?.response?.headers?.['set-cookie']) {
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("ifssp=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("ifssp")) {
                  ifssp = cc.split("=")?.[1];
                }
              }
            }
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        if (error?.response?.headers?.location) {
          location = error?.response?.headers?.location;
          sstt = location.split("sstt=")?.[1];
        }
        resolve([xAppleWebToken, ifssp, location, sstt])
      });
  })
}

const getRequestChangePass = (proxy, location, ifssp, xAppleWebToken) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: `https://iforgot.apple.com${location}`,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      },
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        let xAppleWebToken = null;
        if (response?.headers?.['set-cookie']) {
          for (const c of response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        let status = null;
        if (response?.headers?.location?.includes("/password/reset/options") || response?.headers?.location?.includes("/password/unlock")) {
          status = "unlock"
        } else if (response?.headers?.location?.includes("/password/reset")) {
          status = "ok"
        }
        resolve([status, xAppleWebToken])
      })
      .catch((error) => {
        let xAppleWebToken = null;
        let sstt = null;
        let location = null;
        if (error?.response?.headers?.['set-cookie']) {
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        if (error?.response?.headers?.location) {
          location = error?.response?.headers?.location;
          sstt = location.split("sstt=")?.[1];
        }
        if (error?.response?.headers?.location?.includes("sstt=")) {
          resolve(["retry", location, xAppleWebToken, sstt]);
        } else {
          resolve[null, null]
        }
      });
  })
}

const sendResetOption = (proxy, ifssp, xAppleWebToken, ssttt) => {
  let data = JSON.stringify({
    "type": "password_reset"
  });

  return new Promise((resolve) => {
    var options = {
      method: 'POST',
      proxy,
      url: `https://iforgot.apple.com/password/reset/options`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Origin': 'https://iforgot.apple.com',
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      data,
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        resolve([null, null, null])
      })
      .catch((error) => {
        let xAppleWebToken = null;
        let location = null;
        let sstt = null;
        if (error?.response?.headers?.['set-cookie']) {
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        if (error?.response?.headers?.location) {
          location = error?.response?.headers?.location;
          sstt = location.split("sstt=")?.[1];
        }
        resolve([xAppleWebToken, location, sstt])
      });
  })
}

const getResetOption = (proxy, location, ifssp, xAppleWebToken, ssttt) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      proxy,
      url: `https://iforgot.apple.com${location}`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        let xAppleWebToken = null;
        let sstt = null;
        if (response?.headers?.['set-cookie']) {
          for (const c of response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        console.log("response...data..");
        console.log(response?.data);
        sstt = response?.data?.sstt;
        resolve([xAppleWebToken, sstt])
      })
      .catch((error) => {
        let xAppleWebToken = null;
        let location = null;
        let sstt = null;
        if (error?.response?.headers?.['set-cookie']) {
          for (const c of error?.response?.headers?.['set-cookie']) {
            if (c.includes("X-Apple-I-Web-Token=")) {
              let carr = c.split(";");
              for (const cc of carr) {
                if (cc.includes("X-Apple-I-Web-Token")) {
                  xAppleWebToken = cc.split("=")?.[1];
                }
              }
            }
          }
        }
        if (error?.response?.headers?.location) {
          location = error?.response?.headers?.location;
          sstt = location.split("sstt=")?.[1];
        }
        console.log("errordw...");
        console.log(error);
        resolve([xAppleWebToken, sstt, location])
      });
  })
}

const changePasswordReq = (proxy, password, ifssp, xAppleWebToken, ssttt) => {
  let data = JSON.stringify({
    "password": password
  });

  return new Promise((resolve) => {
    var options = {
      method: 'POST',
      proxy,
      url: `https://iforgot.apple.com/password/reset`,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Cookie': `idclient=web; dslang=US-EN; site=USA; geo=US; ifssp=${ifssp}; X-Apple-I-Web-Token=${xAppleWebToken}`,
        'Origin': 'https://iforgot.apple.com',
        'Referer': 'https://iforgot.apple.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sstt': ssttt
      },
      data,
      maxRedirects: 0
    };
    instance.request(options)
      .then(function (response) {
        if (response?.data?.resetCompleted) {
          resolve("successfully");
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        resolve(null);
      });
  })
}

const sendMail = async (email, password, birthday, answers, proxyString) => {
  return new Promise(async (resolve) => {
    try {
      const proxyArr = proxyString.split(":");
      const proxy = {
        protocol: 'http',
        host: proxyArr[0],
        port: parseInt(proxyArr[1]),
        ...(proxyArr[2] && {
          auth: { username: proxyArr[2], password: proxyArr[3] }
        })
      }
      let countTry = 0;
      let flagRetryCaptcha = false;
      let location, emailAddress = null;
      let [sstt, ssttt, ifssp, xAppleWebToken] = [null, null, null, null];
      for (let i = 0; i < 3; i++) {
        [sstt, ssttt, ifssp, xAppleWebToken] = await getConfig(proxy);
        if (sstt && ssttt && ifssp && xAppleWebToken) {
          break;
        }
      }
      do {
        countTry++;
        console.log("countTry " + email + "...");
        console.log(countTry);
        flagRetryCaptcha = false;
        if (sstt && ssttt && ifssp && xAppleWebToken) {
          let [captchaImage, captchaId, captchaToken] = await getCaptchaReq(proxy, xAppleWebToken, ifssp, ssttt);
          if (captchaImage && captchaId && captchaToken) {
            let textCaptcha = await getCaptchaResultNope(null, "okabyf0t8m_BLVGCZCW", captchaImage);
            console.log("textCaptcha...");
            console.log(textCaptcha);
            if (textCaptcha) {
              const resSendCaptcha = await sendCaptcha(proxy, email, xAppleWebToken, ifssp, ssttt, captchaId, captchaToken, textCaptcha);
              console.log("resSendCaptcha...");
              console.log(resSendCaptcha);
              if (resSendCaptcha === "wrong captcha") {
                flagRetryCaptcha = true;
              } else if (Array.isArray(resSendCaptcha)) {
                [location, xAppleWebToken] = resSendCaptcha;
                if (location) {
                  ssttt = location.split("sstt=")?.[1];
                  for (let i = 0; i < 3; i++) {
                    const verifyCaptRes = await verifyCaptcha(proxy, ifssp, xAppleWebToken, ssttt, location);
                    console.log("verifyCaptRes...");
                    console.log(verifyCaptRes);
                    if (Array.isArray(verifyCaptRes)) {
                      [emailAddress, sstt] = verifyCaptRes;
                      ssttt = encodeURIComponent(sstt);
                      console.log("emailAddress...");
                      console.log(emailAddress);
                      if (emailAddress) {
                        let firstC = emailAddress[0].toLowerCase();
                        let firstCEmail = email[0].toLowerCase();
                        let firstCAfter = emailAddress.split("@")?.[1]?.[0]?.toLowerCase();
                        let firstCAfterEmail = email.split("@")?.[1]?.[0]?.toLowerCase();
                        if (firstC == firstCEmail && firstCAfter == firstCAfterEmail) {
                          console.log("inside...");
                          [location, xAppleWebToken] = await sendRequestMail(proxy, ifssp, xAppleWebToken, ssttt);
                          if (emailAddress) {
                            console.log("verifyBirthday...");
                            [ssttt, xAppleWebToken] = await verifyBirthday(proxy, ifssp, xAppleWebToken, ssttt, location);
                            [location, xAppleWebToken] = await verifyBirthday(proxy, ifssp, xAppleWebToken, ssttt, '/password/verify/birthday', birthday);
                            if (!location) {
                              return resolve({
                                mail: email,
                                pass: password,
                                proxy: proxyString,
                                status: 'checked',
                                note: 'sai birthday'
                              })
                            }
                            let questions = [];
                            [ssttt, xAppleWebToken, questions] = await verifyQuestion(proxy, ifssp, xAppleWebToken, ssttt, location);
                            console.log("questions1....");
                            console.log(questions);
                            if (questions?.length > 0) {
                              questions = questions.map(q => ({ ...q, answer: answers[q.question] }))
                            } else {
                              return resolve({
                                mail: email,
                                pass: password,
                                proxy: proxyString,
                                status: 'checked',
                                note: 'sai chbm'
                              })
                            }
                            console.log("questions2....");
                            console.log(questions);
                            [location, xAppleWebToken, ssttt] = await verifyQuestion(proxy, ifssp, xAppleWebToken, ssttt, '/password/verify/questions', questions);
                            if (!location) {
                              return resolve({
                                mail: email,
                                pass: password,
                                proxy: proxyString,
                                status: 'checked',
                                note: 'sai chbm'
                              })
                            }
                            [xAppleWebToken, ssttt, location] = await getResetOption(proxy, location, ifssp, xAppleWebToken, ssttt);
                            console.log("getResetOption result...");
                            if (xAppleWebToken && location && ssttt) {
                              console.log("90%...");
                              if (location.includes('/password/unlock')) {
                                [xAppleWebToken, location, ssttt] = await sendResetOption(proxy, ifssp, xAppleWebToken, ssttt);
                                if (xAppleWebToken && location && ssttt) {
                                  let isFinal1 = await changePasswordReq(proxy, password, ifssp, xAppleWebToken, ssttt);
                                  console.log("isFinal1...");
                                  console.log(isFinal1);
                                  return resolve({
                                    mail: email,
                                    pass: password,
                                    proxy: proxyString,
                                    status: 'checked',
                                    note: isFinal1
                                  })
                                }
                              } else {
                                let isFinal2 = await changePasswordReq(proxy, password, ifssp, xAppleWebToken, ssttt);
                                console.log("isFinal2...");
                                console.log(isFinal2);
                                return resolve({
                                  mail: email,
                                  pass: password,
                                  proxy: proxyString,
                                  status: 'checked',
                                  note: isFinal2
                                })
                              }
                            }
                          }
                        } else {
                          return resolve({
                            mail: email,
                            pass: password,
                            proxy: proxyString,
                            status: 'checked',
                            note: 'mail not match'
                          })
                        }
                        break;
                      } else {
                        [location, xAppleWebToken] = await recoverOption(proxy, ifssp, xAppleWebToken, ssttt);
                      }
                    } else {
                      return resolve({
                        mail: email,
                        pass: password,
                        proxy: proxyString,
                        status: 'not checked',
                        note: verifyCaptRes
                      })
                    }
                  }
                }
              } else {
                return resolve({
                  mail: email,
                  pass: password,
                  proxy: proxyString,
                  status: 'not checked',
                  note: resSendCaptcha
                })
              }
            }
          }
        }
      } while (flagRetryCaptcha && countTry < 10);
      return resolve({
        mail: email,
        pass: password,
        proxy: proxyString,
        status: 'not checked'
      })
    } catch (error) {
      console.log(error);
      return resolve({
        mail: email,
        pass: password,
        proxy: proxyString,
        status: 'not checked'
      })
    }
  })
}

const changePassword = async (password, url, proxyString) => {
  return new Promise(async (resolve) => {
    try {
      const proxyArr = proxyString.split(":");
      const proxy = {
        protocol: 'http',
        host: proxyArr[0],
        port: parseInt(proxyArr[1]),
        ...(proxyArr[2] && {
          auth: { username: proxyArr[2], password: proxyArr[3] }
        })
      }
      let status = null;
      let [xAppleWebToken, ifssp, location, sstt] = await sendRequestChangePass(proxy, url);
      if (location && xAppleWebToken && ifssp) {
        const resReq = await getRequestChangePass(proxy, location, ifssp, xAppleWebToken);
        if (resReq?.[0] == "retry") {
          [status, location, xAppleWebToken, sstt] = resReq;
          [status, xAppleWebToken] = await getRequestChangePass(proxy, location, ifssp, xAppleWebToken);
        } else {
          [status, xAppleWebToken] = resReq;
        }
        if (status == "unlock") {
          if (status && xAppleWebToken) {
            [xAppleWebToken, location, sstt] = await sendResetOption(proxy, ifssp, xAppleWebToken, sstt);
            if (xAppleWebToken && location && sstt) {
              [xAppleWebToken, sstt] = await getResetOption(proxy, location, ifssp, xAppleWebToken, sstt);
              if (xAppleWebToken && sstt) {
                sstt = encodeURIComponent(sstt);
                let isFinal1 = await changePasswordReq(proxy, password, ifssp, xAppleWebToken, sstt);
                return resolve(isFinal1);
              }
            }
          }
        } else if (status == "ok") {
          let isFinal2 = await changePasswordReq(proxy, password, ifssp, xAppleWebToken, sstt);
          return resolve(isFinal2);
        }
      }
      return resolve(null);
    } catch (error) {
      console.log(error);
      return resolve(null);
    }
  })
}

(async () => {
  // let a = await changePassword("Qwer112113@", "https://iforgot.apple.com/verify/email?key=001396-00-6f54950e557827d0b1ce3febd071b2698a0e4b8d6a23869f8469adb1aa958724LTOW&language=US-EN", "127.0.0.1:40001");
  // console.log(a);
  let b = await sendMail(
    "rungimac@hotmail.com",
    "Zxcv123123@@@",
    { 'day': '03', 'month': '10', 'year': '1988' },
    {
      'What is the first name of your best friend in high school?': 'CPGkfP2AYI',
      'What is your dream job?': 'VyCM1W505D',
      'In what city did your parents meet?': 'Jx2Yu2ZKNg'
    },
    "residential.legionproxy.io:12321:47069246f87a:a01050b0eb1b"
  );
  console.log(b);

})()

module.exports = {
  sendMail,
  changePassword
}