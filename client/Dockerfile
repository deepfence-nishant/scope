FROM node:8.4.0
WORKDIR /home/weave
ADD . /home/weave/
ENV NPM_CONFIG_LOGLEVEL=warn NPM_CONFIG_PROGRESS=false
RUN cd /home/weave && yarn --pure-lockfile
RUN cd /home/weave && yarn run build