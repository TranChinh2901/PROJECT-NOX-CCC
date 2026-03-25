import axios from 'axios';
import crypto from 'crypto';
import { loadedEnv } from '@/config/load-env';

const mask = (value?: string) => {
  if (!value) return '(empty)';
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
};

async function main() {
  const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl } = loadedEnv.momo;

  if (!partnerCode || !accessKey || !secretKey || !endpoint || !redirectUrl || !ipnUrl) {
    console.error('MoMo env is incomplete. Please check MOMO_* variables in .env');
    process.exit(1);
  }

  const requestId = `MOMO_KEY_CHECK_${Date.now()}`;
  const orderId = `MOMO_KEY_CHECK_${Date.now()}`;
  const orderInfo = 'Key check - safe sandbox request';
  const amount = 1000;
  const requestType = 'payWithMethod';
  const extraData = '';

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join('&');

  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const payload = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    lang: 'vi',
    signature,
  };

  console.log('MoMo config summary:');
  console.log(`- partnerCode: ${partnerCode}`);
  console.log(`- accessKey:   ${mask(accessKey)}`);
  console.log(`- secretKey:   ${mask(secretKey)}`);
  console.log(`- endpoint:    ${endpoint}`);
  console.log(`- requestType: ${requestType}`);

  try {
    const { data } = await axios.post(`${endpoint.replace(/\/$/, '')}/create`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    console.log('\nMoMo /create response:');
    console.log(JSON.stringify(data, null, 2));

    if (Number(data?.resultCode) === 0) {
      console.log('\nResult: KEY/CONFIG LOOKS VALID (create payment succeeded).');
      process.exit(0);
    }

    console.error('\nResult: KEY/CONFIG OR ACCOUNT PERMISSION ISSUE.');
    process.exit(1);
  } catch (error: any) {
    console.error('\nNetwork or MoMo request failed:');
    console.error(error?.response?.data || error?.message || error);
    process.exit(1);
  }
}

void main();
