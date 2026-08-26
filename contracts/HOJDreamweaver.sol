// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title House of Joshi Dreamweaver
/// @notice Shared ERC-721 contract for paid, AI-produced one-of-one NFTs.
/// @dev The backend signs a voucher only after producing and pinning the final asset.
///      The recipient submits the voucher and pays the production fee themselves.
contract HOJDreamweaver is
    ERC721URIStorage,
    ERC2981,
    Ownable2Step,
    Pausable,
    ReentrancyGuard,
    EIP712
{
    using ECDSA for bytes32;

    address public constant HOUSE_WALLET = 0x6736d2eA9807297F0e56967361B9410854B86a5f;
    uint256 public constant DEFAULT_PRODUCTION_PRICE = 0.015 ether;
    uint96 public constant DEFAULT_ROYALTY_BPS = 500;
    uint96 public constant MAX_ROYALTY_BPS = 1_000;

    bytes32 public constant MINT_VOUCHER_TYPEHASH = keccak256(
        "MintVoucher(address recipient,string tokenURI,bytes32 previewId,uint256 price,uint256 deadline)"
    );

    struct MintVoucher {
        address recipient;
        string tokenURI;
        bytes32 previewId;
        uint256 price;
        uint256 deadline;
    }

    uint256 private _nextTokenId = 1;
    address public authorizedSigner;
    address payable public feeRecipient;
    uint256 public productionPrice;

    mapping(bytes32 previewId => bool used) public usedPreviewIds;

    event DreamweaverMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        bytes32 indexed previewId,
        string tokenURI,
        uint256 price
    );
    event AuthorizedSignerUpdated(address indexed previousSigner, address indexed newSigner);
    event FeeRecipientUpdated(address indexed previousRecipient, address indexed newRecipient);
    event ProductionPriceUpdated(uint256 previousPrice, uint256 newPrice);
    event DefaultRoyaltyUpdated(address indexed receiver, uint96 feeNumerator);

    error InvalidRecipient();
    error InvalidSigner();
    error InvalidFeeRecipient();
    error InvalidPreviewId();
    error VoucherExpired();
    error VoucherAlreadyUsed();
    error IncorrectPayment();
    error PriceBelowMinimum();
    error InvalidSignature();
    error InvalidRoyalty();
    error FeeTransferFailed();

    constructor(address initialAuthorizedSigner)
        ERC721("The House of Joshi: Dreamweaver", "HOJDW")
        Ownable(msg.sender)
        EIP712("The House of Joshi: Dreamweaver", "1")
    {
        if (initialAuthorizedSigner == address(0)) revert InvalidSigner();

        authorizedSigner = initialAuthorizedSigner;
        feeRecipient = payable(HOUSE_WALLET);
        productionPrice = DEFAULT_PRODUCTION_PRICE;
        _setDefaultRoyalty(HOUSE_WALLET, DEFAULT_ROYALTY_BPS);
    }

    /// @notice Mint the final NFT represented by a backend-signed production voucher.
    function mintWithVoucher(MintVoucher calldata voucher, bytes calldata signature)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 tokenId)
    {
        if (voucher.recipient == address(0) || msg.sender != voucher.recipient) revert InvalidRecipient();
        if (voucher.previewId == bytes32(0)) revert InvalidPreviewId();
        if (block.timestamp > voucher.deadline) revert VoucherExpired();
        if (usedPreviewIds[voucher.previewId]) revert VoucherAlreadyUsed();
        if (voucher.price < productionPrice) revert PriceBelowMinimum();
        if (msg.value != voucher.price) revert IncorrectPayment();
        if (_recoverVoucherSigner(voucher, signature) != authorizedSigner) revert InvalidSignature();

        usedPreviewIds[voucher.previewId] = true;
        tokenId = _nextTokenId++;

        _safeMint(voucher.recipient, tokenId);
        _setTokenURI(tokenId, voucher.tokenURI);

        (bool success, ) = feeRecipient.call{value: msg.value}("");
        if (!success) revert FeeTransferFailed();

        emit DreamweaverMinted(
            voucher.recipient,
            tokenId,
            voucher.previewId,
            voucher.tokenURI,
            voucher.price
        );
    }

    function voucherDigest(MintVoucher calldata voucher) external view returns (bytes32) {
        return _voucherDigest(voucher);
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    function setAuthorizedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidSigner();
        address previousSigner = authorizedSigner;
        authorizedSigner = newSigner;
        emit AuthorizedSignerUpdated(previousSigner, newSigner);
    }

    function setFeeRecipient(address payable newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert InvalidFeeRecipient();
        address previousRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(previousRecipient, newRecipient);
    }

    function setProductionPrice(uint256 newPrice) external onlyOwner {
        uint256 previousPrice = productionPrice;
        productionPrice = newPrice;
        emit ProductionPriceUpdated(previousPrice, newPrice);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        if (receiver == address(0)) revert InvalidRecipient();
        if (feeNumerator > MAX_ROYALTY_BPS) revert InvalidRoyalty();
        _setDefaultRoyalty(receiver, feeNumerator);
        emit DefaultRoyaltyUpdated(receiver, feeNumerator);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Recover ETH sent outside the mint flow.
    function recoverETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        (bool success, ) = feeRecipient.call{value: balance}("");
        if (!success) revert FeeTransferFailed();
    }

    function _recoverVoucherSigner(MintVoucher calldata voucher, bytes calldata signature)
        internal
        view
        returns (address)
    {
        return _voucherDigest(voucher).recover(signature);
    }

    function _voucherDigest(MintVoucher calldata voucher) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_VOUCHER_TYPEHASH,
                voucher.recipient,
                keccak256(bytes(voucher.tokenURI)),
                voucher.previewId,
                voucher.price,
                voucher.deadline
            )
        );
        return _hashTypedDataV4(structHash);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
