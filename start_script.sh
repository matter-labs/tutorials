#!/bin/bash

ARG1_DEFAULT="8011"
ARG2_DEFAULT="testnet"

PORT="${1:-$ARG1_DEFAULT}"
NETWORK="${2:-$ARG2_DEFAULT}"

socat TCP-LISTEN:"$PORT",fork,reuseaddr TCP:127.0.0.1:3051 </dev/null &
era_test_node --port 3051 fork "$NETWORK" &
wait
