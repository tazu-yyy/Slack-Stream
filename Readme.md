# Slack Stream
## Introduction
Ever had a trouble clicking the Slack window so many times to find the conversation you are looking for?

Slack Stream, an all-at-a-glance slack client, is just for you!

It shows all the messages of all the channels from all the teams you belong to in a single window.

![SS](https://github.com/KongariBug/Slack-Stream/blob/master/images/slackstream.png)

## Features
- Everything shown in a single window
- Multi-platform. Runs in Windows, Mac and Linux
- Multiple teams supported
- Select one channel to focus on it
- Smooth transition between Slack Stream and the official client
- Message posting
- Easily input emojis
- Web sites and images thumbnailed

## How to use
1. [Get your Slack token(s)](https://api.slack.com/custom-integrations/legacy-tokens)
2. Install Node.js
3. Git clone this repository and run the following commands

```shell
cd path-to-this-reposritory
npm install

# Set your api token(s)
cp src/ts/token.ts.sample src/ts/token.ts
vi src/ts/token.ts

gulp build
gulp cp-lib
electron .
```
