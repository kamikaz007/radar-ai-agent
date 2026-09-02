const { rpc } = require('@stellar/stellar-sdk');

const RPC_URL = 'https://rpc.testnet.minepi.com';
const CONTRACT_IDS = [
  'cdecb3523dd071f4f9d13da0fc7ff471d1d0e36c2af91e351b5bfb7096e7cb75',
  '3ebba09660ef26018ab3027bbedcbecc8b30955ebd50542a5c23b72be2751c16',
  'f7b1f0b04060f39b267db93ead357eeac02d79a5b45ad7abcf225792335ffc13',
  '64315459a735bf2fed0625b6386dc64cc0743a7b6b22a58719dc0699aadf165d',
  'e70fa02784cf1227f10f997bacfc43e5f528d7686057518f07364d75bbc3c532',
  'b0ea609b7e6fd9e1f774a39c03ba72a9e766d7d8d6174ee315cf954e4d640b24',
  'ca40b5b202e40573b7856078aeb21a2a97521b015669c340790b4a555c413240',
  'b3e99ad9f950c0badb68936bacdd44bc03dc1ff287b1a6b3e8b0fb1d2248a763',
  'efe232b5e3f56d7b7d70632d06f2dd2b65924050ef9354526405dba795574c93',
  '11a8a5823b5a48d6ccbcc76de3b51dfa33f1deea8bac0816f8f3c421bf64f3ca',
];

function toHexString(byteArray) {
  return Buffer.from(byteArray).toString('hex');
}

async function inspectContract(server, contractIdHex) {
  console.log(`\n=== Contract: ${contractIdHex} ===`);
  try {
    // الحصول على طرق العقد
    const methods = await server.getContractMethods(contractIdHex);
    console.log('Methods:');
    if (methods && methods.methods) {
      for (const m of methods.methods) {
        console.log(' -', m.name, '=>', m.kind, '(', m.inputs?.map(i => i.type).join(', ') || '', ')');
      }
    } else {
      console.log('  (no methods found)');
    }
  } catch (e) {
    console.log('  Error fetching methods:', e.message);
  }

  // محاولة جلب بيانات العقد (مفاتيح شائعة)
  try {
    // بعض العقود تخزن بيانات مثل 'reserves' أو 'token0'...
    // هنا نستعرض بعض المفاتيح الشائعة إن أمكن، لكن نكتفي بالطرق.
  } catch (e) {}

  // جلب بيانات العقد العامة (metadata)
  try {
    const instance = await server.getContractInstance(contractIdHex);
    console.log('Instance info:', instance);
  } catch (e) {
    console.log('  Error fetching instance:', e.message);
  }
}

async function main() {
  const server = new rpc.Server(RPC_URL);
  for (const id of CONTRACT_IDS) {
    await inspectContract(server, id);
  }
}

main();
