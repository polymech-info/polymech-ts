import React, { useEffect, useState } from 'react';
import '@styles/app.scss';

import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

// const json = require('json-loader!schema.json');

//const schema2 = require('./schema.json');
//const ui = require('./ui.json');

// https://github.com/codesbiome/electron-react-webpack-typescript-2024
const uiSchema:any = 
{
  "ui:submitButtonOptions": {
    "props": {
      "disabled": false,
      "className": "btn btn-info"
    },
    "norender": false,
    "submitText": "Submit"
  },
  "path": {
    "ui:description": "Target directory",
    "ui:title": "Path",
    "ui:placeholder": ".",
    "ui:widget": "file"
  },
  "prompt": {
    "ui:description": "The prompt. Supports file paths and environment variables.",
    "ui:title": "Prompt",
    "ui:placeholder": "./prompt.md"
  },
  "output": {
    "ui:description": "Optional output path for modified files (Tool mode only)",
    "ui:title": "Output"
  },
  "dst": {
    "ui:description": "Optional destination path for the result, will substitute ${MODEL_NAME} and ${ROUTER} in the path. Optional, used for \"completion\" mode",
    "ui:title": "Dst"
  },
  "each": {
    "ui:description": "Glob pattern to run for each matching file",
    "ui:title": "Each"
  },
  "disable": {
    "ui:description": "Disable tools categories, eg: --disable=fs,git,interact,terminal,search,web,email,user",
    "ui:title": "Disable",
    "ui:placeholder": []
  },
  "disableTools": {
    "ui:description": "List of specific tools to disable",
    "ui:title": "Disabletools",
    "ui:placeholder": []
  },
  "tools": {
    "ui:description": "List of tools to use. Can be built-in tool names or paths to custom tool files. Default: fs,git,interact,terminal,search,web,email,user",
    "ui:title": "Tools",
    "ui:placeholder": [
      "fs",
      "git",
      "interact",
      "terminal",
      "search",
      "web",
      "email",
      "user"
    ]
  },
  "include": {
    "ui:description": "Comma separated glob patterns or paths, eg --include=src/*.tsx,src/*.ts --include=package.json",
    "ui:title": "Include"
  },
  "model": {
    "ui:description": "AI model to use for processing. Available models:\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m OpenRouter models:\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\n01-ai/yi-large | paid\naetherwiing/mn-starcannon-12b | paid\nai21/jamba-1-5-large | paid\nai21/jamba-1-5-mini | paid\nai21/jamba-instruct | paid\njondurbin/airoboros-l2-70b | paid\namazon/nova-lite-v1 | paid\namazon/nova-micro-v1 | paid\namazon/nova-pro-v1 | paid\nanthropic/claude-3-haiku | paid\nanthropic/claude-3-haiku:beta | paid\nanthropic/claude-3-opus | paid\nanthropic/claude-3-opus:beta | paid\nanthropic/claude-3-sonnet | paid\nanthropic/claude-3-sonnet:beta | paid\nanthropic/claude-3.5-haiku | paid\nanthropic/claude-3.5-haiku-20241022 | paid\nanthropic/claude-3.5-haiku-20241022:beta | paid\nanthropic/claude-3.5-haiku:beta | paid\nanthropic/claude-3.5-sonnet | paid\nanthropic/claude-3.5-sonnet-20240620 | paid\nanthropic/claude-3.5-sonnet-20240620:beta | paid\nanthropic/claude-3.5-sonnet:beta | paid\nanthropic/claude-2 | paid\nanthropic/claude-2:beta | paid\nanthropic/claude-2.0 | paid\nanthropic/claude-2.0:beta | paid\nanthropic/claude-2.1 | paid\nanthropic/claude-2.1:beta | paid\nopenrouter/auto | paid\ncohere/command | paid\ncohere/command-r | paid\ncohere/command-r-03-2024 | paid\ncohere/command-r-08-2024 | paid\ncohere/command-r-plus | paid\ncohere/command-r-plus-04-2024 | paid\ncohere/command-r-plus-08-2024 | paid\ncohere/command-r7b-12-2024 | paid\ndatabricks/dbrx-instruct | paid\ndeepseek/deepseek-chat-v2.5 | paid\ndeepseek/deepseek-chat | paid\ncognitivecomputations/dolphin-mixtral-8x7b | paid\ncognitivecomputations/dolphin-mixtral-8x22b | paid\neva-unit-01/eva-llama-3.33-70b | paid\neva-unit-01/eva-qwen-2.5-32b | paid\neva-unit-01/eva-qwen-2.5-72b | paid\nalpindale/goliath-120b | paid\ngoogle/gemini-2.0-flash-thinking-exp:free | free\ngoogle/gemini-exp-1114:free | free\ngoogle/gemini-exp-1121:free | free\ngoogle/gemini-exp-1206:free | free\ngoogle/gemini-flash-1.5 | paid\ngoogle/gemini-flash-1.5-8b | paid\ngoogle/gemini-flash-1.5-8b-exp | paid\ngoogle/gemini-flash-1.5-exp | paid\ngoogle/gemini-2.0-flash-exp:free | free\ngoogle/gemini-pro | paid\ngoogle/gemini-pro-1.5 | paid\ngoogle/gemini-pro-1.5-exp | paid\ngoogle/gemini-pro-vision | paid\ngoogle/gemma-2-27b-it | paid\ngoogle/gemma-2-9b-it | paid\ngoogle/gemma-2-9b-it:free | free\ngoogle/learnlm-1.5-pro-experimental:free | free\ngoogle/palm-2-chat-bison | paid\ngoogle/palm-2-chat-bison-32k | paid\ngoogle/palm-2-codechat-bison | paid\ngoogle/palm-2-codechat-bison-32k | paid\nhuggingfaceh4/zephyr-7b-beta:free | free\ninfermatic/mn-inferor-12b | paid\ninflatebot/mn-mag-mell-r1 | paid\ninflection/inflection-3-pi | paid\ninflection/inflection-3-productivity | paid\nliquid/lfm-40b | paid\nlizpreciatior/lzlv-70b-fp16-hf | paid\nalpindale/magnum-72b | paid\nanthracite-org/magnum-v2-72b | paid\nanthracite-org/magnum-v4-72b | paid\nmancer/weaver | paid\nmeta-llama/llama-2-13b-chat | paid\nmeta-llama/llama-3-70b-instruct | paid\nmeta-llama/llama-3-70b-instruct:nitro | paid\nmeta-llama/llama-3-8b-instruct | paid\nmeta-llama/llama-3-8b-instruct:extended | paid\nmeta-llama/llama-3-8b-instruct:free | free\nmeta-llama/llama-3-8b-instruct:nitro | paid\nmeta-llama/llama-3.1-405b | paid\nmeta-llama/llama-3.1-405b-instruct | paid\nmeta-llama/llama-3.1-405b-instruct:free | free\nmeta-llama/llama-3.1-405b-instruct:nitro | paid\nmeta-llama/llama-3.1-70b-instruct | paid\nmeta-llama/llama-3.1-70b-instruct:free | free\nmeta-llama/llama-3.1-70b-instruct:nitro | paid\nmeta-llama/llama-3.1-8b-instruct | paid\nmeta-llama/llama-3.1-8b-instruct:free | free\nmeta-llama/llama-3.2-11b-vision-instruct | paid\nmeta-llama/llama-3.2-11b-vision-instruct:free | free\nmeta-llama/llama-3.2-1b-instruct | paid\nmeta-llama/llama-3.2-1b-instruct:free | free\nmeta-llama/llama-3.2-3b-instruct | paid\nmeta-llama/llama-3.2-3b-instruct:free | free\nmeta-llama/llama-3.2-90b-vision-instruct | paid\nmeta-llama/llama-3.2-90b-vision-instruct:free | free\nmeta-llama/llama-3.3-70b-instruct | paid\nmeta-llama/llama-guard-2-8b | paid\nmicrosoft/phi-3-medium-128k-instruct | paid\nmicrosoft/phi-3-medium-128k-instruct:free | free\nmicrosoft/phi-3-mini-128k-instruct | paid\nmicrosoft/phi-3-mini-128k-instruct:free | free\nmicrosoft/phi-3.5-mini-128k-instruct | paid\nsophosympatheia/midnight-rose-70b | paid\nmistralai/mistral-large | paid\nmistralai/mistral-large-2407 | paid\nmistralai/mistral-large-2411 | paid\nmistralai/mistral-medium | paid\nnothingiisreal/mn-celeste-12b | paid\nmistralai/mistral-small | paid\nmistralai/mistral-tiny | paid\nmistralai/codestral-mamba | paid\nmistralai/ministral-3b | paid\nmistralai/ministral-8b | paid\nmistralai/mistral-7b-instruct | paid\nmistralai/mistral-7b-instruct:free | free\nmistralai/mistral-7b-instruct:nitro | paid\nmistralai/mistral-7b-instruct-v0.1 | paid\nmistralai/mistral-7b-instruct-v0.3 | paid\nmistralai/mistral-nemo | paid\nmistralai/mixtral-8x22b-instruct | paid\nmistralai/mixtral-8x7b | paid\nmistralai/mixtral-8x7b-instruct | paid\nmistralai/mixtral-8x7b-instruct:nitro | paid\nmistralai/pixtral-12b | paid\nmistralai/pixtral-large-2411 | paid\ngryphe/mythomax-l2-13b | paid\ngryphe/mythomax-l2-13b:extended | paid\ngryphe/mythomax-l2-13b:free | free\ngryphe/mythomax-l2-13b:nitro | paid\nneversleep/llama-3-lumimaid-70b | paid\nneversleep/llama-3-lumimaid-8b | paid\nneversleep/llama-3-lumimaid-8b:extended | paid\nneversleep/llama-3.1-lumimaid-70b | paid\nneversleep/llama-3.1-lumimaid-8b | paid\nneversleep/noromaid-20b | paid\nnousresearch/nous-hermes-llama2-13b | paid\nnousresearch/nous-hermes-2-mixtral-8x7b-dpo | paid\nnousresearch/hermes-3-llama-3.1-405b | paid\nnousresearch/hermes-3-llama-3.1-70b | paid\nnousresearch/hermes-2-pro-llama-3-8b | paid\nnvidia/llama-3.1-nemotron-70b-instruct | paid\nopenai/chatgpt-4o-latest | paid\nopenai/gpt-3.5-turbo | paid\nopenai/gpt-3.5-turbo-0613 | paid\nopenai/gpt-3.5-turbo-16k | paid\nopenai/gpt-3.5-turbo-0125 | paid\nopenai/gpt-3.5-turbo-1106 | paid\nopenai/gpt-3.5-turbo-instruct | paid\nopenai/gpt-4 | paid\nopenai/gpt-4-0314 | paid\nopenai/gpt-4-32k | paid\nopenai/gpt-4-32k-0314 | paid\nopenai/gpt-4-turbo | paid\nopenai/gpt-4-1106-preview | paid\nopenai/gpt-4-turbo-preview | paid\nopenai/gpt-4o | paid\nopenai/gpt-4o-2024-05-13 | paid\nopenai/gpt-4o-2024-08-06 | paid\nopenai/gpt-4o-2024-11-20 | paid\nopenai/gpt-4o:extended | paid\nopenai/gpt-4o-mini | paid\nopenai/gpt-4o-mini-2024-07-18 | paid\nopenai/o1 | paid\nopenai/o1-mini | paid\nopenai/o1-mini-2024-09-12 | paid\nopenai/o1-preview | paid\nopenai/o1-preview-2024-09-12 | paid\nopenchat/openchat-7b | paid\nopenchat/openchat-7b:free | free\nteknium/openhermes-2.5-mistral-7b | paid\nperplexity/llama-3.1-sonar-huge-128k-online | paid\nperplexity/llama-3.1-sonar-large-128k-chat | paid\nperplexity/llama-3.1-sonar-large-128k-online | paid\nperplexity/llama-3.1-sonar-small-128k-chat | paid\nperplexity/llama-3.1-sonar-small-128k-online | paid\nperplexity/llama-3-sonar-large-32k-chat | paid\nperplexity/llama-3-sonar-large-32k-online | paid\nperplexity/llama-3-sonar-small-32k-chat | paid\npygmalionai/mythalion-13b | paid\nqwen/qwen-2-72b-instruct | paid\nqwen/qwen-2-7b-instruct | paid\nqwen/qwen-2-7b-instruct:free | free\nqwen/qvq-72b-preview | paid\nqwen/qwq-32b-preview | paid\nqwen/qwen-2-vl-72b-instruct | paid\nqwen/qwen-2-vl-7b-instruct | paid\nqwen/qwen-2.5-72b-instruct | paid\nqwen/qwen-2.5-7b-instruct | paid\nqwen/qwen-2.5-coder-32b-instruct | paid\nundi95/remm-slerp-l2-13b | paid\nundi95/remm-slerp-l2-13b:extended | paid\nthedrummer/rocinante-12b | paid\nsao10k/l3-lunaris-8b | paid\nsao10k/l3-euryale-70b | paid\nsao10k/l3.1-70b-hanami-x1 | paid\nsao10k/l3.1-euryale-70b | paid\nsao10k/l3.3-euryale-70b | paid\nraifle/sorcererlm-8x22b | paid\nundi95/toppy-m-7b | paid\nundi95/toppy-m-7b:free | free\nundi95/toppy-m-7b:nitro | paid\nthedrummer/unslopnemo-12b | paid\nmicrosoft/wizardlm-2-7b | paid\nmicrosoft/wizardlm-2-8x22b | paid\nx-ai/grok-2-1212 | paid\nx-ai/grok-2-vision-1212 | paid\nx-ai/grok-beta | paid\nx-ai/grok-vision-beta | paid\nxwin-lm/xwin-lm-70b | paid\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m OpenAI models:\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\nbabbage-002\nchatgpt-4o-latest\ndall-e-2\ndall-e-3\ndavinci-002\ngpt-3.5-turbo\ngpt-3.5-turbo-0125\ngpt-3.5-turbo-1106\ngpt-3.5-turbo-16k\ngpt-3.5-turbo-instruct\ngpt-3.5-turbo-instruct-0914\ngpt-4\ngpt-4-0125-preview\ngpt-4-0613\ngpt-4-1106-preview\ngpt-4-1106-vision-preview\ngpt-4-turbo\ngpt-4-turbo-2024-04-09\ngpt-4-turbo-preview\ngpt-4-vision-preview\ngpt-4o\ngpt-4o-2024-05-13\ngpt-4o-2024-08-06\ngpt-4o-2024-11-20\ngpt-4o-audio-preview\ngpt-4o-audio-preview-2024-10-01\ngpt-4o-audio-preview-2024-12-17\ngpt-4o-mini\ngpt-4o-mini-2024-07-18\ngpt-4o-mini-audio-preview\ngpt-4o-mini-audio-preview-2024-12-17\ngpt-4o-mini-realtime-preview\ngpt-4o-mini-realtime-preview-2024-12-17\ngpt-4o-realtime-preview\ngpt-4o-realtime-preview-2024-10-01\ngpt-4o-realtime-preview-2024-12-17\no1-mini\no1-mini-2024-09-12\no1-preview\no1-preview-2024-09-12\nomni-moderation-2024-09-26\nomni-moderation-latest\ntext-embedding-3-large\ntext-embedding-3-small\ntext-embedding-ada-002\ntts-1\ntts-1-1106\ntts-1-hd\ntts-1-hd-1106\nwhisper-1\n-----\n",
    "ui:title": "Model",
    "ui:placeholder": "anthropic/claude-3.5-sonnet"
  },
  "router": {
    "ui:description": "Router to use: openai or openrouter",
    "ui:title": "Router",
    "ui:placeholder": "openrouter"
  },
  "mode": {
    "ui:description": "Chat completion mode:\n\t completion, tools, assistant.\n          \u001b[32m\u001b[1mcompletion\u001b[22m\u001b[39m: no support for tools, please use --dst parameter to save the output.\n          \u001b[32m\u001b[1mtools\u001b[22m\u001b[39m: allows for tools to be used, eg 'save to ./output.md'. Not all models support this mode.\n          \u001b[32m\u001b[1massistant\u001b[22m\u001b[39m: : allows documents (PDF, DOCX, ...) to be added but dont support tools. Use --dst to save the output. Supported files :\n      ",
    "ui:title": "Mode",
    "ui:placeholder": "tools"
  },
  "logLevel": {
    "ui:description": "Logging level for the application",
    "ui:title": "Loglevel",
    "ui:placeholder": 2
  },
  "profile": {
    "ui:description": "Path to profile for variables. Supports environment variables.",
    "ui:title": "Profile"
  },
  "config": {
    "ui:description": "Path to JSON configuration file (API keys). Supports environment variables.",
    "ui:title": "Config"
  },
  "dump": {
    "ui:description": "Create a script",
    "ui:title": "Dump"
  },
  "preferences": {
    "ui:description": "Path to preferences file, eg: location, your email address, gender, etc. Supports environment variables.",
    "ui:title": "Preferences",
    "ui:placeholder": "./.kbot/preferences.md"
  },
  "logs": {
    "ui:description": "Logging directory",
    "ui:title": "Logs",
    "ui:placeholder": "./.kbot"
  },
  "env": {
    "ui:description": "Environment (in profile)",
    "ui:title": "Env",
    "ui:placeholder": "default"
  },
  "variables": {
    "ui:title": "Variables",
    "ui:placeholder": {}
  },
  "filters": {
    "ui:description": "List of filters to apply to the output.\n         Used only in completion mode and a given output file specified with --dst. \n         It unwraps by default any code or data in Markdown. \n         Choices:\n\tJSON,JSONUnescape,JSONPretty,AlphaSort,code,JSONParse,trim\n",
    "ui:title": "Filters",
    "ui:placeholder": []
  },
  "dry": {
    "ui:description": "Dry run - only write out parameters without making API calls",
    "ui:title": "Dry",
    "ui:placeholder": false
  }
}
const schema: RJSFSchema = {
  "$ref": "#/definitions/kbot",
  "definitions": {
    "kbot": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "minLength": 1,
          "default": ".",
          "description": "Target directory"
        },
        "prompt": {
          "type": "string",
          "description": "The prompt. Supports file paths and environment variables.",
          "default": "./prompt.md"
        },
        "output": {
          "type": "string",
          "description": "Optional output path for modified files (Tool mode only)"
        },
        "dst": {
          "type": "string",
          "description": "Optional destination path for the result, will substitute ${MODEL_NAME} and ${ROUTER} in the path. Optional, used for \"completion\" mode"
        },
        "each": {
          "type": "string",
          "description": "Glob pattern to run for each matching file"
        },
        "disable": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [],
          "description": "Disable tools categories, eg: --disable=fs,git,interact,terminal,search,web,email,user"
        },
        "disableTools": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [],
          "description": "List of specific tools to disable"
        },
        "tools": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [
            "fs",
            "git",
            "interact",
            "terminal",
            "search",
            "web",
            "email",
            "user"
          ],
          "description": "List of tools to use. Can be built-in tool names or paths to custom tool files. Default: fs,git,interact,terminal,search,web,email,user"
        },
        "include": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Comma separated glob patterns or paths, eg --include=src/*.tsx,src/*.ts --include=package.json"
        },
        "model": {
          "type": "string",
          "default": "anthropic/claude-3.5-sonnet",
          "description": "AI model to use for processing. Available models:\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m OpenRouter models:\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\n01-ai/yi-large | paid\naetherwiing/mn-starcannon-12b | paid\nai21/jamba-1-5-large | paid\nai21/jamba-1-5-mini | paid\nai21/jamba-instruct | paid\njondurbin/airoboros-l2-70b | paid\namazon/nova-lite-v1 | paid\namazon/nova-micro-v1 | paid\namazon/nova-pro-v1 | paid\nanthropic/claude-3-haiku | paid\nanthropic/claude-3-haiku:beta | paid\nanthropic/claude-3-opus | paid\nanthropic/claude-3-opus:beta | paid\nanthropic/claude-3-sonnet | paid\nanthropic/claude-3-sonnet:beta | paid\nanthropic/claude-3.5-haiku | paid\nanthropic/claude-3.5-haiku-20241022 | paid\nanthropic/claude-3.5-haiku-20241022:beta | paid\nanthropic/claude-3.5-haiku:beta | paid\nanthropic/claude-3.5-sonnet | paid\nanthropic/claude-3.5-sonnet-20240620 | paid\nanthropic/claude-3.5-sonnet-20240620:beta | paid\nanthropic/claude-3.5-sonnet:beta | paid\nanthropic/claude-2 | paid\nanthropic/claude-2:beta | paid\nanthropic/claude-2.0 | paid\nanthropic/claude-2.0:beta | paid\nanthropic/claude-2.1 | paid\nanthropic/claude-2.1:beta | paid\nopenrouter/auto | paid\ncohere/command | paid\ncohere/command-r | paid\ncohere/command-r-03-2024 | paid\ncohere/command-r-08-2024 | paid\ncohere/command-r-plus | paid\ncohere/command-r-plus-04-2024 | paid\ncohere/command-r-plus-08-2024 | paid\ncohere/command-r7b-12-2024 | paid\ndatabricks/dbrx-instruct | paid\ndeepseek/deepseek-chat-v2.5 | paid\ndeepseek/deepseek-chat | paid\ncognitivecomputations/dolphin-mixtral-8x7b | paid\ncognitivecomputations/dolphin-mixtral-8x22b | paid\neva-unit-01/eva-llama-3.33-70b | paid\neva-unit-01/eva-qwen-2.5-32b | paid\neva-unit-01/eva-qwen-2.5-72b | paid\nalpindale/goliath-120b | paid\ngoogle/gemini-2.0-flash-thinking-exp:free | free\ngoogle/gemini-exp-1114:free | free\ngoogle/gemini-exp-1121:free | free\ngoogle/gemini-exp-1206:free | free\ngoogle/gemini-flash-1.5 | paid\ngoogle/gemini-flash-1.5-8b | paid\ngoogle/gemini-flash-1.5-8b-exp | paid\ngoogle/gemini-flash-1.5-exp | paid\ngoogle/gemini-2.0-flash-exp:free | free\ngoogle/gemini-pro | paid\ngoogle/gemini-pro-1.5 | paid\ngoogle/gemini-pro-1.5-exp | paid\ngoogle/gemini-pro-vision | paid\ngoogle/gemma-2-27b-it | paid\ngoogle/gemma-2-9b-it | paid\ngoogle/gemma-2-9b-it:free | free\ngoogle/learnlm-1.5-pro-experimental:free | free\ngoogle/palm-2-chat-bison | paid\ngoogle/palm-2-chat-bison-32k | paid\ngoogle/palm-2-codechat-bison | paid\ngoogle/palm-2-codechat-bison-32k | paid\nhuggingfaceh4/zephyr-7b-beta:free | free\ninfermatic/mn-inferor-12b | paid\ninflatebot/mn-mag-mell-r1 | paid\ninflection/inflection-3-pi | paid\ninflection/inflection-3-productivity | paid\nliquid/lfm-40b | paid\nlizpreciatior/lzlv-70b-fp16-hf | paid\nalpindale/magnum-72b | paid\nanthracite-org/magnum-v2-72b | paid\nanthracite-org/magnum-v4-72b | paid\nmancer/weaver | paid\nmeta-llama/llama-2-13b-chat | paid\nmeta-llama/llama-3-70b-instruct | paid\nmeta-llama/llama-3-70b-instruct:nitro | paid\nmeta-llama/llama-3-8b-instruct | paid\nmeta-llama/llama-3-8b-instruct:extended | paid\nmeta-llama/llama-3-8b-instruct:free | free\nmeta-llama/llama-3-8b-instruct:nitro | paid\nmeta-llama/llama-3.1-405b | paid\nmeta-llama/llama-3.1-405b-instruct | paid\nmeta-llama/llama-3.1-405b-instruct:free | free\nmeta-llama/llama-3.1-405b-instruct:nitro | paid\nmeta-llama/llama-3.1-70b-instruct | paid\nmeta-llama/llama-3.1-70b-instruct:free | free\nmeta-llama/llama-3.1-70b-instruct:nitro | paid\nmeta-llama/llama-3.1-8b-instruct | paid\nmeta-llama/llama-3.1-8b-instruct:free | free\nmeta-llama/llama-3.2-11b-vision-instruct | paid\nmeta-llama/llama-3.2-11b-vision-instruct:free | free\nmeta-llama/llama-3.2-1b-instruct | paid\nmeta-llama/llama-3.2-1b-instruct:free | free\nmeta-llama/llama-3.2-3b-instruct | paid\nmeta-llama/llama-3.2-3b-instruct:free | free\nmeta-llama/llama-3.2-90b-vision-instruct | paid\nmeta-llama/llama-3.2-90b-vision-instruct:free | free\nmeta-llama/llama-3.3-70b-instruct | paid\nmeta-llama/llama-guard-2-8b | paid\nmicrosoft/phi-3-medium-128k-instruct | paid\nmicrosoft/phi-3-medium-128k-instruct:free | free\nmicrosoft/phi-3-mini-128k-instruct | paid\nmicrosoft/phi-3-mini-128k-instruct:free | free\nmicrosoft/phi-3.5-mini-128k-instruct | paid\nsophosympatheia/midnight-rose-70b | paid\nmistralai/mistral-large | paid\nmistralai/mistral-large-2407 | paid\nmistralai/mistral-large-2411 | paid\nmistralai/mistral-medium | paid\nnothingiisreal/mn-celeste-12b | paid\nmistralai/mistral-small | paid\nmistralai/mistral-tiny | paid\nmistralai/codestral-mamba | paid\nmistralai/ministral-3b | paid\nmistralai/ministral-8b | paid\nmistralai/mistral-7b-instruct | paid\nmistralai/mistral-7b-instruct:free | free\nmistralai/mistral-7b-instruct:nitro | paid\nmistralai/mistral-7b-instruct-v0.1 | paid\nmistralai/mistral-7b-instruct-v0.3 | paid\nmistralai/mistral-nemo | paid\nmistralai/mixtral-8x22b-instruct | paid\nmistralai/mixtral-8x7b | paid\nmistralai/mixtral-8x7b-instruct | paid\nmistralai/mixtral-8x7b-instruct:nitro | paid\nmistralai/pixtral-12b | paid\nmistralai/pixtral-large-2411 | paid\ngryphe/mythomax-l2-13b | paid\ngryphe/mythomax-l2-13b:extended | paid\ngryphe/mythomax-l2-13b:free | free\ngryphe/mythomax-l2-13b:nitro | paid\nneversleep/llama-3-lumimaid-70b | paid\nneversleep/llama-3-lumimaid-8b | paid\nneversleep/llama-3-lumimaid-8b:extended | paid\nneversleep/llama-3.1-lumimaid-70b | paid\nneversleep/llama-3.1-lumimaid-8b | paid\nneversleep/noromaid-20b | paid\nnousresearch/nous-hermes-llama2-13b | paid\nnousresearch/nous-hermes-2-mixtral-8x7b-dpo | paid\nnousresearch/hermes-3-llama-3.1-405b | paid\nnousresearch/hermes-3-llama-3.1-70b | paid\nnousresearch/hermes-2-pro-llama-3-8b | paid\nnvidia/llama-3.1-nemotron-70b-instruct | paid\nopenai/chatgpt-4o-latest | paid\nopenai/gpt-3.5-turbo | paid\nopenai/gpt-3.5-turbo-0613 | paid\nopenai/gpt-3.5-turbo-16k | paid\nopenai/gpt-3.5-turbo-0125 | paid\nopenai/gpt-3.5-turbo-1106 | paid\nopenai/gpt-3.5-turbo-instruct | paid\nopenai/gpt-4 | paid\nopenai/gpt-4-0314 | paid\nopenai/gpt-4-32k | paid\nopenai/gpt-4-32k-0314 | paid\nopenai/gpt-4-turbo | paid\nopenai/gpt-4-1106-preview | paid\nopenai/gpt-4-turbo-preview | paid\nopenai/gpt-4o | paid\nopenai/gpt-4o-2024-05-13 | paid\nopenai/gpt-4o-2024-08-06 | paid\nopenai/gpt-4o-2024-11-20 | paid\nopenai/gpt-4o:extended | paid\nopenai/gpt-4o-mini | paid\nopenai/gpt-4o-mini-2024-07-18 | paid\nopenai/o1 | paid\nopenai/o1-mini | paid\nopenai/o1-mini-2024-09-12 | paid\nopenai/o1-preview | paid\nopenai/o1-preview-2024-09-12 | paid\nopenchat/openchat-7b | paid\nopenchat/openchat-7b:free | free\nteknium/openhermes-2.5-mistral-7b | paid\nperplexity/llama-3.1-sonar-huge-128k-online | paid\nperplexity/llama-3.1-sonar-large-128k-chat | paid\nperplexity/llama-3.1-sonar-large-128k-online | paid\nperplexity/llama-3.1-sonar-small-128k-chat | paid\nperplexity/llama-3.1-sonar-small-128k-online | paid\nperplexity/llama-3-sonar-large-32k-chat | paid\nperplexity/llama-3-sonar-large-32k-online | paid\nperplexity/llama-3-sonar-small-32k-chat | paid\npygmalionai/mythalion-13b | paid\nqwen/qwen-2-72b-instruct | paid\nqwen/qwen-2-7b-instruct | paid\nqwen/qwen-2-7b-instruct:free | free\nqwen/qvq-72b-preview | paid\nqwen/qwq-32b-preview | paid\nqwen/qwen-2-vl-72b-instruct | paid\nqwen/qwen-2-vl-7b-instruct | paid\nqwen/qwen-2.5-72b-instruct | paid\nqwen/qwen-2.5-7b-instruct | paid\nqwen/qwen-2.5-coder-32b-instruct | paid\nundi95/remm-slerp-l2-13b | paid\nundi95/remm-slerp-l2-13b:extended | paid\nthedrummer/rocinante-12b | paid\nsao10k/l3-lunaris-8b | paid\nsao10k/l3-euryale-70b | paid\nsao10k/l3.1-70b-hanami-x1 | paid\nsao10k/l3.1-euryale-70b | paid\nsao10k/l3.3-euryale-70b | paid\nraifle/sorcererlm-8x22b | paid\nundi95/toppy-m-7b | paid\nundi95/toppy-m-7b:free | free\nundi95/toppy-m-7b:nitro | paid\nthedrummer/unslopnemo-12b | paid\nmicrosoft/wizardlm-2-7b | paid\nmicrosoft/wizardlm-2-8x22b | paid\nx-ai/grok-2-1212 | paid\nx-ai/grok-2-vision-1212 | paid\nx-ai/grok-beta | paid\nx-ai/grok-vision-beta | paid\nxwin-lm/xwin-lm-70b | paid\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m OpenAI models:\u001b[22m\u001b[39m\n\u001b[35m\u001b[1m\u001b[22m\u001b[39m\nbabbage-002\nchatgpt-4o-latest\ndall-e-2\ndall-e-3\ndavinci-002\ngpt-3.5-turbo\ngpt-3.5-turbo-0125\ngpt-3.5-turbo-1106\ngpt-3.5-turbo-16k\ngpt-3.5-turbo-instruct\ngpt-3.5-turbo-instruct-0914\ngpt-4\ngpt-4-0125-preview\ngpt-4-0613\ngpt-4-1106-preview\ngpt-4-1106-vision-preview\ngpt-4-turbo\ngpt-4-turbo-2024-04-09\ngpt-4-turbo-preview\ngpt-4-vision-preview\ngpt-4o\ngpt-4o-2024-05-13\ngpt-4o-2024-08-06\ngpt-4o-2024-11-20\ngpt-4o-audio-preview\ngpt-4o-audio-preview-2024-10-01\ngpt-4o-audio-preview-2024-12-17\ngpt-4o-mini\ngpt-4o-mini-2024-07-18\ngpt-4o-mini-audio-preview\ngpt-4o-mini-audio-preview-2024-12-17\ngpt-4o-mini-realtime-preview\ngpt-4o-mini-realtime-preview-2024-12-17\ngpt-4o-realtime-preview\ngpt-4o-realtime-preview-2024-10-01\ngpt-4o-realtime-preview-2024-12-17\no1-mini\no1-mini-2024-09-12\no1-preview\no1-preview-2024-09-12\nomni-moderation-2024-09-26\nomni-moderation-latest\ntext-embedding-3-large\ntext-embedding-3-small\ntext-embedding-ada-002\ntts-1\ntts-1-1106\ntts-1-hd\ntts-1-hd-1106\nwhisper-1\n-----\n"
        },
        "router": {
          "type": "string",
          "default": "openrouter",
          "description": "Router to use: openai or openrouter"
        },
        "mode": {
          "type": "string",
          "enum": [
            "completion",
            "tools",
            "assistant"
          ],
          "default": "tools",
          "description": "Chat completion mode:\n\t completion, tools, assistant.\n          \u001b[32m\u001b[1mcompletion\u001b[22m\u001b[39m: no support for tools, please use --dst parameter to save the output.\n          \u001b[32m\u001b[1mtools\u001b[22m\u001b[39m: allows for tools to be used, eg 'save to ./output.md'. Not all models support this mode.\n          \u001b[32m\u001b[1massistant\u001b[22m\u001b[39m: : allows documents (PDF, DOCX, ...) to be added but dont support tools. Use --dst to save the output. Supported files :\n      "
        },
        "logLevel": {
          "type": "number",
          "default": 2,
          "description": "Logging level for the application"
        },
        "profile": {
          "type": "string",
          "description": "Path to profile for variables. Supports environment variables."
        },
        "config": {
          "type": "string",
          "description": "Path to JSON configuration file (API keys). Supports environment variables."
        },
        "dump": {
          "type": "string",
          "description": "Create a script"
        },
        "preferences": {
          "type": "string",
          "default": "./.kbot/preferences.md",
          "description": "Path to preferences file, eg: location, your email address, gender, etc. Supports environment variables."
        },
        "logs": {
          "type": "string",
          "default": "./.kbot",
          "description": "Logging directory"
        },
        "env": {
          "type": "string",
          "default": "default",
          "description": "Environment (in profile)"
        },
        "variables": {
          "type": "object",
          "additionalProperties": {
            "type": "string"
          },
          "default": {}
        },
        "filters": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "JSON",
                  "JSONUnescape",
                  "JSONPretty",
                  "AlphaSort",
                  "code",
                  "JSONParse",
                  "trim"
                ]
              }
            },
            {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            {
              "type": "array"
            }
          ],
          "default": "",
          "description": "List of filters to apply to the output.\n         Used only in completion mode and a given output file specified with --dst. \n         It unwraps by default any code or data in Markdown. \n         Choices:\n\tJSON,JSONUnescape,JSONPretty,AlphaSort,code,JSONParse,trim\n"
        },
        "dry": {
          "anyOf": [
            {
              "type": "boolean"
            },
            {
              "type": "string"
            }
          ],
          "default": false,
          "description": "Dry run - only write out parameters without making API calls"
        }
      },
      "additionalProperties": true,
      "description": "IKBotOptions"
    }
  },
  "$schema": "http://json-schema.org/draft-07/schema#"
};


const formData = {
  title: 'First task',
  done: true,
};

const Application: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [darkTheme, setDarkTheme] = useState(true);
  const [versions, setVersions] = useState<Record<string, string>>({});

  /**
   * On component mount
   */
  useEffect(() => {
    const useDarkTheme = parseInt(localStorage.getItem('dark-mode'));
    if (isNaN(useDarkTheme)) {
      setDarkTheme(true);
    } else if (useDarkTheme == 1) {
      setDarkTheme(true);
    } else if (useDarkTheme == 0) {
      setDarkTheme(false);
    }

    // Apply verisons
    const app = document.getElementById('app');
    const versions = JSON.parse(app.getAttribute('data-versions'));
    setVersions(versions);
  }, []);

  /**
   * On Dark theme change
   */
  useEffect(() => {
    if (darkTheme) {
      localStorage.setItem('dark-mode', '1');
      document.body.classList.add('dark-mode');
    } else {
      localStorage.setItem('dark-mode', '0');
      document.body.classList.remove('dark-mode');
    }
  }, [darkTheme]);

  /**
   * Toggle Theme
   */
  function toggleTheme() {
    setDarkTheme(!darkTheme);
  }

  return (
    <div id='erwt'>
      <div className='header'>
        <div className='main-heading'>
          <h1 className='themed'>ERWT - Electron Boilerplate</h1>
        </div>
        <Form schema={schema} uiSchema={uiSchema} formData={formData} validator={validator} />
        
      </div>

      <div className='footer'>
        <div className='center'>
          <button
            onClick={() => {
              if (counter > 99) return alert('Going too high!!');
              setCounter(counter + 1);
            }}
          >
            Increment {counter != 0 ? counter : ''} <span>{counter}</span>
          </button>
          &nbsp;&nbsp; &nbsp;&nbsp;
          <button
            onClick={() => {
              if (counter == 0) return alert('Oops.. thats not possible!');
              setCounter(counter > 0 ? counter - 1 : 0);
            }}
          >
            Decrement <span>{counter}</span>
          </button>
          &nbsp;&nbsp; &nbsp;&nbsp;
          <button onClick={toggleTheme}>
            {darkTheme ? 'Light Theme' : 'Dark Theme'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Application;
