import React from 'react';
import {LAMPORTS_PER_SOL} from '@solana/web3.js';
import {Text, TouchableOpacity} from 'react-native';

function convertLamportsToSOL(lamports) {
  return new Intl.NumberFormat(undefined, {maximumFractionDigits: 1}).format(
    (lamports || 0) / LAMPORTS_PER_SOL,
  );
}

const LAMPORTS_PER_AIRDROP = 1000000000;

export default function RequestAirdropButton({onRequestAirdrop}) {
  return (
    <TouchableOpacity
      className="bg-[#6495ED] rounded-full px-3 py-1"
      onPress={onRequestAirdrop}>
      <Text className="text-white text-xs font-medium">Request Airdrop</Text>
    </TouchableOpacity>
  );
}
