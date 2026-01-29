import { Trend } from 'k6/metrics';

export const loginTime = new Trend('login_time');
export const checkoutTime = new Trend('checkout_time');
