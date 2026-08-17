const axios = require('axios-https-proxy-fix');

const instance = axios.create({
  timeout: 20000,
})

const APPLE_ENDPOINTS = ['appleid', 'tv', 'music'];
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getProxy(proxyString) {
  if (!proxyString) return undefined;
  const proxyArr = String(proxyString).trim().split(":");
  if (!proxyArr[0] || !proxyArr[1]) return undefined;

  return {
    protocol: 'http',
    host: proxyArr[0],
    port: parseInt(proxyArr[1]),
    ...(proxyArr[2] && {
      auth: {
        username: proxyArr[2],
        password: proxyArr[3],
      }
    })
  }
}

function getCookies(setCookie) {
  const cookies = {};
  if (!setCookie) return cookies;

  for (const c of setCookie) {
    const item = c.split(';')[0];
    const index = item.indexOf('=');
    if (index > -1) {
      cookies[item.slice(0, index)] = item.slice(index + 1);
    }
  }
  return cookies;
}

function getCookieString(cookies) {
  return Object.entries(cookies)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function getJsonString(data) {
  if (typeof data == 'string') return data;
  return JSON.stringify(data || {});
}

function getPageUUID(data) {
  if (data?.pageUUID) return data.pageUUID;
  const match = getJsonString(data).match(/pageUUID"\s*:\s*"([^"]+)"/);
  return match ? match[1] : '';
}

function isClearResult(result) {
  return result && (
    result.status == "email_success" ||
    result.status == "email_not_found" ||
    result.status == "failed"
  );
}

function getAppleIdStatus(data) {
  if (data?.used === true) {
    return { status: "email_success", msg: "mail đã liên kết", raw: data };
  }
  if (data?.used === false) {
    return { status: "email_not_found", msg: "mail này chưa được tạo", raw: data };
  }

  const jsonString = getJsonString(data);
  if (jsonString.includes('"used" : true') || jsonString.includes('"used":true')) {
    return { status: "email_success", msg: "mail đã liên kết", raw: data };
  }
  if (jsonString.includes('"used" : false') || jsonString.includes('"used":false')) {
    return { status: "email_not_found", msg: "mail này chưa được tạo", raw: data };
  }

  return { status: "email_error", msg: "Apple ID response không rõ", raw: data };
}

function getAppleMediaStatus(data) {
  if (data?.accountNameAvailable === true && data?.email === true) {
    return { status: "email_not_found", msg: "mail này chưa được tạo", raw: data };
  }
  if (data?.accountNameAvailable === false && data?.email === true) {
    return { status: "email_success", msg: "mail đã liên kết", raw: data };
  }
  if (data?.accountNameAvailable === true && data?.email === false) {
    return { status: "failed", msg: "mail không hợp lệ", raw: data };
  }

  const jsonString = getJsonString(data);
  if (jsonString.includes('accountNameAvailable":true') && jsonString.includes('email":true')) {
    return { status: "email_not_found", msg: "mail này chưa được tạo", raw: data };
  }
  if (jsonString.includes('accountNameAvailable":false') && jsonString.includes('email":true')) {
    return { status: "email_success", msg: "mail đã liên kết", raw: data };
  }
  if (jsonString.includes('accountNameAvailable":true') && jsonString.includes('email":false')) {
    return { status: "failed", msg: "mail không hợp lệ", raw: data };
  }

  return { status: "email_error", msg: "Apple media response không rõ", raw: data };
}

async function checkAppleId(email, proxy, ua) {
  const session = await instance.get('https://account.apple.com/account', {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Pragma': 'no-cache',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Connection': 'keep-alive',
      'Dnt': '1',
      'Host': 'appleid.apple.com',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': ua
    },
    maxRedirects: 8,
    proxy
  });

  if (!String(session.status).includes("200")) {
    return { status: "email_error", msg: "GET Apple ID failed", raw: session.data };
  }

  const cookies = getCookies(session.headers['set-cookie']);
  const scnt = session.headers['scnt'] || '';
  const response = await instance.post('https://appleid.apple.com/account/validation/appleid', {
    emailAddress: email
  }, {
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Pragma': 'no-cache',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Connection': 'close',
      'Host': 'appleid.apple.com',
      'Origin': 'https://appleid.apple.com',
      'Referer': 'https://appleid.apple.com/',
      'Scnt': scnt,
      'User-Agent': ua,
      'X-Apple-Request-Context': 'create',
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      'Cookie': getCookieString({
        idclient: 'web',
        dslang: 'GB-EN',
        site: 'GBR',
        myacinfo: '',
        awat: '',
        aidsp: cookies.aidsp
      })
    },
    maxRedirects: 8,
    validateStatus: () => true,
    proxy
  });

  const result = getAppleIdStatus(response.data);
  return { ...result, endpoint: "appleid" };
}

async function checkAppleMedia(email, proxy, ua, type) {
  const baseUrl = `https://auth.${type}.apple.com`;
  const referer = `https://${type}.apple.com/`;
  const initResponse = await instance.get(`${baseUrl}/auth/v1/liteReplayProtection/initializeSession`, {
    headers: {
      'User-Agent': ua,
      'Accept': '*/*',
      'Pragma': 'no-cache',
      'Accept-Language': 'en-us',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': referer,
      'content-type': 'application/json',
      'x-apple-store-front': '143441-1,8',
      'Origin': `https://${type}.apple.com`,
      'Connection': 'keep-alive',
      'Cookie': 'geo=US; dslang=US-EN; site=USA',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site'
    },
    maxRedirects: 8,
    proxy
  });

  if (!String(initResponse.status).includes("200")) {
    return { status: "email_error", msg: `GET Apple ${type} failed`, raw: initResponse.data };
  }

  const cookies = getCookies(initResponse.headers['set-cookie']);
  const pageUUID = getPageUUID(initResponse.data);
  const response = await instance.post(`${baseUrl}/auth/v1/web/accountName/validate`, {
    accountName: email
  }, {
    headers: {
      'User-Agent': ua,
      'Accept': '*/*',
      'Pragma': 'no-cache',
      'Accept-Language': 'en-us',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': referer,
      'content-type': 'application/json',
      'x-apple-page-uuid': pageUUID,
      'x-apple-store-front': '143441-1,8',
      'Origin': `https://${type}.apple.com`,
      'Connection': 'close',
      'Cookie': getCookieString({
        geo: 'US',
        dslang: 'US-EN',
        site: 'USA',
        'wosid-replay': cookies['wosid-replay']
      }),
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site'
    },
    maxRedirects: 8,
    validateStatus: () => true,
    proxy
  });

  const result = getAppleMediaStatus(response.data);
  return { ...result, endpoint: type };
}

async function checkEmail(email, proxyString) {
  if (!/^\w+([-+._]\w+)*@\w+([-._]\w+)*\.\w+([-._]\w+)*$/.test(email)) {
    return { status: "failed", msg: "mail không hợp lệ", raw: null };
  }

  const proxy = getProxy(proxyString);
  const ua = getRandomUserAgent();
  let lastResult = null;

  for (const endpoint of APPLE_ENDPOINTS) {
    try {
      if (endpoint == "appleid") {
        lastResult = await checkAppleId(email, proxy, ua);
      } else {
        lastResult = await checkAppleMedia(email, proxy, ua, endpoint);
      }

      if (isClearResult(lastResult)) {
        return lastResult;
      }
    } catch (error) {
      lastResult = {
        status: "email_error",
        msg: error?.response?.data?.message || error.message,
        raw: error?.response?.data || null,
        endpoint
      };
    }
  }

  return lastResult || { status: "email_error", msg: "Không kiểm tra được mail", raw: null };
}

async function checkEmailWithRetry(email, listProxy) {
  let retry = 0;
  let proxies = Array.isArray(listProxy)
    ? listProxy.filter(proxy => proxy && String(proxy).trim())
    : [];

  if (!proxies.length) {
    proxies = [null];
  }

  while (retry < 5) {
    try {
      const proxyString = proxies[retry % proxies.length];
      const result = await checkEmail(email, proxyString);
      if (isClearResult(result)) {
        return { status: result.status, email };
      }
    } catch (error) {
      // Try the next proxy, same style as action.js.
    }
    retry++;
  }

  return { status: 'unchecked', email };
}

module.exports = {
  checkEmail,
  checkEmailWithRetry,
  checkAppleId,
  checkAppleMedia
}
