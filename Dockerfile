FROM node:18.19.0-bullseye

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

RUN apt-get update && \
    apt install -y build-essential git cmake pkg-config node-pre-gyp vim \
               libbz2-dev libxml2-dev libzip-dev libboost-all-dev \
               lua5.2 liblua5.2-dev libtbb-dev

RUN npm install -g node-pre-gyp

WORKDIR /home/node/
COPY *.json ./
RUN npm install

COPY src/ ./src/
COPY bin/ ./bin/
RUN npm pack

FROM node:18.19.0-bullseye

RUN apt-get update && \
    apt install -y libbz2-dev libxml2-dev libzip-dev libboost-all-dev \
               lua5.2 liblua5.2-dev libtbb-dev \
               vim

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /home/node/
USER node
COPY --from=0 /home/node/*.tgz .

RUN npm install -g node-pre-gyp && \
    npm install -g *.tgz

ENTRYPOINT ["shst"]
CMD ["--help"]
