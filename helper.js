const { faker } = require('@faker-js/faker');
const axios = require('axios-https-proxy-fix');
const axiosDefault = require('axios');
const FormData = require('form-data');
const randomize = require('randomatic');
const CryptoJS = require("crypto-js");
const secretKey = "taipc";

const instance = axios.create({
  timeout: 15000,
})

const instanceDefault = axiosDefault.create({
  timeout: 15000,
})

const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const randomBirthdate = () => {
  let day = Math.floor(Math.random() * 12) + 1;
  let month = Math.floor(Math.random() * 12) + 1;
  var year = Math.floor(Math.random() * 30) + 1970;
  return `${year}-${month}-${day}`;
}

const randomFirstName = () => {
  return faker.person.firstName();
}

const randomLastName = () => {
  return faker.person.lastName();
}

const checkProxyStatus = async (proxyString) => {
  for (let i = 0; i < 3; i++) {
    const proxyArr = proxyString.split(":");
    const proxy = {
      protocol: 'http',
      host: proxyArr[0],
      port: parseInt(proxyArr[1]),
      ...(proxyArr[2] && {
        auth: { username: proxyArr[2], password: proxyArr[3] }
      })
    }
    var options = {
      method: 'GET',
      proxy,
      url: 'https://httpbin.org/ip',
      headers: {
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
    try {
      const resCheck = await instance.request(options);
      if (resCheck?.data) {
        return { proxy: proxyString, status: 'pass' };
      }
      return { proxy: proxyString, status: 'fail' };
    } catch (error) {
      console.log(error);
    }
    await delay(1000);
  }
  return { proxy: proxyString, status: 'fail' };
}

const getBalanceDaisySMS = async (apiKey) => {
  let promises = [];
  for (let i = 0; i < 2; i++) {
    promises.push(new Promise((resolve) => {
      var options = {
        method: 'GET',
        url: `https://daisysms.com/stubs/handler_api.php?api_key=${apiKey}&action=getBalance`,
        headers: {
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
      instanceDefault.request(options)
        .then(function (response) {
          if (response?.data?.includes("ACCESS_BALANCE")) {
            let balance = Number(response?.data?.replace("ACCESS_BALANCE:", ""));
            resolve(balance);
          } else {
            resolve(-1);
          }
        }).catch((e) => {
          resolve(-1);
        });
    }))
  }
  const [balance1, balance2] = await Promise.all(promises);
  if (balance1 == balance2) {
    return balance1;
  }
  return 0;
}

const getBalance2Captcha = async (keyCaptcha) => {
  return new Promise((resolve) => {
    var data = JSON.stringify({
      "clientKey": keyCaptcha
    });
    var options = {
      method: 'POST',
      url: 'https://api.2captcha.com/getBalance',
      headers: {
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
      },
      data
    };
    instanceDefault.request(options)
      .then(function (response) {
        if (response?.data?.balance) {
          resolve(response?.data?.balance);
        } else {
          resolve(0);
        }
      }).catch((e) => {
        resolve(0);
      });
  })
}

const rentPhoneDaisySMS = async (apiKey) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      url: `https://daisysms.com/stubs/handler_api.php?api_key=${apiKey}&action=getNumber&service=mb&max_price=0.15`,
      headers: {
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
    // resolve({ idDaisySMS: "107017642", phoneDaisySMS: "4423203274" });
    instanceDefault.request(options)
      .then(function (response) {
        if (response?.data?.includes("ACCESS_NUMBER")) {
          const textNumbers = response?.data?.split(":");
          resolve({ idDaisySMS: textNumbers?.[1], phoneDaisySMS: textNumbers?.[2]?.substring(1) });
        } else {
          resolve({ idDaisySMS: null, phoneDaisySMS: null });
        }
      }).catch((e) => {
        console.log(e);
        resolve({ idDaisySMS: null, phoneDaisySMS: null });
      });
  })
}

const getCodeDaisySMS = async (apiKey, idDaisySMS) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      url: `https://daisysms.com/stubs/handler_api.php?api_key=${apiKey}&action=getStatus&id=${idDaisySMS}`,
      headers: {
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
    instanceDefault.request(options)
      .then(function (response) {
        if (response?.data) {
          let code = response?.data?.match(/\d+/)?.[0];
          resolve(code);
        } else {
          resolve(false);
        }
      }).catch((e) => {
        resolve(false);
      });
  })
}

const markAsDoneDaisySMS = async (apiKey, idDaisySMS) => {
  return new Promise((resolve) => {
    var options = {
      method: 'GET',
      url: `https://daisysms.com/stubs/handler_api.php?api_key=${apiKey}&action=setStatus&id=${idDaisySMS}&status=6`,
      headers: {
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
    instanceDefault.request(options)
      .then(function (response) {
        resolve(true);
      }).catch((e) => {
        resolve(true);
      });
  })
}

const getCaptchaId = async (apiKey, imageData) => {
  return new Promise((resolve) => {
    let data = new FormData();
    data.append('method', 'base64');
    data.append('key', apiKey);
    data.append('body', imageData);
    data.append('regsense', '1');
    data.append('min_len', '4');

    let options = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://127.0.0.1:6000/in.php',
      headers: {
        ...data.getHeaders()
      },
      data: data
    };
    instanceDefault.request(options)
      .then(function (response) {
        resolve(response.data.split('|')?.[1]);
      }).catch((e) => {
        resolve('');
      });
  })
}

const getCaptchaResult = async (apiKey, imageData) => {
  let idCapt = await getCaptchaId(apiKey, imageData);
  for (let i = 0; i < 10; i++) {
    let options = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `http://127.0.0.1:6000/res.php?key=${apiKey}&action=get&id=${idCapt}`,
      headers: {}
    };
    let res = await instanceDefault.request(options);
    if (res.data.includes('CAPCHA_NOT_READY')) {
      await delay(1000);
    } else if (res.data.includes('ERROR_CAPTCHA_UNSOLVABLE')) {
      return '';
    } else {
      return res.data.split('|')?.[1];
    }
  }
}

const generatePassword = () => {
  return randomize('A', 2) + randomize('0', 2) + randomize('a', 2) + randomize('0', 2) + '@' + randomize('a', 4);
}

const encryptPassword = (password) => {
  const encrypted = CryptoJS.AES.encrypt(password, secretKey).toString();
  return encrypted;
}

const decryptPassword = (encryptedPassword) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  return decrypted;
}

const splitArrayIntoChunks = (array, numChunks) => {
  const chunkSize = Math.floor(array.length / numChunks); // Kích thước mỗi mảng nhỏ
  const remainder = array.length % numChunks;
  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    chunks.push(array.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  if (remainder > 0) {
    chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...array.slice(array.length - remainder)];
  }
  return chunks;
}

const getProcessCaptcha = (proxy, apiKey, imageData) => {
  return new Promise((resolve) => {
    const ua = {
      "httplib": "node-fetch",
      "lang": "node",
      "lang_version": process.version,
      "platform": process.platform,
      "publisher": "nopecha",
    };
    let data = JSON.stringify({
      "key": apiKey,
      "type": "textcaptcha",
      "image_urls": [imageData]
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.nopecha.com/',
      headers: {
        'Content-Type': 'application/json',
        'user_agent': 'NopeCHA NodeBindings',
        'X-NopeCHA-Client-User-Agent': JSON.stringify(ua),
        'Authorization': `Bear ${apiKey}`
      },
      data: data
    };
    if (proxy) {
      config.proxy = proxy;
    }
    axios.request(config)
      .then((response) => {
        if (response?.data?.data) {
          resolve(response?.data?.data);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      });
  })
}

const getCaptchaResultNope = async (proxy, apiKey, imageData) => {
  let idCaptcha = null;
  for (let i = 0; i < 5; i++) {
    if (i % 2 == 0) {
      idCaptcha = await getProcessCaptcha(proxy, apiKey, imageData);
    } else {
      idCaptcha = await getProcessCaptcha(null, apiKey, imageData);
    }
    if (idCaptcha) {
      break;
    }
    await delay(1000);
  }
  console.log("idCaptchaNope..");
  console.log(idCaptcha);
  if (idCaptcha) {
    let onProxy = true;
    for (let i = 0; i < 60; i++) {
      const ua = {
        "httplib": "node-fetch",
        "lang": "node",
        "lang_version": process.version,
        "platform": process.platform,
        "publisher": "nopecha",
      };
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.nopecha.com?key=${apiKey}&id=${idCaptcha}`,
        headers: {
          'Content-Type': 'application/json',
          'user_agent': 'NopeCHA NodeBindings',
          'X-NopeCHA-Client-User-Agent': JSON.stringify(ua),
          'Authorization': `Bear ${apiKey}`
        },
      };
      if (onProxy && proxy) {
        config.proxy = proxy;
      }
      try {
        let res = await axios.request(config);
        if (res?.data?.data) {
          return res?.data?.data?.[0];
        } else {
          onProxy = i % 2 == 0 ? true : false;
        }
      } catch (error) {
        if (error?.response?.status != 409) {
          return null;
        } else {
          onProxy = i % 2 == 0 ? true : false;
        }
      }
      await delay(1000);
    }
  }
  return null;
}

const fetchPiaProxyByThread = (proxy) => {
  return new Promise((resolve) => {
    let port = proxy.split(":")?.[1];
    var options = {
      method: 'GET',
      url: `http://127.0.0.1:42333/api/get_ip_list?num=1&country=US&state=all&city=all&zip=all&isp=all&ip_time=1&t=1&port=${port}`,
      headers: {
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
    instanceDefault.request(options)
      .then(function (response) {
        if (typeof response?.data == 'string' && response?.data?.includes("127.0.0.1")) {
          resolve(true);
        } else {
          resolve(false);
        }
      }).catch((e) => {
        console.log(e);
        resolve(false);
      });
  })
}

// (async () => {
//   const { idDaisySMS, phoneDaisySMS } = await rentPhoneDaisySMS("DG9DHgk0pTh5RJAwh1auz9TR2BjWFv");
//   console.log(idDaisySMS);
//   console.log(phoneDaisySMS);
// })()

module.exports = {
  randomBirthdate,
  randomFirstName,
  randomLastName,
  checkProxyStatus,
  getBalanceDaisySMS,
  getBalance2Captcha,
  rentPhoneDaisySMS,
  getCodeDaisySMS,
  markAsDoneDaisySMS,
  getCaptchaResult,
  getCaptchaResultNope,
  generatePassword,
  encryptPassword,
  decryptPassword,
  delay,
  splitArrayIntoChunks,
  fetchPiaProxyByThread
};