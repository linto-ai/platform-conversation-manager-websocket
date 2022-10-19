# Conversation manager websocket server

This is the websocket part of the conversation manager, it handles collaborative edition. It's needed by the frontend https://github.com/linto-ai/platform-conversation-manager-front

## 1/ Clone project and install dependencies

```bash
cd your/project/path
git clone git@github.com:linto-ai/platform-conversation-manager-websocket.git
cd platform-conversation-manager-websocket
npm i
```

## 2/ Setup environnement variables

- WEBSERVER_HTTP_PORT: listening port for the websocket server
- API_HOST: url of the Conversation manager api (see https://github.com/linto-ai/platform-conversation-manager)

## 3/ Run without docker

```bash
npm run dev
```
