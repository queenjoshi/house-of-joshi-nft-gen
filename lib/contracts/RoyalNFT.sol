// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RoyalNFT
 * @notice A generative NFT collection contract with minting, royalties, and referral support.
 * @dev Deployed via Royal Mint launchpad on Base.
 */
contract RoyalNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    // ============ Errors ============
    error RoyalNFT__MintNotStarted();
    error RoyalNFT__MintEnded();
    error RoyalNFT__MaxSupplyReached();
    error RoyalNFT__InsufficientPayment();
    error RoyalNFT__WithdrawFailed();
    error RoyalNFT__InvalidAmount();
    error RoyalNFT__InvalidAddress();
    error RoyalNFT__TokenDoesNotExist();

    // ============ State Variables ============
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice;
    uint256 public mintStartTime;
    uint256 public mintEndTime;
    string public baseTokenURI;
    uint96 public royaltyPercentage;
    address public royaltyRecipient;

    uint256 private _tokenIdCounter;
    mapping(address => uint256) public referralMints;
    mapping(address => uint256) public referralRewards;

    // ============ Events ============
    event Minted(
        address indexed minter,
        uint256 indexed tokenId,
        uint256 amountPaid,
        address indexed referral
    );
    event ReferralRewardPaid(address indexed referrer, uint256 amount);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPrice);
    event MintWindowUpdated(uint256 startTime, uint256 endTime);

    // ============ Constructor ============
    constructor(
        string memory name,
        string memory symbol,
        uint256 _mintPrice,
        uint256 _mintStartTime,
        uint256 _mintEndTime,
        string memory _baseTokenURI,
        uint96 _royaltyPercentage,
        address _royaltyRecipient,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        if (_royaltyPercentage > 1000) revert RoyalNFT__InvalidAmount();
        if (_royaltyRecipient == address(0)) revert RoyalNFT__InvalidAddress();

        mintPrice = _mintPrice;
        mintStartTime = _mintStartTime;
        mintEndTime = _mintEndTime;
        baseTokenURI = _baseTokenURI;
        royaltyPercentage = _royaltyPercentage;
        royaltyRecipient = _royaltyRecipient;
    }

    // ============ Minting ============
    /**
     * @notice Mint NFTs with optional referral.
     * @param quantity Number of NFTs to mint.
     * @param referral Address of referrer (address(0) for none).
     */
    function mint(uint256 quantity, address referral) external payable nonReentrant {
        if (block.timestamp < mintStartTime) revert RoyalNFT__MintNotStarted();
        if (block.timestamp > mintEndTime) revert RoyalNFT__MintEnded();
        if (_tokenIdCounter + quantity > MAX_SUPPLY) revert RoyalNFT__MaxSupplyReached();
        if (msg.value < mintPrice * quantity) revert RoyalNFT__InsufficientPayment();

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _safeMint(msg.sender, tokenId);
        }

        if (referral != address(0) && referral != msg.sender) {
            referralMints[referral] += quantity;
            uint256 reward = (msg.value * 50) / 1000; // 5% referral
            referralRewards[referral] += reward;
        }

        emit Minted(msg.sender, _tokenIdCounter - 1, msg.value, referral);
    }

    // ============ Admin Functions ============
    function setBaseURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
        emit BaseURIUpdated(_baseTokenURI);
    }

    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;
        emit MintPriceUpdated(_mintPrice);
    }

    function setMintWindow(uint256 _mintStartTime, uint256 _mintEndTime) external onlyOwner {
        mintStartTime = _mintStartTime;
        mintEndTime = _mintEndTime;
        emit MintWindowUpdated(_mintStartTime, _mintEndTime);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert RoyalNFT__InvalidAmount();

        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert RoyalNFT__WithdrawFailed();
    }

    function withdrawReferralRewards(address referrer) external nonReentrant {
        uint256 reward = referralRewards[referrer];
        if (reward == 0) revert RoyalNFT__InvalidAmount();

        referralRewards[referrer] = 0;

        (bool success, ) = payable(referrer).call{value: reward}("");
        if (!success) revert RoyalNFT__WithdrawFailed();

        emit ReferralRewardPaid(referrer, reward);
    }

    // ============ View Functions ============
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        if (!_exists(tokenId)) revert RoyalNFT__TokenDoesNotExist();
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId), ".json"));
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ============ Royalty ============
    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        royaltyAmount = (salePrice * royaltyPercentage) / 10000;
        return (royaltyRecipient, royaltyAmount);
    }

    // ============ Internal ============
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    receive() external payable {}
}
