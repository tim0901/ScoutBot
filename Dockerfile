FROM node:19-alpine
LABEL name "Scoutbot Discord bot"

RUN mkdir /code

WORKDIR /code

RUN npm install --force discord.js dotenv

COPY . /code

CMD ["node", "--enable-source-maps", "./bot.js"]
