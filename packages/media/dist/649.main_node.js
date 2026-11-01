#!/usr/bin/env node
exports.id = 649;
exports.ids = [649];
exports.modules = {

/***/ 119:
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('{"name":"replicate","version":"1.0.1","description":"JavaScript client for Replicate","repository":"github:replicate/replicate-javascript","homepage":"https://github.com/replicate/replicate-javascript#readme","bugs":"https://github.com/replicate/replicate-javascript/issues","license":"Apache-2.0","main":"index.js","type":"commonjs","types":"index.d.ts","files":["CONTRIBUTING.md","LICENSE","README.md","index.d.ts","index.js","lib/**/*.js","vendor/**/*","package.json"],"engines":{"node":">=18.0.0","npm":">=7.19.0","git":">=2.11.0","yarn":">=1.7.0"},"scripts":{"check":"tsc","format":"biome format . --write","lint-biome":"biome lint .","lint-publint":"publint","lint":"npm run lint-biome && npm run lint-publint","test":"jest"},"optionalDependencies":{"readable-stream":">=4.0.0"},"devDependencies":{"@biomejs/biome":"^1.4.1","@types/jest":"^29.5.3","@typescript-eslint/eslint-plugin":"^5.56.0","cross-fetch":"^3.1.5","jest":"^29.7.0","nock":"^14.0.0-beta.6","publint":"^0.2.7","ts-jest":"^29.1.0","typescript":"^5.0.2"}}');

/***/ }),

/***/ 320:
/***/ ((module) => {

/**
 * Fetch a model collection
 *
 * @param {string} collection_slug - Required. The slug of the collection. See http://replicate.com/collections
 * @returns {Promise<object>} - Resolves with the collection data
 */
async function getCollection(collection_slug) {
  const response = await this.request(`/collections/${collection_slug}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Fetch a list of model collections
 *
 * @returns {Promise<object>} - Resolves with the collections data
 */
async function listCollections() {
  const response = await this.request("/collections", {
    method: "GET",
  });

  return response.json();
}

module.exports = { get: getCollection, list: listCollections };


/***/ }),

/***/ 1033:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { transformFileInputs } = __webpack_require__(2782);

/**
 * Create a new prediction with a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object} options
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @param {boolean|integer} [options.wait] - Whether to wait until the prediction is completed before returning. If an integer is provided, it will wait for that many seconds. Defaults to false
 * @returns {Promise<object>} Resolves with the created prediction data
 */
async function createPrediction(deployment_owner, deployment_name, options) {
  const { input, wait, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const headers = {};
  if (wait) {
    if (typeof wait === "number") {
      const n = Math.max(1, Math.ceil(Number(wait)) || 1);
      headers["Prefer"] = `wait=${n}`;
    } else {
      headers["Prefer"] = "wait";
    }
  }

  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}/predictions`,
    {
      method: "POST",
      headers,
      data: {
        ...data,
        input: await transformFileInputs(
          this,
          input,
          this.fileEncodingStrategy
        ),
      },
    }
  );

  return response.json();
}

/**
 * Get a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function getDeployment(deployment_owner, deployment_name) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "GET",
    }
  );

  return response.json();
}

/**
 * @typedef {Object} DeploymentCreateRequest - Request body for `deployments.create`
 * @property {string} name - the name of the deployment
 * @property {string} model - the full name of the model that you want to deploy e.g. stability-ai/sdxl
 * @property {string} version - the 64-character string ID of the model version that you want to deploy
 * @property {string} hardware - the SKU for the hardware used to run the model, via `replicate.hardware.list()`
 * @property {number} min_instances - the minimum number of instances for scaling
 * @property {number} max_instances - the maximum number of instances for scaling
 */

/**
 * Create a deployment
 *
 * @param {DeploymentCreateRequest} config - Required. The deployment config.
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function createDeployment(deployment_config) {
  const response = await this.request("/deployments", {
    method: "POST",
    data: deployment_config,
  });

  return response.json();
}

/**
 * @typedef {Object} DeploymentUpdateRequest - Request body for `deployments.update`
 * @property {string} version - the 64-character string ID of the model version that you want to deploy
 * @property {string} hardware - the SKU for the hardware used to run the model, via `replicate.hardware.list()`
 * @property {number} min_instances - the minimum number of instances for scaling
 * @property {number} max_instances - the maximum number of instances for scaling
 */

/**
 * Update an existing deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {DeploymentUpdateRequest} deployment_config - Required. The deployment changes.
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function updateDeployment(
  deployment_owner,
  deployment_name,
  deployment_config
) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "PATCH",
      data: deployment_config,
    }
  );

  return response.json();
}

/**
 * Delete a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @returns {Promise<boolean>} Resolves with true if the deployment was deleted
 */
async function deleteDeployment(deployment_owner, deployment_name) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "DELETE",
    }
  );

  return response.status === 204;
}

/**
 * List all deployments
 *
 * @returns {Promise<object>} - Resolves with a page of deployments
 */
async function listDeployments() {
  const response = await this.request("/deployments", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  predictions: {
    create: createPrediction,
  },
  get: getDeployment,
  create: createDeployment,
  update: updateDeployment,
  list: listDeployments,
  delete: deleteDeployment,
};


/***/ }),

/***/ 1415:
/***/ ((module) => {

/**
 * Get the default webhook signing secret
 *
 * @returns {Promise<object>} Resolves with the signing secret for the default webhook
 */
async function getDefaultWebhookSecret() {
  const response = await this.request("/webhooks/default/secret", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  default: {
    secret: {
      get: getDefaultWebhookSecret,
    },
  },
};


/***/ }),

/***/ 1731:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { transformFileInputs } = __webpack_require__(2782);

/**
 * Create a new prediction
 *
 * @param {object} options
 * @param {string} options.model - The model.
 * @param {string} options.version - The model version.
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @param {boolean|integer} [options.wait] - Whether to wait until the prediction is completed before returning. If an integer is provided, it will wait for that many seconds. Defaults to false
 * @returns {Promise<object>} Resolves with the created prediction
 */
async function createPrediction(options) {
  const { model, version, input, wait, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const headers = {};
  if (wait) {
    if (typeof wait === "number") {
      const n = Math.max(1, Math.ceil(Number(wait)) || 1);
      headers["Prefer"] = `wait=${n}`;
    } else {
      headers["Prefer"] = "wait";
    }
  }

  let response;
  if (version) {
    response = await this.request("/predictions", {
      method: "POST",
      headers,
      data: {
        ...data,
        input: await transformFileInputs(
          this,
          input,
          this.fileEncodingStrategy
        ),
        version,
      },
    });
  } else if (model) {
    response = await this.request(`/models/${model}/predictions`, {
      method: "POST",
      headers,
      data: {
        ...data,
        input: await transformFileInputs(
          this,
          input,
          this.fileEncodingStrategy
        ),
      },
    });
  } else {
    throw new Error("Either model or version must be specified");
  }

  return response.json();
}

/**
 * Fetch a prediction by ID
 *
 * @param {number} prediction_id - Required. The prediction ID
 * @returns {Promise<object>} Resolves with the prediction data
 */
async function getPrediction(prediction_id) {
  const response = await this.request(`/predictions/${prediction_id}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Cancel a prediction by ID
 *
 * @param {string} prediction_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function cancelPrediction(prediction_id) {
  const response = await this.request(`/predictions/${prediction_id}/cancel`, {
    method: "POST",
  });

  return response.json();
}

/**
 * List all predictions
 *
 * @returns {Promise<object>} - Resolves with a page of predictions
 */
async function listPredictions() {
  const response = await this.request("/predictions", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  create: createPrediction,
  get: getPrediction,
  cancel: cancelPrediction,
  list: listPredictions,
};


/***/ }),

/***/ 2782:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ApiError = __webpack_require__(8811);
const { create: createFile } = __webpack_require__(3102);

/**
 * @see {@link validateWebhook}
 * @overload
 * @param {object} requestData - The request data
 * @param {string} requestData.id - The webhook ID header from the incoming request.
 * @param {string} requestData.timestamp - The webhook timestamp header from the incoming request.
 * @param {string} requestData.body - The raw body of the incoming webhook request.
 * @param {string} requestData.secret - The webhook secret, obtained from `replicate.webhooks.defaul.secret` method.
 * @param {string} requestData.signature - The webhook signature header from the incoming request, comprising one or more space-delimited signatures.
 */

/**
 * @see {@link validateWebhook}
 * @overload
 * @param {object} requestData - The request object
 * @param {object} requestData.headers - The request headers
 * @param {string} requestData.headers["webhook-id"] - The webhook ID header from the incoming request
 * @param {string} requestData.headers["webhook-timestamp"] - The webhook timestamp header from the incoming request
 * @param {string} requestData.headers["webhook-signature"] - The webhook signature header from the incoming request, comprising one or more space-delimited signatures
 * @param {string} requestData.body - The raw body of the incoming webhook request
 * @param {string} secret - The webhook secret, obtained from `replicate.webhooks.defaul.secret` method
 */

/**
 * Validate a webhook signature
 *
 * @returns {Promise<boolean>} - True if the signature is valid
 * @throws {Error} - If the request is missing required headers, body, or secret
 */
async function validateWebhook(requestData, secret) {
  let { id, timestamp, body, signature } = requestData;
  const signingSecret = secret || requestData.secret;

  if (requestData && requestData.headers && requestData.body) {
    if (typeof requestData.headers.get === "function") {
      // Headers object (e.g. Fetch API Headers)
      id = requestData.headers.get("webhook-id");
      timestamp = requestData.headers.get("webhook-timestamp");
      signature = requestData.headers.get("webhook-signature");
    } else {
      // Plain object with header key-value pairs
      id = requestData.headers["webhook-id"];
      timestamp = requestData.headers["webhook-timestamp"];
      signature = requestData.headers["webhook-signature"];
    }
    body = requestData.body;
  }

  if (body instanceof ReadableStream || body.readable) {
    try {
      body = await new Response(body).text();
    } catch (err) {
      throw new Error(`Error reading body: ${err.message}`);
    }
  } else if (isTypedArray(body)) {
    body = await new Blob([body]).text();
  } else if (typeof body === "object") {
    body = JSON.stringify(body);
  } else if (typeof body !== "string") {
    throw new Error("Invalid body type");
  }

  if (!id || !timestamp || !signature) {
    throw new Error("Missing required webhook headers");
  }

  if (!body) {
    throw new Error("Missing required body");
  }

  if (!signingSecret) {
    throw new Error("Missing required secret");
  }

  const signedContent = `${id}.${timestamp}.${body}`;

  const computedSignature = await createHMACSHA256(
    signingSecret.split("_").pop(),
    signedContent
  );

  const expectedSignatures = signature
    .split(" ")
    .map((sig) => sig.split(",")[1]);

  return expectedSignatures.some(
    (expectedSignature) => expectedSignature === computedSignature
  );
}

/**
 * @param {string} secret - base64 encoded string
 * @param {string} data - text body of request
 */
async function createHMACSHA256(secret, data) {
  const encoder = new TextEncoder();
  let crypto = globalThis.crypto;

  // In Node 18 the `crypto` global is behind a --no-experimental-global-webcrypto flag
  if (typeof crypto === "undefined" && "function" === "function") {
    // NOTE: Webpack (primarily as it's used by Next.js) and perhaps some
    // other bundlers do not currently support the `node` protocol and will
    // error if it's found in the source. Other platforms like CloudFlare
    // will only support requires when using the node protocol.
    //
    // As this line is purely to support Node 18.x we make an indirect request
    // to the require function which fools Webpack...
    //
    // We may be able to remove this in future as it looks like Webpack is getting
    // support for requiring using the `node:` protocol.
    // See: https://github.com/webpack/webpack/issues/18277
    crypto = __webpack_require__(7225).call(null, "node:crypto").webcrypto;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64(signature);
}

/**
 * Convert a base64 encoded string into bytes.
 *
 * @param {string} the base64 encoded string
 * @return {Uint8Array}
 *
 * Two functions for encoding/decoding base64 strings using web standards. Not
 * intended to be used to encode/decode arbitrary string data.
 * See: https://developer.mozilla.org/en-US/docs/Glossary/Base64#javascript_support
 * See: https://stackoverflow.com/a/31621532
 *
 * Performance might take a hit because of the conversion to string and then to binary,
 * if this is the case we might want to look at an alternative solution.
 * See: https://jsben.ch/wnaZC
 */
function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (m) => m.codePointAt(0));
}

/**
 * Convert a base64 encoded string into bytes.
 *
 * See {@link base64ToBytes} for caveats.
 *
 * @param {Uint8Array | ArrayBuffer} the base64 encoded string
 * @return {string}
 */
function bytesToBase64(bytes) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
}

/**
 * Automatically retry a request if it fails with an appropriate status code.
 *
 * A GET request is retried if it fails with a 429 or 5xx status code.
 * A non-GET request is retried only if it fails with a 429 status code.
 *
 * If the response sets a Retry-After header,
 * the request is retried after the number of seconds specified in the header.
 * Otherwise, the request is retried after the specified interval,
 * with exponential backoff and jitter.
 *
 * @param {Function} request - A function that returns a Promise that resolves with a Response object
 * @param {object} options
 * @param {Function} [options.shouldRetry] - A function that returns true if the request should be retried
 * @param {number} [options.maxRetries] - Maximum number of retries. Defaults to 5
 * @param {number} [options.interval] - Interval between retries in milliseconds. Defaults to 500
 * @returns {Promise<Response>} - Resolves with the response object
 * @throws {ApiError} If the request failed
 */
async function withAutomaticRetries(request, options = {}) {
  const shouldRetry = options.shouldRetry || (() => false);
  const maxRetries = options.maxRetries || 5;
  const interval = options.interval || 500;
  const jitter = options.jitter || 100;

  // eslint-disable-next-line no-promise-executor-return
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let attempts = 0;
  do {
    let delay = interval * 2 ** attempts + Math.random() * jitter;

    /* eslint-disable no-await-in-loop */
    try {
      const response = await request();
      if (response.ok || !shouldRetry(response)) {
        return response;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const retryAfter = error.response.headers.get("Retry-After");
        if (retryAfter) {
          if (!Number.isInteger(retryAfter)) {
            // Retry-After is a date
            const date = new Date(retryAfter);
            if (!Number.isNaN(date.getTime())) {
              delay = date.getTime() - new Date().getTime();
            }
          } else {
            // Retry-After is a number of seconds
            delay = retryAfter * 1000;
          }
        }
      }
    }

    if (Number.isInteger(maxRetries) && maxRetries > 0) {
      if (Number.isInteger(delay) && delay > 0) {
        await sleep(interval * 2 ** (options.maxRetries - maxRetries));
      }
      attempts += 1;
    }
  } while (attempts < maxRetries);

  return request();
}

/**
 * Walks the inputs and, for any File or Blob, tries to upload it to Replicate
 * and replaces the input with the URL of the uploaded file.
 *
 * @param {Replicate} client - The client used to upload the file
 * @param {object} inputs - The inputs to transform
 * @param {"default" | "upload" | "data-uri"} strategy - Whether to upload files to Replicate, encode as dataURIs or try both.
 * @returns {object} - The transformed inputs
 * @throws {ApiError} If the request to upload the file fails
 */
async function transformFileInputs(client, inputs, strategy) {
  switch (strategy) {
    case "data-uri":
      return await transformFileInputsToBase64EncodedDataURIs(client, inputs);
    case "upload":
      return await transformFileInputsToReplicateFileURLs(client, inputs);
    case "default":
      try {
        return await transformFileInputsToReplicateFileURLs(client, inputs);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          throw error;
        }
        return await transformFileInputsToBase64EncodedDataURIs(inputs);
      }
    default:
      throw new Error(`Unexpected file upload strategy: ${strategy}`);
  }
}

/**
 * Walks the inputs and, for any File or Blob, tries to upload it to Replicate
 * and replaces the input with the URL of the uploaded file.
 *
 * @param {Replicate} client - The client used to upload the file
 * @param {object} inputs - The inputs to transform
 * @returns {object} - The transformed inputs
 * @throws {ApiError} If the request to upload the file fails
 */
async function transformFileInputsToReplicateFileURLs(client, inputs) {
  return await transform(inputs, async (value) => {
    if (value instanceof Blob || value instanceof Buffer) {
      const file = await createFile.call(client, value);
      return file.urls.get;
    }

    return value;
  });
}

const MAX_DATA_URI_SIZE = 10_000_000;

/**
 * Walks the inputs and transforms any binary data found into a
 * base64-encoded data URI.
 *
 * @param {object} inputs - The inputs to transform
 * @returns {object} - The transformed inputs
 * @throws {Error} If the size of inputs exceeds a given threshould set by MAX_DATA_URI_SIZE
 */
async function transformFileInputsToBase64EncodedDataURIs(inputs) {
  let totalBytes = 0;
  return await transform(inputs, async (value) => {
    let buffer;
    let mime;

    if (value instanceof Blob) {
      // Currently we use a NodeJS only API for base64 encoding, as
      // we move to support the browser we could support either using
      // btoa (which does string encoding), the FileReader API or
      // a JavaScript implenentation like base64-js.
      // See: https://developer.mozilla.org/en-US/docs/Glossary/Base64
      // See: https://github.com/beatgammit/base64-js
      buffer = await value.arrayBuffer();
      mime = value.type;
    } else if (isTypedArray(value)) {
      buffer = value;
    } else {
      return value;
    }

    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_DATA_URI_SIZE) {
      throw new Error(
        `Combined filesize of prediction ${totalBytes} bytes exceeds 10mb limit for inline encoding, please provide URLs instead`
      );
    }

    const data = bytesToBase64(buffer);
    mime = mime || "application/octet-stream";

    return `data:${mime};base64,${data}`;
  });
}

// Walk a JavaScript object and transform the leaf values.
async function transform(value, mapper) {
  if (Array.isArray(value)) {
    const copy = [];
    for (const val of value) {
      const transformed = await transform(val, mapper);
      copy.push(transformed);
    }
    return copy;
  }

  if (isPlainObject(value)) {
    const copy = {};
    for (const key of Object.keys(value)) {
      copy[key] = await transform(value[key], mapper);
    }
    return copy;
  }

  return await mapper(value);
}

function isTypedArray(arr) {
  return (
    arr instanceof Int8Array ||
    arr instanceof Int16Array ||
    arr instanceof Int32Array ||
    arr instanceof Uint8Array ||
    arr instanceof Uint8ClampedArray ||
    arr instanceof Uint16Array ||
    arr instanceof Uint32Array ||
    arr instanceof Float32Array ||
    arr instanceof Float64Array
  );
}

// Test for a plain JS object.
// Source: lodash.isPlainObject
function isPlainObject(value) {
  const isObjectLike = typeof value === "object" && value !== null;
  if (!isObjectLike || String(value) !== "[object Object]") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof Ctor === "function" &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) ===
      Function.prototype.toString.call(Object)
  );
}

/**
 * Parse progress from prediction logs.
 *
 * This function supports log statements in the following format,
 * which are generated by https://github.com/tqdm/tqdm and similar libraries:
 *
 * ```
 * 76%|████████████████████████████         | 7568/10000 [00:33<00:10, 229.00it/s]
 * ```
 *
 * @example
 * const progress = parseProgressFromLogs("76%|████████████████████████████         | 7568/10000 [00:33<00:10, 229.00it/s]");
 * console.log(progress);
 * // {
 * //   percentage: 0.76,
 * //   current: 7568,
 * //   total: 10000,
 * // }
 *
 * @param {object|string} input - A prediction object or string.
 * @returns {(object|null)} - An object with the percentage, current, and total, or null if no progress can be parsed.
 */
function parseProgressFromLogs(input) {
  const logs = typeof input === "object" && input.logs ? input.logs : input;
  if (!logs || typeof logs !== "string") {
    return null;
  }

  const pattern = /^\s*(\d+)%\s*\|.+?\|\s*(\d+)\/(\d+)/;
  const lines = logs.split("\n").reverse();

  for (const line of lines) {
    const matches = line.match(pattern);

    if (matches && matches.length === 4) {
      return {
        percentage: parseInt(matches[1], 10) / 100,
        current: parseInt(matches[2], 10),
        total: parseInt(matches[3], 10),
      };
    }
  }

  return null;
}

/**
 * Helper to make any `ReadableStream` iterable, this is supported
 * by most server runtimes but browsers still haven't implemented
 * it yet.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#browser_compatibility
 *
 * @template T
 * @param {ReadableStream<T>} stream an instance of a `ReadableStream`
 * @yields {T} a chunk/event from the stream
 */
async function* streamAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

module.exports = {
  transform,
  transformFileInputs,
  validateWebhook,
  withAutomaticRetries,
  parseProgressFromLogs,
  streamAsyncIterator,
};


/***/ }),

/***/ 3102:
/***/ ((module) => {

/**
 * Create a file
 *
 * @param {object} file - Required. The file object.
 * @param {object} metadata - Optional. User-provided metadata associated with the file.
 * @returns {Promise<object>} - Resolves with the file data
 */
async function createFile(file, metadata = {}) {
  const form = new FormData();

  let filename;
  let blob;
  if (file instanceof Blob) {
    filename = file.name || `blob_${Date.now()}`;
    blob = file;
  } else if (Buffer.isBuffer(file)) {
    filename = `buffer_${Date.now()}`;
    const bytes = new Uint8Array(file);
    blob = new Blob([bytes], {
      type: "application/octet-stream",
      name: filename,
    });
  } else {
    throw new Error("Invalid file argument, must be a Blob, File or Buffer");
  }

  form.append("content", blob, filename);
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );

  const response = await this.request("/files", {
    method: "POST",
    data: form,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.json();
}

/**
 * List all files
 *
 * @returns {Promise<object>} - Resolves with the files data
 */
async function listFiles() {
  const response = await this.request("/files", {
    method: "GET",
  });

  return response.json();
}

/**
 * Get a file
 *
 * @param {string} file_id - Required. The ID of the file.
 * @returns {Promise<object>} - Resolves with the file data
 */
async function getFile(file_id) {
  const response = await this.request(`/files/${file_id}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Delete a file
 *
 * @param {string} file_id - Required. The ID of the file.
 * @returns {Promise<boolean>} - Resolves with true if the file was deleted
 */
async function deleteFile(file_id) {
  const response = await this.request(`/files/${file_id}`, {
    method: "DELETE",
  });

  return response.status === 204;
}

module.exports = {
  create: createFile,
  list: listFiles,
  get: getFile,
  delete: deleteFile,
};


/***/ }),

/***/ 3649:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ApiError = __webpack_require__(8811);
const ModelVersionIdentifier = __webpack_require__(9522);
const { createReadableStream, createFileOutput } = __webpack_require__(9053);
const {
  transform,
  withAutomaticRetries,
  validateWebhook,
  parseProgressFromLogs,
  streamAsyncIterator,
} = __webpack_require__(2782);

const accounts = __webpack_require__(7333);
const collections = __webpack_require__(320);
const deployments = __webpack_require__(1033);
const files = __webpack_require__(3102);
const hardware = __webpack_require__(8097);
const models = __webpack_require__(4539);
const predictions = __webpack_require__(1731);
const trainings = __webpack_require__(7226);
const webhooks = __webpack_require__(1415);

const packageJSON = __webpack_require__(119);

/**
 * Replicate API client library
 *
 * @see https://replicate.com/docs/reference/http
 * @example
 * // Create a new Replicate API client instance
 * const Replicate = require("replicate");
 * const replicate = new Replicate({
 *     // get your token from https://replicate.com/account
 *     auth: process.env.REPLICATE_API_TOKEN,
 *     userAgent: "my-app/1.2.3"
 * });
 *
 * // Run a model and await the result:
 * const model = 'owner/model:version-id'
 * const input = {text: 'Hello, world!'}
 * const output = await replicate.run(model, { input });
 */
class Replicate {
  /**
   * Create a new Replicate API client instance.
   *
   * @param {object} options - Configuration options for the client
   * @param {string} options.auth - API access token. Defaults to the `REPLICATE_API_TOKEN` environment variable.
   * @param {string} options.userAgent - Identifier of your app
   * @param {string} [options.baseUrl] - Defaults to https://api.replicate.com/v1
   * @param {Function} [options.fetch] - Fetch function to use. Defaults to `globalThis.fetch`
   * @param {boolean} [options.useFileOutput] - Set to `false` to disable `FileOutput` objects from `run` instead of URLs, defaults to true.
   * @param {"default" | "upload" | "data-uri"} [options.fileEncodingStrategy] - Determines the file encoding strategy to use
   */
  constructor(options = {}) {
    this.auth =
      options.auth ||
      (typeof process !== "undefined" ? process.env.REPLICATE_API_TOKEN : null);
    this.userAgent =
      options.userAgent || `replicate-javascript/${packageJSON.version}`;
    this.baseUrl = options.baseUrl || "https://api.replicate.com/v1";
    this.fetch = options.fetch || globalThis.fetch;
    this.fileEncodingStrategy = options.fileEncodingStrategy || "default";
    this.useFileOutput = options.useFileOutput === false ? false : true;

    this.accounts = {
      current: accounts.current.bind(this),
    };

    this.collections = {
      list: collections.list.bind(this),
      get: collections.get.bind(this),
    };

    this.deployments = {
      get: deployments.get.bind(this),
      create: deployments.create.bind(this),
      update: deployments.update.bind(this),
      delete: deployments.delete.bind(this),
      list: deployments.list.bind(this),
      predictions: {
        create: deployments.predictions.create.bind(this),
      },
    };

    this.files = {
      create: files.create.bind(this),
      get: files.get.bind(this),
      list: files.list.bind(this),
      delete: files.delete.bind(this),
    };

    this.hardware = {
      list: hardware.list.bind(this),
    };

    this.models = {
      get: models.get.bind(this),
      list: models.list.bind(this),
      create: models.create.bind(this),
      versions: {
        list: models.versions.list.bind(this),
        get: models.versions.get.bind(this),
      },
      search: models.search.bind(this),
    };

    this.predictions = {
      create: predictions.create.bind(this),
      get: predictions.get.bind(this),
      cancel: predictions.cancel.bind(this),
      list: predictions.list.bind(this),
    };

    this.trainings = {
      create: trainings.create.bind(this),
      get: trainings.get.bind(this),
      cancel: trainings.cancel.bind(this),
      list: trainings.list.bind(this),
    };

    this.webhooks = {
      default: {
        secret: {
          get: webhooks.default.secret.get.bind(this),
        },
      },
    };
  }

  /**
   * Run a model and wait for its output.
   *
   * @param {string} ref - Required. The model version identifier in the format "owner/name" or "owner/name:version"
   * @param {object} options
   * @param {object} options.input - Required. An object with the model inputs
   * @param {{mode: "block", timeout?: number, interval?: number} | {mode: "poll", interval?: number }} [options.wait] - Options for waiting for the prediction to finish. If `wait` is explicitly true, the function will block and wait for the prediction to finish.
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @param {AbortSignal} [options.signal] - AbortSignal to cancel the prediction
   * @param {Function} [progress] - Callback function that receives the prediction object as it's updated. The function is called when the prediction is created, each time its updated while polling for completion, and when it's completed.
   * @throws {Error} If the reference is invalid
   * @throws {Error} If the prediction failed
   * @returns {Promise<object>} - Resolves with the output of running the model
   */
  async run(ref, options, progress) {
    const { wait = { mode: "block" }, signal, ...data } = options;

    const identifier = ModelVersionIdentifier.parse(ref);

    let prediction;
    if (identifier.version) {
      prediction = await this.predictions.create({
        ...data,
        version: identifier.version,
        wait: wait.mode === "block" ? wait.timeout ?? true : false,
      });
    } else if (identifier.owner && identifier.name) {
      prediction = await this.predictions.create({
        ...data,
        model: `${identifier.owner}/${identifier.name}`,
        wait: wait.mode === "block" ? wait.timeout ?? true : false,
      });
    } else {
      throw new Error("Invalid model version identifier");
    }

    // Call progress callback with the initial prediction object
    if (progress) {
      progress(prediction);
    }

    const isDone = wait.mode === "block" && prediction.status !== "starting";
    if (!isDone) {
      prediction = await this.wait(
        prediction,
        { interval: wait.mode === "poll" ? wait.interval : undefined },
        async (updatedPrediction) => {
          // Call progress callback with the updated prediction object
          if (progress) {
            progress(updatedPrediction);
          }

          // We handle the cancel later in the function.
          if (signal && signal.aborted) {
            return true; // stop polling
          }

          return false; // continue polling
        }
      );
    }

    if (signal && signal.aborted) {
      prediction = await this.predictions.cancel(prediction.id);
    }

    // Call progress callback with the completed prediction object
    if (progress) {
      progress(prediction);
    }

    if (prediction.status === "failed") {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    return transform(prediction.output, (value) => {
      if (
        typeof value === "string" &&
        (value.startsWith("https:") || value.startsWith("data:"))
      ) {
        return this.useFileOutput
          ? createFileOutput({ url: value, fetch: this.fetch })
          : value;
      }
      return value;
    });
  }

  /**
   * Make a request to the Replicate API.
   *
   * @param {string} route - REST API endpoint path
   * @param {object} options - Request parameters
   * @param {string} [options.method] - HTTP method. Defaults to GET
   * @param {object} [options.params] - Query parameters
   * @param {object|Headers} [options.headers] - HTTP headers
   * @param {object} [options.data] - Body parameters
   * @returns {Promise<Response>} - Resolves with the response object
   * @throws {ApiError} If the request failed
   */
  async request(route, options) {
    const { auth, baseUrl, userAgent } = this;

    let url;
    if (route instanceof URL) {
      url = route;
    } else {
      url = new URL(
        route.startsWith("/") ? route.slice(1) : route,
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
      );
    }

    const { method = "GET", params = {}, data } = options;

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const headers = {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
    };
    if (auth) {
      headers["Authorization"] = `Bearer ${auth}`;
    }
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers[key] = value;
      }
    }

    let body = undefined;
    if (data instanceof FormData) {
      body = data;
      // biome-ignore lint/performance/noDelete:
      delete headers["Content-Type"]; // Use automatic content type header
    } else if (data) {
      body = JSON.stringify(data);
    }

    const init = {
      method,
      headers,
      body,
    };

    const shouldRetry =
      method === "GET"
        ? (response) => response.status === 429 || response.status >= 500
        : (response) => response.status === 429;

    // Workaround to fix `TypeError: Illegal invocation` error in Cloudflare Workers
    // https://github.com/replicate/replicate-javascript/issues/134
    const _fetch = this.fetch; // eslint-disable-line no-underscore-dangle
    const response = await withAutomaticRetries(async () => _fetch(url, init), {
      shouldRetry,
    });

    if (!response.ok) {
      const request = new Request(url, init);
      const responseText = await response.text();
      throw new ApiError(
        `Request to ${url} failed with status ${response.status} ${response.statusText}: ${responseText}.`,
        request,
        response
      );
    }

    return response;
  }

  /**
   * Stream a model and wait for its output.
   *
   * @param {string} identifier - Required. The model version identifier in the format "{owner}/{name}:{version}"
   * @param {object} options
   * @param {object} options.input - Required. An object with the model inputs
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @param {AbortSignal} [options.signal] - AbortSignal to cancel the prediction
   * @throws {Error} If the prediction failed
   * @yields {ServerSentEvent} Each streamed event from the prediction
   */
  async *stream(ref, options) {
    const { wait, signal, ...data } = options;

    const identifier = ModelVersionIdentifier.parse(ref);

    let prediction;
    if (identifier.version) {
      prediction = await this.predictions.create({
        ...data,
        version: identifier.version,
      });
    } else if (identifier.owner && identifier.name) {
      prediction = await this.predictions.create({
        ...data,
        model: `${identifier.owner}/${identifier.name}`,
      });
    } else {
      throw new Error("Invalid model version identifier");
    }

    if (prediction.urls && prediction.urls.stream) {
      const stream = createReadableStream({
        url: prediction.urls.stream,
        fetch: this.fetch,
        ...(signal ? { options: { signal } } : {}),
      });

      yield* streamAsyncIterator(stream);
    } else {
      throw new Error("Prediction does not support streaming");
    }
  }

  /**
   * Paginate through a list of results.
   *
   * @generator
   * @example
   * for await (const page of replicate.paginate(replicate.predictions.list) {
   *    console.log(page);
   * }
   * @param {Function} endpoint - Function that returns a promise for the next page of results
   * @yields {object[]} Each page of results
   */
  async *paginate(endpoint) {
    const response = await endpoint();
    yield response.results;
    if (response.next) {
      const nextPage = () =>
        this.request(response.next, { method: "GET" }).then((r) => r.json());
      yield* this.paginate(nextPage);
    }
  }

  /**
   * Wait for a prediction to finish.
   *
   * If the prediction has already finished,
   * this function returns immediately.
   * Otherwise, it polls the API until the prediction finishes.
   *
   * @async
   * @param {object} prediction - Prediction object
   * @param {object} options - Options
   * @param {number} [options.interval] - Polling interval in milliseconds. Defaults to 500
   * @param {Function} [stop] - Async callback function that is called after each polling attempt. Receives the prediction object as an argument. Return false to cancel polling.
   * @throws {Error} If the prediction doesn't complete within the maximum number of attempts
   * @throws {Error} If the prediction failed
   * @returns {Promise<object>} Resolves with the completed prediction object
   */
  async wait(prediction, options, stop) {
    const { id } = prediction;
    if (!id) {
      throw new Error("Invalid prediction");
    }

    if (
      prediction.status === "succeeded" ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      return prediction;
    }

    // eslint-disable-next-line no-promise-executor-return
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const interval = (options && options.interval) || 500;

    let updatedPrediction = await this.predictions.get(id);

    while (
      updatedPrediction.status !== "succeeded" &&
      updatedPrediction.status !== "failed" &&
      updatedPrediction.status !== "canceled"
    ) {
      /* eslint-disable no-await-in-loop */
      if (stop && (await stop(updatedPrediction)) === true) {
        break;
      }

      await sleep(interval);
      updatedPrediction = await this.predictions.get(prediction.id);
      /* eslint-enable no-await-in-loop */
    }

    if (updatedPrediction.status === "failed") {
      throw new Error(`Prediction failed: ${updatedPrediction.error}`);
    }

    return updatedPrediction;
  }
}

module.exports = Replicate;
module.exports.validateWebhook = validateWebhook;
module.exports.parseProgressFromLogs = parseProgressFromLogs;


/***/ }),

/***/ 4539:
/***/ ((module) => {

/**
 * Get information about a model
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @returns {Promise<object>} Resolves with the model data
 */
async function getModel(model_owner, model_name) {
  const response = await this.request(`/models/${model_owner}/${model_name}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * List model versions
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @returns {Promise<object>} Resolves with the list of model versions
 */
async function listModelVersions(model_owner, model_name) {
  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions`,
    {
      method: "GET",
    }
  );

  return response.json();
}

/**
 * Get a specific model version
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {string} version_id - Required. The model version
 * @returns {Promise<object>} Resolves with the model version data
 */
async function getModelVersion(model_owner, model_name, version_id) {
  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}`,
    {
      method: "GET",
    }
  );

  return response.json();
}

/**
 * List all public models
 *
 * @returns {Promise<object>} Resolves with the model version data
 */
async function listModels() {
  const response = await this.request("/models", {
    method: "GET",
  });

  return response.json();
}

/**
 * Create a new model
 *
 * @param {string} model_owner - Required. The name of the user or organization that will own the model. This must be the same as the user or organization that is making the API request. In other words, the API token used in the request must belong to this user or organization.
 * @param {string} model_name - Required. The name of the model. This must be unique among all models owned by the user or organization.
 * @param {object} options
 * @param {("public"|"private")} options.visibility - Required. Whether the model should be public or private. A public model can be viewed and run by anyone, whereas a private model can be viewed and run only by the user or organization members that own the model.
 * @param {string} options.hardware - Required. The SKU for the hardware used to run the model. Possible values can be found by calling `Replicate.hardware.list()`.
 * @param {string} options.description - A description of the model.
 * @param {string} options.github_url - A URL for the model's source code on GitHub.
 * @param {string} options.paper_url - A URL for the model's paper.
 * @param {string} options.license_url - A URL for the model's license.
 * @param {string} options.cover_image_url - A URL for the model's cover image. This should be an image file.
 * @returns {Promise<object>} Resolves with the model version data
 */
async function createModel(model_owner, model_name, options) {
  const data = { owner: model_owner, name: model_name, ...options };

  const response = await this.request("/models", {
    method: "POST",
    data,
  });

  return response.json();
}

/**
 * Search for public models
 *
 * @param {string} query - The search query
 * @returns {Promise<object>} Resolves with a page of models matching the search query
 */
async function search(query) {
  const response = await this.request("/models", {
    method: "QUERY",
    headers: {
      "Content-Type": "text/plain",
    },
    data: query,
  });

  return response.json();
}

module.exports = {
  get: getModel,
  list: listModels,
  create: createModel,
  versions: { list: listModelVersions, get: getModelVersion },
  search,
};


/***/ }),

/***/ 5356:
/***/ ((module) => {

// Source: https://github.com/rexxars/eventsource-parser/tree/v1.1.2
//
// MIT License
//
// Copyright (c) 2024 Espen Hovlandsdal <espen@hovlandsdal.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// /input.ts
var input_exports = {};
__export(input_exports, {
  EventSourceParserStream: () => EventSourceParserStream,
});
module.exports = __toCommonJS(input_exports);

// http-url:https://unpkg.com/eventsource-parser@1.1.2/dist/index.js
function createParser(onParse) {
  let isFirstChunk;
  let buffer;
  let startingPosition;
  let startingFieldLength;
  let eventId;
  let eventName;
  let data;
  reset();
  return {
    feed,
    reset,
  };
  function reset() {
    isFirstChunk = true;
    buffer = "";
    startingPosition = 0;
    startingFieldLength = -1;
    eventId = void 0;
    eventName = void 0;
    data = "";
  }
  function feed(chunk) {
    buffer = buffer ? buffer + chunk : chunk;
    if (isFirstChunk && hasBom(buffer)) {
      buffer = buffer.slice(BOM.length);
    }
    isFirstChunk = false;
    const length = buffer.length;
    let position = 0;
    let discardTrailingNewline = false;
    while (position < length) {
      if (discardTrailingNewline) {
        if (buffer[position] === "\n") {
          ++position;
        }
        discardTrailingNewline = false;
      }
      let lineLength = -1;
      let fieldLength = startingFieldLength;
      let character;
      for (
        let index = startingPosition;
        lineLength < 0 && index < length;
        ++index
      ) {
        character = buffer[index];
        if (character === ":" && fieldLength < 0) {
          fieldLength = index - position;
        } else if (character === "\r") {
          discardTrailingNewline = true;
          lineLength = index - position;
        } else if (character === "\n") {
          lineLength = index - position;
        }
      }
      if (lineLength < 0) {
        startingPosition = length - position;
        startingFieldLength = fieldLength;
        break;
      } else {
        startingPosition = 0;
        startingFieldLength = -1;
      }
      parseEventStreamLine(buffer, position, fieldLength, lineLength);
      position += lineLength + 1;
    }
    if (position === length) {
      buffer = "";
    } else if (position > 0) {
      buffer = buffer.slice(position);
    }
  }
  function parseEventStreamLine(lineBuffer, index, fieldLength, lineLength) {
    if (lineLength === 0) {
      if (data.length > 0) {
        onParse({
          type: "event",
          id: eventId,
          event: eventName || void 0,
          data: data.slice(0, -1),
          // remove trailing newline
        });
        data = "";
        eventId = void 0;
      }
      eventName = void 0;
      return;
    }
    const noValue = fieldLength < 0;
    const field = lineBuffer.slice(
      index,
      index + (noValue ? lineLength : fieldLength)
    );
    let step = 0;
    if (noValue) {
      step = lineLength;
    } else if (lineBuffer[index + fieldLength + 1] === " ") {
      step = fieldLength + 2;
    } else {
      step = fieldLength + 1;
    }
    const position = index + step;
    const valueLength = lineLength - step;
    const value = lineBuffer.slice(position, position + valueLength).toString();
    if (field === "data") {
      data += value ? "".concat(value, "\n") : "\n";
    } else if (field === "event") {
      eventName = value;
    } else if (field === "id" && !value.includes("\0")) {
      eventId = value;
    } else if (field === "retry") {
      const retry = parseInt(value, 10);
      if (!Number.isNaN(retry)) {
        onParse({
          type: "reconnect-interval",
          value: retry,
        });
      }
    }
  }
}
var BOM = [239, 187, 191];
function hasBom(buffer) {
  return BOM.every((charCode, index) => buffer.charCodeAt(index) === charCode);
}

// http-url:https://unpkg.com/eventsource-parser@1.1.2/dist/stream.js
var EventSourceParserStream = class extends TransformStream {
  constructor() {
    let parser;
    super({
      start(controller) {
        parser = createParser((event) => {
          if (event.type === "event") {
            controller.enqueue(event);
          }
        });
      },
      transform(chunk) {
        parser.feed(chunk);
      },
    });
  }
};


/***/ }),

/***/ 7226:
/***/ ((module) => {

/**
 * Create a new training
 *
 * @param {string} model_owner - Required. The username of the user or organization who owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {string} version_id - Required. The version ID
 * @param {object} options
 * @param {string} options.destination - Required. The destination for the trained version in the form "{username}/{model_name}"
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the training updates
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<object>} Resolves with the data for the created training
 */
async function createTraining(model_owner, model_name, version_id, options) {
  const { ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}/trainings`,
    {
      method: "POST",
      data,
    }
  );

  return response.json();
}

/**
 * Fetch a training by ID
 *
 * @param {string} training_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function getTraining(training_id) {
  const response = await this.request(`/trainings/${training_id}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Cancel a training by ID
 *
 * @param {string} training_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function cancelTraining(training_id) {
  const response = await this.request(`/trainings/${training_id}/cancel`, {
    method: "POST",
  });

  return response.json();
}

/**
 * List all trainings
 *
 * @returns {Promise<object>} - Resolves with a page of trainings
 */
async function listTrainings() {
  const response = await this.request("/trainings", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  create: createTraining,
  get: getTraining,
  cancel: cancelTraining,
  list: listTrainings,
};


/***/ }),

/***/ 7333:
/***/ ((module) => {

/**
 * Get the current account
 *
 * @returns {Promise<object>} Resolves with the current account
 */
async function getCurrentAccount() {
  const response = await this.request("/account", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  current: getCurrentAccount,
};


/***/ }),

/***/ 7657:
/***/ ((module) => {

// Adapted from https://github.com/stardazed/sd-streams
//
// MIT License
//
// Copyright (c) 2018-Present @zenmumbler
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// /input.ts
var input_exports = {};
__export(input_exports, {
  TextDecoderStream: () => TextDecoderStream
});
module.exports = __toCommonJS(input_exports);

// http-url:https://unpkg.com/@stardazed/streams-text-encoding@1.0.2/dist/sd-streams-text-encoding.esm.js
var decDecoder = Symbol("decDecoder");
var decTransform = Symbol("decTransform");
var TextDecodeTransformer = class {
  constructor(decoder) {
    this.decoder_ = decoder;
  }
  transform(chunk, controller) {
    if (!(chunk instanceof ArrayBuffer || ArrayBuffer.isView(chunk))) {
      throw new TypeError("Input data must be a BufferSource");
    }
    const text = this.decoder_.decode(chunk, { stream: true });
    if (text.length !== 0) {
      controller.enqueue(text);
    }
  }
  flush(controller) {
    const text = this.decoder_.decode();
    if (text.length !== 0) {
      controller.enqueue(text);
    }
  }
};
var TextDecoderStream = class {
  constructor(label, options) {
    const decoder = new TextDecoder(label || "utf-8", options || {});
    this[decDecoder] = decoder;
    this[decTransform] = new TransformStream(new TextDecodeTransformer(decoder));
  }
  get encoding() {
    return this[decDecoder].encoding;
  }
  get fatal() {
    return this[decDecoder].fatal;
  }
  get ignoreBOM() {
    return this[decDecoder].ignoreBOM;
  }
  get readable() {
    return this[decTransform].readable;
  }
  get writable() {
    return this[decTransform].writable;
  }
};
var encEncoder = Symbol("encEncoder");
var encTransform = Symbol("encTransform");


/***/ }),

/***/ 8097:
/***/ ((module) => {

/**
 * List hardware
 *
 * @returns {Promise<object[]>} Resolves with the array of hardware
 */
async function listHardware() {
  const response = await this.request("/hardware", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  list: listHardware,
};


/***/ }),

/***/ 8811:
/***/ ((module) => {

/**
 * A representation of an API error.
 */
class ApiError extends Error {
  /**
   * Creates a representation of an API error.
   *
   * @param {string} message - Error message
   * @param {Request} request - HTTP request
   * @param {Response} response - HTTP response
   * @returns {ApiError} - An instance of ApiError
   */
  constructor(message, request, response) {
    super(message);
    this.name = "ApiError";
    this.request = request;
    this.response = response;
  }
}

module.exports = ApiError;


/***/ }),

/***/ 9053:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// Attempt to use readable-stream if available, attempt to use the built-in stream module.

const ApiError = __webpack_require__(8811);
const { streamAsyncIterator } = __webpack_require__(2782);
const {
  EventSourceParserStream,
} = __webpack_require__(5356);
const { TextDecoderStream } =
  typeof globalThis.TextDecoderStream === "undefined"
    ? __webpack_require__(7657)
    : globalThis;

/**
 * A server-sent event.
 */
class ServerSentEvent {
  /**
   * Create a new server-sent event.
   *
   * @param {string} event The event name.
   * @param {string} data The event data.
   * @param {string} id The event ID.
   * @param {number} retry The retry time.
   */
  constructor(event, data, id, retry) {
    this.event = event;
    this.data = data;
    this.id = id;
    this.retry = retry;
  }

  /**
   * Convert the event to a string.
   */
  toString() {
    if (this.event === "output") {
      return this.data;
    }

    return "";
  }
}

/**
 * Create a new stream of server-sent events.
 *
 * @param {object} config
 * @param {string} config.url The URL to connect to.
 * @param {typeof fetch} [config.fetch] The URL to connect to.
 * @param {object} [config.options] The EventSource options.
 * @param {boolean} [config.options.useFileOutput] Whether to use the file output stream.
 * @returns {ReadableStream<ServerSentEvent> & AsyncIterable<ServerSentEvent>}
 */
function createReadableStream({ url, fetch, options = {} }) {
  const { useFileOutput = true, headers = {}, ...initOptions } = options;

  return new ReadableStream({
    async start(controller) {
      const init = {
        ...initOptions,
        headers: {
          ...headers,
          Accept: "text/event-stream",
        },
      };
      const response = await fetch(url, init);

      if (!response.ok) {
        const text = await response.text();
        const request = new Request(url, init);
        controller.error(
          new ApiError(
            `Request to ${url} failed with status ${response.status}: ${text}`,
            request,
            response
          )
        );
      }

      const stream = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());

      for await (const event of streamAsyncIterator(stream)) {
        if (event.event === "error") {
          controller.error(new Error(event.data));
          break;
        }

        let data = event.data;
        if (
          useFileOutput &&
          typeof data === "string" &&
          (data.startsWith("https:") || data.startsWith("data:"))
        ) {
          data = createFileOutput({ data, fetch });
        }
        controller.enqueue(new ServerSentEvent(event.event, data, event.id));

        if (event.event === "done") {
          break;
        }
      }

      controller.close();
    },
  });
}

/**
 * Create a new readable stream for an output file
 * created by running a Replicate model.
 *
 * @param {object} config
 * @param {string} config.url The URL to connect to.
 * @param {typeof fetch} [config.fetch] The fetch function.
 * @returns {ReadableStream<Uint8Array>}
 */
function createFileOutput({ url, fetch }) {
  let type = "application/octet-stream";

  class FileOutput extends ReadableStream {
    async blob() {
      const chunks = [];
      for await (const chunk of this) {
        chunks.push(chunk);
      }
      return new Blob(chunks, { type });
    }

    url() {
      return new URL(url);
    }

    toString() {
      return url;
    }
  }

  return new FileOutput({
    async start(controller) {
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        const request = new Request(url, init);
        controller.error(
          new ApiError(
            `Request to ${url} failed with status ${response.status}: ${text}`,
            request,
            response
          )
        );
      }

      if (response.headers.get("Content-Type")) {
        type = response.headers.get("Content-Type");
      }

      try {
        for await (const chunk of streamAsyncIterator(response.body)) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

module.exports = {
  createFileOutput,
  createReadableStream,
  ServerSentEvent,
};


/***/ }),

/***/ 9522:
/***/ ((module) => {

/*
 * A reference to a model version in the format `owner/name` or `owner/name:version`.
 */
class ModelVersionIdentifier {
  /*
   * @param {string} Required. The model owner.
   * @param {string} Required. The model name.
   * @param {string} The model version.
   */
  constructor(owner, name, version = null) {
    this.owner = owner;
    this.name = name;
    this.version = version;
  }

  /*
   * Parse a reference to a model version
   *
   * @param {string}
   * @returns {ModelVersionIdentifier}
   * @throws {Error} If the reference is invalid.
   */
  static parse(ref) {
    const match = ref.match(
      /^(?<owner>[^/]+)\/(?<name>[^/:]+)(:(?<version>.+))?$/
    );
    if (!match) {
      throw new Error(
        `Invalid reference to model version: ${ref}. Expected format: owner/name or owner/name:version`
      );
    }

    const { owner, name, version } = match.groups;

    return new ModelVersionIdentifier(owner, name, version);
  }
}

module.exports = ModelVersionIdentifier;


/***/ })

};
;