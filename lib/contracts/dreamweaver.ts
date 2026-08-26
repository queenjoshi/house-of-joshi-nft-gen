import { parseAbi } from 'viem';
import { CONTRACTS } from '@/lib/config';

export const DREAMWEAVER_ADDRESS = CONTRACTS.DREAMWEAVER;
export const DREAMWEAVER_SIGNER_ADDRESS = CONTRACTS.DREAMWEAVER_SIGNER;
export const DREAMWEAVER_CHAIN_ID = 8453 as const;

export const DREAMWEAVER_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function owner() view returns (address)',
  'function authorizedSigner() view returns (address)',
  'function feeRecipient() view returns (address)',
  'function productionPrice() view returns (uint256)',
  'function nextTokenId() view returns (uint256)',
  'function paused() view returns (bool)',
  'function usedPreviewIds(bytes32 previewId) view returns (bool)',
  'function voucherDigest((address recipient,string tokenURI,bytes32 previewId,uint256 price,uint256 deadline) voucher) view returns (bytes32)',
  'function mintWithVoucher((address recipient,string tokenURI,bytes32 previewId,uint256 price,uint256 deadline) voucher, bytes signature) payable returns (uint256 tokenId)',
  'function royaltyInfo(uint256 tokenId,uint256 salePrice) view returns (address receiver,uint256 royaltyAmount)',
  'event DreamweaverMinted(address indexed recipient,uint256 indexed tokenId,bytes32 indexed previewId,string tokenURI,uint256 price)',
]);

export const DREAMWEAVER_EIP712_DOMAIN = {
  name: 'The House of Joshi: Dreamweaver',
  version: '1',
  chainId: DREAMWEAVER_CHAIN_ID,
  verifyingContract: DREAMWEAVER_ADDRESS,
} as const;

export const DREAMWEAVER_VOUCHER_TYPES = {
  MintVoucher: [
    { name: 'recipient', type: 'address' },
    { name: 'tokenURI', type: 'string' },
    { name: 'previewId', type: 'bytes32' },
    { name: 'price', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export type DreamweaverMintVoucher = {
  recipient: `0x${string}`;
  tokenURI: string;
  previewId: `0x${string}`;
  price: bigint;
  deadline: bigint;
};
