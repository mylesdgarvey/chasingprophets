// Polyfills needed by amazon-cognito-identity-js
import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
window.process = {
    env: { NODE_ENV: import.meta.env.MODE }
} as any;