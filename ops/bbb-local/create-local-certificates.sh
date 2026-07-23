#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y openssl

install -d -m 0700 /local/certs

if [[ ! -f /local/certs/kaynak-akademi-local-ca.key ]]; then
  openssl genrsa \
    -out /local/certs/kaynak-akademi-local-ca.key \
    4096
fi

if [[ ! -f /local/certs/kaynak-akademi-local-ca.crt ]]; then
  openssl req \
    -x509 \
    -new \
    -sha256 \
    -days 3650 \
    -key /local/certs/kaynak-akademi-local-ca.key \
    -subj "/C=TR/O=Kaynak Akademi/OU=Yerel Pilot/CN=Kaynak Akademi Yerel CA" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    -out /local/certs/kaynak-akademi-local-ca.crt
fi

openssl genrsa \
  -out /local/certs/privkey.pem \
  2048

openssl req \
  -new \
  -sha256 \
  -key /local/certs/privkey.pem \
  -config /mnt/c/Repos/kaynakakademi/ops/bbb-local/openssl-bbb.cnf \
  -out /local/certs/bbb.localhost.csr

openssl x509 \
  -req \
  -sha256 \
  -days 365 \
  -in /local/certs/bbb.localhost.csr \
  -CA /local/certs/kaynak-akademi-local-ca.crt \
  -CAkey /local/certs/kaynak-akademi-local-ca.key \
  -CAcreateserial \
  -extensions req_extensions \
  -extfile /mnt/c/Repos/kaynakakademi/ops/bbb-local/openssl-bbb.cnf \
  -out /local/certs/bbb.localhost.crt

install -m 0644 \
  /local/certs/bbb.localhost.crt \
  /local/certs/fullchain.pem

chmod 0600 \
  /local/certs/kaynak-akademi-local-ca.key \
  /local/certs/privkey.pem

openssl verify \
  -CAfile /local/certs/kaynak-akademi-local-ca.crt \
  /local/certs/fullchain.pem
