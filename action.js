const axios = require('axios-https-proxy-fix');
const querystring = require('querystring');

const instance = axios.create({
  timeout: 30000
})

function generateDeviceId() {
  return String(Math.floor(Math.random() * 1e19)).padStart(19, '0');
}

function generateVerifyFp() {
  const prefix = 'verify_' + Math.random().toString(36).substring(2, 10);
  const suffix = Math.random().toString(36).substring(2, 10) + '_' + Math.random().toString(36).substring(2, 6);
  return `${prefix}_${suffix}`;
}

async function getTikTokSession(proxy) {
  try {
    const response = await instance.get('https://www.tiktok.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'
      },
      proxy
    });
    let cookieString = '';
    if (response.headers['set-cookie']) {
      cookieString = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
    }
    const html = response.data;
    let csrfToken = '';
    const csrfMatch = html.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/i);
    if (csrfMatch) csrfToken = csrfMatch[1];
    if (!csrfToken) {
      const m2 = html.match(/csrf_token\s*:\s*"([^"]+)"/i);
      if (m2) csrfToken = m2[1];
    }
    if (!csrfToken) csrfToken = 'Q92A70am-1yslpgTnDXUPELqHaZmZQbJbPAw'; // fallback
    return { cookieString, csrfToken };
  } catch (err) {
    console.warn('Không lấy được session, dùng cookie mặc định');
    return {
      cookieString: 'tt_csrf_token=Q92A70am-1yslpgTnDXUPELqHaZmZQbJbPAw; ttwid=1%7CP1jhWxMT_xBD4-q8HzVvReejsmq2csS3CsvSxVBBW2g%7C1786382334%7C2c9b42e48642abe1952417d8f0cc3b29fb2d18cdf7304f88914e00314d8dc0d6; odin_tt=4f8f4e8101a0c498eed0e6c9ea90baf7c499bcabaa20d9d28d950822eb978bea',
      csrfToken: 'Q92A70am-1yslpgTnDXUPELqHaZmZQbJbPAw'
    };
  }
}

async function checkEmail(email, proxyString) {
  const deviceId = generateDeviceId();
  const verifyFp = generateVerifyFp();
  const proxyArr = proxyString.split(":");
  const proxy = {
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
  const { cookieString, csrfToken } = await getTikTokSession(proxy);
  const queryParams = {
    multi_login: '1',
    did: deviceId,
    locale: 'vi-VN',
    app_language: 'vi',
    aid: '1459',
    account_sdk_source: 'web',
    sdk_version: '"1.0.16-alpha.2"',
    language: 'vi',
    unified_sdk: '1',
    verifyFp: verifyFp,
    target_aid: '',
    standalone_aid: '',
    shark_extra: JSON.stringify({
      aid: 1459,
      app_name: 'Tik_Tok_Login',
      channel: 'tiktok_web',
      device_platform: 'web_pc',
      device_id: deviceId,
      region: 'VN',
      priority_region: '',
      os: 'windows',
      referer: 'https://www.tiktok.com/',
      root_referer: 'https://www.tiktok.com/',
      cookie_enabled: true,
      screen_width: 2752,
      screen_height: 1152,
      browser_language: 'vi-VN',
      browser_platform: 'Win32',
      browser_name: 'Mozilla',
      browser_version: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
      browser_online: true,
      verifyFp: verifyFp,
      app_language: 'vi-VN',
      webcast_language: 'vi-VN',
      tz_name: 'Asia/Bangkok',
      is_page_visible: true,
      focus_state: true,
      is_fullscreen: false,
      history_len: 2,
      user_is_login: false,
      data_collection_enabled: false
    }),
    'X-Dynosaur': 'Mcn-lCPztv3-lORlloHA8com9FJTDN9op6eIqNHcdNQky0G4UUhcPgN1cdTVYNTT7bcfcDq8iVMdIrKcYAbNFv3e5H90QZs5gYDapElP/WGRBnxbGoemcXTkyC5ThriWJt0ffw7WCPH3/w39OD9CzJ8AG4OFfDpb0Bq9uwURFK7KkhpJVgUq5C4LB1INmggvcJ8K-KrzD0M1AuM6tISCd6LBx7Nc8au0/eaX1P4qIrmXT-/IkUjdrPJ9l--eUSPfhV4snbE9sDa-PrldkgDLJcCJ/ZDSzgYlU5CPoCu-ZDkvmEfDWDhgKjcMvS5ETVVV-DmYfoCMtL3AGnTvPVdZtV3u5rpuJfUhfxsl3ijF3Dqvj2BPh6WRrd5zQYfscon--qZJRqDCmY-usFkMb8q-/KzVUVEOMxGOvMBx61rdf05fNouZ7opGnqCa-wR=',
    msToken: 'iXYKi202Z3fd_IvBrvBTMNwbFVA9eZKYFEk7XjyXLBGXgiVfRwAn8I4cpc8yg9LUoUgL9qNwafzIQLWFxDHhGYd8zU8Im3Z5G-hrazhvKUaf6v5Io4Ye9WsVPRsfcVmNikPNwUP-n6o-mRkZMbMZtgw=',
    'X-Bogus': '1',
    'X-Gnarly': 'Mcg4Nlbx9Yl0xdY1q6O-TVSqAHWaCSLzLZevM/eii8a-AcJfAVXzmkxeNoaaQT3u0FEVhqVoNsDMX7Pur5F2dbptcqOzjPGhrGm7PLmct-BC8Pcbdao48LhFumJKUl7LRu9V2/mF7I/p/jeRdMYlE9kTmxT4cFsQF6PZI7aoLbDXgq7ajHMpkGXEv00wTyhe7Uw0NwfHOvx0dvlJ-qqtN4nyjrsmjic0jlOAtCnUBj8Oosu1z95ExQIEfFWVOPlH4u2l2MdEfaUbIRimBHes2BLMGsLftwF/W3VkRPTfAq4rHopuHLfDB-hxYx4NtNQvUP5BYig0PPQB'
  };
  const body = {
    mix_mode: '1',
    email: email,
    password: '',
    type: '34',
    aid: '1459',
    is_sso: 'false',
    account_sdk_source: 'web',
    region: 'VN',
    language: 'vi',
    locale: 'vi-VN',
    did: deviceId,
    email_logic_type: '2',
    fixed_mix_mode: '1'
  };
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript',
    'Accept-Language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': 'https://www.tiktok.com',
    'Referer': 'https://www.tiktok.com/',
    'Cookie': cookieString,
    'x-tt-passport-csrf-token': csrfToken,
    'tt-ticket-guard-iteration-version': '0',
    'tt-ticket-guard-public-key': 'BMncUm5rAFivcOA2lXx1fRXJrzWUzNp4NuEWIcULiA67S2qLQ8HCaeBPzvM2BEQmkMrBoFt2ZZbVZxbSBtI4+8Q=',
    'tt-ticket-guard-version': '2',
    'tt-ticket-guard-web-version': '1',
    'x-mssdk-info': 'yUMreA3uYpxhmQ91HyuSJzBtM72pep9W6KUrT47cr-TIUsouHusI5dU7wPq7ACLmoJD9S4a.5gFTRmgwTRK4PNn2In8lJNXu4ueiPFCBaHWfn106aEmyGQRXiBqs8MBzn0akKDH2IkbWmrtwYf7iMq1lLpr65MMO5swiAIH6zV4UEHbkLG2HOl-NnvKooReC8lbrTw3m3lgfDKJEAvrITdCkdUbrMjRIfMKcirSc5fc2-0Dz25NiSVNxqQmWsTO46AgUE931HtvxY9oxl5e3jp6bor9-WZoY3muFnVob6XcuEnJHsV2gTdk4e8FYzKgB-0bKythITYMuZmwnWquCJOZZW9jg9ZqMdF5Fnh0cIk7o0ducwQUO8hIVJ57JhuQSa.E6.khL1px2T6vjHii1pLtai7JKiCz4PWt6TBfQ7TtZXNqH-UwDjeIqHro0ft9zQF.lhyVkTNwSpK.hAfCm3NjC1RUyNQ8RQDwWGdscu560uCZra9e2-T7pqxGWf0t6vgL.OvsJygubMdpPYhxAsMAMS5.xbUUhCnxAEQMueCA0.dAuqOwYa28i3DxY21btKX3CXViuoWVTuBSM.5nkCsbEAL01gu5cNEeDDhedrb.Yb3r62l9.NeIK5h993wjofA6FTTqnSB5pa1-FhRNMRqVToGkH975btXvi1uhidT8XyYhByA5MAIUY7D5TDr56wycxtS52IwGaStrDXQ0Wxi2V6EtEHmLqGHD1UXaXCUwOTgEkHTQGLO.DRUj7H.rsyWEJjfwMca6TAJr2wW2nodOzpqcpL4wLlJOdEiVznEhVMAy6vk4Ql-At5F.gEOx8lzcp0-h3dnrEGHqxAyuuZNYkepIhSaZNGF.eu9peRuqNKIb72HS9INstSWtHE50eypM33fjiYicvMe4dv7hZ6nZyhHpAryRKhFdptdqFr0ydGp.p4.gmgBjorgwxoJRafXfxIffa3CkT5EO7SH9IiPPdJ90Op6WJfNc.8r0t4GkKLtxl1MuY-lOQtA5VzO8WNHLep2n1-goAhQqO84pOJ6BtBU5Pum8UQDUyf1K13iRMwdgHTb.W.iyMAgn0JjYYEIxuVPU.aVovtMZnqDyI2NWVp0b.d5xWle9TtpvtdWuWR64Tpozo-gSVCkk7yijqpOcq5FmUgLB5i.Uut19JRn1W5JdRvx-AnN0GuaJSTOKBewpj9dEKQvAqQF59p27rZRYGLOILaSWhplUj-8vBNdKuTDxK625x9dRIeXjMZv2my.1Lwj67-h69Q6r84DJRA1mrQEoT8Gr51SlGovSKTS8Yxr-5N.0SSViZi1UCnMAfU0oNoN1a20IRjIwOoFmLYi7gACTi0wjeSNDP0wj21a-thy9SYytCGzi1v3VshNpYF9CtHr1XPzn8N4RRyCdG8vFDilGuT4CpTgIY3HxSpV10Zb6NdtNicEU3T-HS4taU29zu0kg0KEZkISXZ6iNPIyWCchdSbQ3XFGO7ETcs4Zxu0virzQSjzzFzNogGBwdaZXwV2cuaYf27HhuLNUBJZE45gyQhYfYAIk5lBADqdUdUIaz34t.b07l6mui9vbvKVAZrl0dDrjkcvetKBIP3hvAtNacoCElLXTV.7omOW49BqQw4XISZWERJuIWGKRCZHoL4RIJ2MmBpKIGsKYBSpcGeyyTLbQ41CNqNsKdNjmgO-9zwLOXOXglWH2XW9lr4N5oRN19Xn.hNT7Mm7cvmJ6P5VE0ATYshsVLA1sKNaHMNK9Vl55DLDMJ.T5auZuHWTrX9TterBH-y6de1USVjMybum-vqZR.MME0EOL9MAm6O.VEO6doughuO4TxhH1Rl97ls8bwI504yNRE1SGoFL5-m6XXGUVs61uJlMO7vE.jNX5AJitYQ6Ur80qFCbWqMV2iEkaVTO6w2M7caM93vvyeyUYqmATPFApcDPUFAdZeRBYN8swd4dh5kHqu7OVHHgrZSRvTRNRqXefqPU2CLAcQf.kXvDdWiekwDM-J1hAY6jdXobpxCLUBTkng2Vs0yhTZ2GB-c91xD9nhqyYM3XegZfN932CIdxJa5Khf3XO-SOjMXOTptzaQD2tMdl-gyvgJWdVV7WktIsatpZqlFiqZkXPvz9N5WsoPmnSUp2nciNsinsLCHrbTrtANM2uchdISHFWghTRYcPu9kyWixkS53yldPXbVO025gMsbLHaTyr8DnKIWby0WQ-k1QXeY45CYFDmCGA9MZCt-bWvPZvQqeSr7WrJh2TdqhItpXSP-2bzrxYzQFnaUagJmI771dEmrfN46KUDi26rNj0CvuZVSBaa8AGIT1aB4gQmZoad8EFYqGNE2mOU36BEyG5mrzRVOXM0Jof7DsGG6SK.sr5nCGIhrJbf18fqL9E22gUgfFBNdUbN3zyAQUwMsGMZloK6tTlNwM5KD6QnZmf5BccMMQkZ.IkNO66nsIR86Td1tBO05J7mtC2R6HesXEePL1qlYGqEfD9tmnS24W06tpHywCnevD-tfaBHIGFGzmh1Lr5fi7BxSmIOYS-DdBLX7Y0z.FaYQd2Bo-A8ZDw0LcvaamyMVEDJb9qKawrgjbqHOVK-7RlLtW8eY4kMfoa9d32Ch8smR3lYgU.1kBpU2qqRyjOEQIYJZnprpNoO-GjV8s7LFj7ZeFV3nyi3kv6x2Zzz-p4iTVx9Bww8jqYFi-0SoC14MZBawYaTiYMr72kwhvz03CWJZ3.uX9eFSdo4lO02QN4qiIWVWaAz1x2As92tXhkGKauENZRkzIuWo1VkHOFPtrDquPR2CUvk8PtpP7ASzEvnPoLA17S2hEeE9tyCKQujf0kLhvY8w6GEr6FUev5SZD0rIxIfNNXY81G8ipPLMxZqMnPsIBZWOPsRPBuzh8-jowNrAUq3T72seZiH-bOGlYVZWUFZhdjhR.lt8.E4NM83D.m9TTiI41GMcusuzNSCj0FO1QyYHgQAxwgK.c0-LVY8aYUVt9xJ9UpHNLzMHNdS.dtaUb7NjGb6h1-LSTeQO48A3uPrrNveq7ednkomU2.-MvHhq4N37JO5t1.6IoQwO35hnElN.cAuk.-8mSKzebCR0QXHpMDiV.q5aObuj4eP4QCq66p70cm2CtLyIuK4kh7qg0vjlHgyJlFsrYniAxtfQGNKH0XY3c9pm-CaBI7sOTp00HEtUBseq9uc5iFcotkvD.wK7-IaDK0N-jTy3Rscx2tnP558Z.CzKto71qqZOFJfYU45L-i7vSuXxj-TUOuPaD.WL07hCszpdGAvG2qAxNZ9Xg0yaTJy5jaoKo-01FcpjMU8atYJnBTiUEj7MShVPS0G-efX2fNEOan2uonHOiRYZgQmuRWLp-VNDu4H5L0J7DmOw.roXOzwwnlPEmztmnP57lUrRy1uIpmcCKi9Fn-ffHc.ByiQreyWqGsMDlQVAFcv-3IXqUde5rG2muLHFdsNuJhr3klZsjCG2Ilv2lH0Hw-JNFbmh8X7b01OEXo7g9yQzmvIG8Il9Q5ZzMAtt-emTG3i19Yw6dAAC2Vh3AjqlmSNiD5g4liw-rgyKaSClzmkqjCDIXwHhbge6qoJC8Vsl07zzBkpEzu.W7XseUGMX-lyWuCPmF.sXsPze1yoEjIjVsJvknabGZ03CI7V6JdZVWFZP1b22sgjqKv4ff4sPmT.wu59CzTx5w8X-inkpplznBnP7UanjTWEfxPlM5mCDsPg3qkpAp2HGOwzpPLLwDsSSslQkPcw4yjoCgE8EmQMXtTwKQQyRH3CCps8s1nsqOeCXCM4mXgrVM3zNDZPd8QO2J',
    'x-tt-passport-ttwid-ticket': 'AdZ7MCuwCSxF9J6INMhi_UZbPEgpctWY0Nx6jYZnH-nqE5Ou5W6TUWX4Bc9wYhVxtw==',
    'sec-ch-ua': '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site'
  };

  try {
    const response = await instance.post('https://web-sg.tiktok.com/passport/web/email/send_code/', querystring.stringify(body), {
      params: queryParams,
      headers: headers,
      timeout: 15000,
      maxBodyLength: Infinity,
      proxy
    });
    const data = response.data;
    const message = data.message ?? "";
    const description = data.data.description ?? "";
    const error_code = data.data.error_code ?? "";
    if (message == "success") {
      return { status: "email_not_found", msg: "mail này chưa được tạo", raw: data };
    } else if (message == "error" && error_code == 1023) {
      return { status: "email_success", msg: "mail đã liên kết", raw: data };
    } else {
      return { status: 'email_error', msg: description, raw: data };
    }
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      console.log('Lỗi phản hồi:', JSON.stringify(data, null, 2));
      const code = data.code || data.status_code;
      const msg = data.msg || data.message || data.status_msg || '';
      if (code === 10001 || code === 10002 || msg.includes('not found')) {
        return { status: 'failed', code, msg: 'Mail này chưa đăng ký', raw: data };
      }
      throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(data)}`);
    } else {
      throw error;
    }
  }
}

async function checkEmailWithRetry(email, listProxy) {
  let retry = 0;
  while (retry < 5) {
    try {
      const proxyString = listProxy[retry];
      const result = await checkEmail(email, proxyString);
      if (result.status == "email_success" || result.status == "email_not_found"
        || result.status == "failed") {
        return { status: result.status, email };
      }
    } catch (error) {
      retry++;
    }
  }
  return { status: 'unchecked', email };
}

module.exports = {
  checkEmailWithRetry
}