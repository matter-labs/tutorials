# Use Ubuntu 18.04 as the base image with x86_64
FROM ubuntu:18.04@sha256:dca176c9663a7ba4c1f0e710986f5a25e672842963d95b960191e2d9f7185ebe

# Install necessary dependencies
RUN apt-get update && \
    apt-get install -y wget curl gnupg2 && \
    echo "deb http://security.ubuntu.com/ubuntu bionic-security main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y libssl1.0.0 && \
    apt-get install -y cmake pkg-config clang socat

# Fetch and extract the era_test_node binary
RUN wget https://github.com/matter-labs/era-test-node/releases/download/v0.1.0/era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz \
    && mv era_test_node /usr/local/bin/ \
    && rm era_test_node-v0.1.0-x86_64-unknown-linux-gnu.tar.gz

# Copy the start script
COPY start_script.sh /start_script.sh

# Make the start script executable
RUN chmod +x /start_script.sh

# Set the start script as the entry point
ENTRYPOINT ["/start_script.sh"]