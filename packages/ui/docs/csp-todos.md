[StreamInvalidator] post:51c11e3b-f063-4889-9bf7-cc53dfb22728:create
publishHandlers.ts:253 Connecting to 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAAAYwGNhQlgAABjAanVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAGJpqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOjIzMTBhYTYyLTUwZWYtOGYwMS04ZmQyLTQzY2M2MzYzZTNhMgAAABMDanVtYgAAAChqdW1kYzJjcwARABCAAACqADibcQNjMnBhLnNpZ25hdHVyZQAAABLTY2JvctKEWQYrogEmGCGCWQM/MIIDOzCCAsCgAwIBAgIUAJ6vFWKBqUkCFltI/1ipbSSYHs4wCgYIKoZIzj0EAwMwUTELMAkGA1UEBhMCVVMxEzARBgNVBAoMCkdvb2dsZSBMTEMxLTArBgNVBAMMJEdvb2dsZSBDMlBBIE1lZGlhIFNlcnZpY2VzIDFQIElDQSBHMzAeFw0yNjAyM...je5wH8nu0Yi0QwnmWIa3LOpWATXOx+jGdNe87Krvks/TO3vfAzg2YRRgpTHdlcHldFoNPRFkXalOM0Pu96rsvOdHc/xcoHzhnk1hD3hgkM/g5+7MhD18P1jJ7l0CiJ7oGBufzL2ESNZ1T/OzcxlQ0XIDxZIZ9xMsZ+lz2hxW9+eA7D6F2OKfJD2fvdZjGIuBHybCN7PD9j5kdZD1DRYRMDII3VudeLNt/vbfX3/CmGSYF5tl4bXY//uaQBjWH2/jvg7rz1VjKsDacWv7/ZOxREJbbn7qXP19Xf1iv1ivYQ2teLTSh9+K+762btI3Owc8c/826vRZf2WQSL2L0X2KhsGIlwDQrpus33b8VEAltvQLXJBsQM1P1ZNgIJUSZFzgKZI3TJmld92m0/Xl00cflsxmU4QsbyA83mA+C7ON59/fDp7X0C+N+g/TeK/+c///nPP+vv//3P79f//M///PvN//7v//77zf8BwMrEn3UCvAUAAAAASUVORK5CYII=' violates the following Content Security Policy directive: "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://assets.polymech.info https://*.polymech.info https://service.polymech.info wss://service.polymech.info https://cdn.jsdelivr.net https://api.openai.com https://www.googletagmanager.com https://*.google-analytics.com https://www.google-analytics.com https://*.googleapis.com https://*.gstatic.com". The action has been blocked.
B @ publishHandlers.ts:253
await in B
Aa @ ImageWizard.tsx:1175
(anonymous) @ index.mjs:4
Oe @ react-dom.production.min.js:54
Ue @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
zr @ react-dom.production.min.js:105
Fr @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
dc @ react-dom.production.min.js:273
Pe @ react-dom.production.min.js:52
$r @ react-dom.production.min.js:109
Kt @ react-dom.production.min.js:74
Gt @ react-dom.production.min.js:73Understand this error
publishHandlers.ts:253 Fetch API cannot load data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAAAYwGNhQlgAABjAanVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAGJpqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOjIzMTBhYTYyLTUwZWYtOGYwMS04ZmQyLTQzY2M2MzYzZTNhMgAAABMDanVtYgAAAChqdW1kYzJjcwARABCAAACqADibcQNjMnBhLnNpZ25hdHVyZQAAABLTY2JvctKEWQYrogEmGCGCWQM/MIIDOzCCAsCgAwIBAgIUAJ6vFWKBqUkCFltI/1ipbSSYHs4wCgYIKoZIzj0EAwMwUTELMAkGA1UEBhMCVVMxEzARBgNVBAoMCkdvb2dsZSBMTEMxLTArBgNVBAMMJEdvb2dsZSBDMlBBIE1lZGlhIFNlcnZpY2VzIDFQIElDQSBHMzAeFw0yNjAyM...je5wH8nu0Yi0QwnmWIa3LOpWATXOx+jGdNe87Krvks/TO3vfAzg2YRRgpTHdlcHldFoNPRFkXalOM0Pu96rsvOdHc/xcoHzhnk1hD3hgkM/g5+7MhD18P1jJ7l0CiJ7oGBufzL2ESNZ1T/OzcxlQ0XIDxZIZ9xMsZ+lz2hxW9+eA7D6F2OKfJD2fvdZjGIuBHybCN7PD9j5kdZD1DRYRMDII3VudeLNt/vbfX3/CmGSYF5tl4bXY//uaQBjWH2/jvg7rz1VjKsDacWv7/ZOxREJbbn7qXP19Xf1iv1ivYQ2teLTSh9+K+762btI3Owc8c/826vRZf2WQSL2L0X2KhsGIlwDQrpus33b8VEAltvQLXJBsQM1P1ZNgIJUSZFzgKZI3TJmld92m0/Xl00cflsxmU4QsbyA83mA+C7ON59/fDp7X0C+N+g/TeK/+c///nPP+vv//3P79f//M///PvN//7v//77zf8BwMrEn3UCvAUAAAAASUVORK5CYII=. Refused to connect because it violates the document's Content Security Policy.
B @ publishHandlers.ts:253
await in B
Aa @ ImageWizard.tsx:1175
(anonymous) @ index.mjs:4
Oe @ react-dom.production.min.js:54
Ue @ react-dom.production.min.js:54
(anonymous) @ react-dom.production.min.js:55
zr @ react-dom.production.min.js:105
Fr @ react-dom.production.min.js:106
(anonymous) @ react-dom.production.min.js:117
dc @ react-dom.production.min.js:273
Pe @ react-dom.production.min.js:52
$r @ react-dom.production.min.js:109
Kt @ react-dom.production.min.js:74
Gt @ react-dom.production.min.js:73Understand this error
publishHandlers.ts:276 Error quick publishing image: TypeError: Failed to fetch. Refused to connect because it violates the document's Content Security Policy.
    at B (publishHandlers.ts:253:30)