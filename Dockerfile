FROM node:latest
# Make sure we use use fresh packages
RUN apt-get update && apt-get install -y curl openssh-client

# add the authorized host key for github (avoids "Host key verification failed")
RUN mkdir ~/.ssh && ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# Location of saved ssh key
ENV PRIVATE_KEY /root/.ssh/ba_common_git

# Getting ssh key
RUN curl http://${API_URI}/v1/secrets/env/ba_common_git -o $PRIVATE_KEY -v \
&& chmod 0600 $PRIVATE_KEY

# Starting packages installing
RUN npm install yarn -G
WORKDIR /app
COPY package.json /app
COPY . /app
# Due to (security) limitations of ssh agent, 
# we need to maintain ssh agent until yarn is done with installing
RUN eval "$(ssh-agent)" ssh-add $PRIVATE_KEY \ 
&& yarn install

# We only want to compile files during image creation phase
RUN yarn build
CMD yarn start

EXPOSE 3000
