// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RoyalNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
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

    event Minted(address indexed minter, uint256 indexed tokenId, uint256 amountPaid, address indexed referral);
    event ReferralRewardPaid(address indexed referrer, uint256 amount);
    event BaseURIUpdated(string newBaseURI);
    event MintPriceUpdated(uint256 newPrice);
    event MintWindowUpdated(uint256 startTime, uint256 endTime);

    struct CollectionParams {
        string name;
        string symbol;
        string contractURI;
        string baseURI;
        string unrevealedURI;
        uint256 maxSupply;
        uint256 mintPrice;
        uint256 maxMintPerWallet;
        uint64 mintStart;
        uint64 mintEnd;
        uint64 revealTime;
        address royaltyReceiver;
        uint96 royaltyBps;
        bytes32 allowlistRoot;
    }

    constructor(CollectionParams memory p) ERC721(p.name, p.symbol) Ownable(msg.sender) {
        require(p.royaltyBps <= 1000, "Invalid royalty");
        require(p.royaltyReceiver != address(0), "Invalid address");
        mintPrice = p.mintPrice;
        mintStartTime = p.mintStart;
        mintEndTime = p.mintEnd;
        baseTokenURI = p.baseURI;
        royaltyPercentage = p.royaltyBps;
        royaltyRecipient = p.royaltyReceiver;
    }

    function mint(uint256 quantity, address referral) external payable nonReentrant {
        require(block.timestamp >= mintStartTime, "Mint not started");
        require(block.timestamp <= mintEndTime, "Mint ended");
        require(_tokenIdCounter + quantity <= MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            _safeMint(msg.sender, tokenId);
        }

        if (referral != address(0) && referral != msg.sender) {
            referralMints[referral] += quantity;
            uint256 reward = (msg.value * 50) / 1000;
            referralRewards[referral] += reward;
        }

        emit Minted(msg.sender, _tokenIdCounter - 1, msg.value, referral);
    }

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
        require(balance > 0, "No balance");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    function withdrawReferralRewards(address referrer) external nonReentrant {
        uint256 reward = referralRewards[referrer];
        require(reward > 0, "No rewards");
        referralRewards[referrer] = 0;
        (bool success, ) = payable(referrer).call{value: reward}("");
        require(success, "Withdraw failed");
        emit ReferralRewardPaid(referrer, reward);
    }

    function totalMinted() external view returns (uint256) { return _tokenIdCounter; }
    function remainingSupply() external view returns (uint256) { return MAX_SUPPLY - _tokenIdCounter; }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId), ".json"));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function royaltyInfo(uint256, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        royaltyAmount = (salePrice * royaltyPercentage) / 10000;
        return (royaltyRecipient, royaltyAmount);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
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

contract NFTFactory is Ownable, ReentrancyGuard {
    uint256 public deploymentFee = 0.0001 ether;
    address public feeRecipient;
    
    mapping(address => bool) public isWhitelistedCreator;
    mapping(address => uint256) public creatorDeployments;
    
    event CollectionCreated(address indexed creator, address indexed collection, string name, string symbol);
    event DeploymentFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    event CreatorWhitelisted(address indexed creator, bool whitelisted);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    function createCollection(CollectionParams memory p) external payable nonReentrant returns (address) {
        require(msg.value >= deploymentFee, "Insufficient deployment fee");
        require(bytes(p.name).length > 0, "Name required");
        require(bytes(p.symbol).length > 0, "Symbol required");
        
        RoyalNFT collection = new RoyalNFT(p);
        collection.transferOwnership(msg.sender);
        
        creatorDeployments[msg.sender]++;
        
        emit CollectionCreated(msg.sender, address(collection), p.name, p.symbol);
        
        // Transfer fee to recipient
        if (deploymentFee > 0) {
            (bool success, ) = payable(feeRecipient).call{value: deploymentFee}("");
            require(success, "Fee transfer failed");
        }
        
        // Refund excess ETH
        if (msg.value > deploymentFee) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - deploymentFee}("");
            require(success, "Refund failed");
        }
        
        return address(collection);
    }

    function setDeploymentFee(uint256 _fee) external onlyOwner {
        deploymentFee = _fee;
        emit DeploymentFeeUpdated(_fee);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    function setCreatorWhitelist(address creator, bool whitelisted) external onlyOwner {
        isWhitelistedCreator[creator] = whitelisted;
        emit CreatorWhitelisted(creator, whitelisted);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
