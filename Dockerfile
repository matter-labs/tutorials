## Use Ubuntu 18.04 as the base image with x86_64
#FROM ubuntu:18.04@sha256:dca176c9663a7ba4c1f0e710986f5a25e672842963d95b960191e2d9f7185ebe
#
## Install necessary dependencies
#RUN apt-get update \
#    && apt-get install -y wget curl gnupg2 \
#    && echo "deb http://security.ubuntu.com/ubuntu bionic-security main" >> /etc/apt/sources.list \
#    && apt-get update \
#    && apt-get install -y libssl1.0.0 \
#    && apt-get install -y cmake pkg-config clang socat
#
## Fetch and extract the era_test_node binary
#RUN wget https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz \
#    && tar -xzf era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz \
#    && mv era_test_node /usr/local/bin/ \
#    && rm era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz
#
## Define ARG1_DEFAULT and ARG2_DEFAULT
#ARG ARG1_DEFAULT="8011"
#ARG ARG2_DEFAULT="testnet"
#
## Define PORT and NETWORK
#ENV PORT=${PORT:-$ARG1_DEFAULT}
#ENV NETWORK=${NETWORK:-$ARG2_DEFAULT}
#
## Run the socat and era_test_node commands
#CMD socat TCP-LISTEN:"$PORT",fork,reuseaddr TCP:127.0.0.1:"$PORT" </dev/null & \
#    && era_test_node --port "$PORT" fork "$NETWORK" \
#    && wait
# Use Ubuntu 18.04 as the base image with x86_64
FROM ubuntu:18.04@sha256:dca176c9663a7ba4c1f0e710986f5a25e672842963d95b960191e2d9f7185ebe

# Install necessary dependencies, fetch and extract the era_test_node binary
RUN apt-get update \
    && apt-get install -y wget curl gnupg2 \
    && echo "deb http://security.ubuntu.com/ubuntu bionic-security main" >> /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y libssl1.0.0 \
    && apt-get install -y cmake pkg-config clang socat \
    && wget https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz \
    && mv era_test_node /usr/local/bin/ \
    && rm era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz

# Define default values for PORT and NETWORK
ENV PORT=8011
ENV NETWORK=testnet

# Run the socat and era_test_node commands
CMD socat TCP-LISTEN:'$PORT',fork,reuseaddr TCP:127.0.0.1:3051 & era_test_node --port 3051 run & wait
