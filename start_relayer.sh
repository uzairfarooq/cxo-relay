#!/bin/bash
while true; do
    nohup /home/ec2-user/cxo-relay/dist-cli/src/main-cli.js --key "key here" --relayUrl https://cargox.digital/api/v3/relay/ --rpcUrl https://polygon-rpc.com/ --rewardAddr 0x4bac676416e1eef1e754c2f9b12b798d4e5dd536 > /home/ec2-user/cxo-relay/cxo_relayer.txt 2>&1
    sleep 1  # Adjust this delay based on your needs
done
