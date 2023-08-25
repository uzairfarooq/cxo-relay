/* eslint-disable @typescript-eslint/no-var-requires */
import https from 'https';

// Since we are sharing code between electron (browser)
// and node, we need to check if we have fetch defined.
// let fetch = globalThis?.fetch;
// if (typeof fetch == 'undefined') {
//   // We are in a fetch-less environment, use node-fetch
//   const nodeFetch = require('node-fetch');
//   fetch = nodeFetch as typeof fetch;
// }

const httpsAgent = new https.Agent({
  keepAlive: true,
});

function fetchData(url: string) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { agent: httpsAgent, rejectUnauthorized: false }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

// Depending on this the module exports either the browser's fetch or node-fetch.
export default fetchData;
