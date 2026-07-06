// Flattened single-file source code for Basescan verification
// This is the exact source that gets submitted to Basescan for verification

export const ROYAL_NFT_SOURCE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }
    function owner() public view virtual returns (address) {
        return _owner;
    }
    modifier onlyOwner() {
        _checkOwner();
        _;
    }
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// OpenZeppelin Contracts v4.4.1 (security/ReentrancyGuard.sol)
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    constructor() {
        _status = _NOT_ENTERED;
    }
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }
    function _nonReentrantBefore() private {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
    }
    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/IERC721.sol)
interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool _approved) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/IERC721Receiver.sol)
interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/IERC721Metadata.sol)
interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

// OpenZeppelin Contracts v4.4.1 (utils/introspection/IERC165.sol)
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

// OpenZeppelin Contracts v4.4.1 (utils/introspection/ERC165.sol)
abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}

// OpenZeppelin Contracts v4.4.1 (utils/Address.sol)
library Address {
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }
}

// OpenZeppelin Contracts v4.4.1 (utils/Strings.sol)
library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 length;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length);
        for (uint256 i = 2 * length; i > 0; ) {
            buffer[--i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
            buffer[--i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/ERC721.sol)
abstract contract ERC721 is Context, ERC165, IERC721, IERC721Metadata {
    using Address for address;
    using Strings for uint256;
    string private _name;
    string private _symbol;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        return _balances[owner];
    }
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "ERC721: owner query for nonexistent token");
        return owner;
    }
    function name() public view virtual override returns (string memory) {
        return _name;
    }
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, _toString(tokenId))) : "";
    }
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ERC721.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()), "ERC721: approve caller is not owner nor approved for all");
        _approve(to, tokenId);
    }
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        _requireMinted(tokenId);
        return _tokenApprovals[tokenId];
    }
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(_msgSender() != operator, "ERC721: approve to caller");
        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }
    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }
    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, data);
    }
    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal virtual {
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }
    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        address owner = ERC721.ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }
    function _safeMint(address to, uint256 tokenId) internal virtual {
        _safeMint(to, tokenId, "");
    }
    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
        _checkOnERC721Received(address(0), to, tokenId, data);
    }
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");
        _beforeTokenTransfer(address(0), to, tokenId);
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
        _afterTokenTransfer(address(0), to, tokenId);
    }
    function _burn(uint256 tokenId) internal virtual {
        address owner = ERC721.ownerOf(tokenId);
        _beforeTokenTransfer(owner, address(0), tokenId);
        _approve(address(0), tokenId);
        _balances[owner] -= 1;
        delete _owners[tokenId];
        emit Transfer(owner, address(0), tokenId);
        _afterTokenTransfer(owner, address(0), tokenId);
    }
    function _transfer(address from, address to, uint256 tokenId) internal virtual {
        require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");
        _beforeTokenTransfer(from, to, tokenId);
        _approve(address(0), tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
        _afterTokenTransfer(from, to, tokenId);
    }
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(ERC721.ownerOf(tokenId), to, tokenId);
    }
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.isContract()) {
            try return IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) == IERC721Receiver.onERC721Received.selector;
            catch {}
        }
        return true;
    }
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual {}
    function _afterTokenTransfer(address from, address to, uint256 tokenId) internal virtual {}
    function _requireMinted(uint256 tokenId) internal view virtual {
        require(_exists(tokenId), "ERC721: invalid token ID");
    }
    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC721Metadata).interfaceId || super.supportsInterface(interfaceId);
    }
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/IERC721Enumerable.sol)
interface IERC721Enumerable is IERC721 {
    function totalSupply() external view returns (uint256);
    function tokenByIndex(uint256 index) external view returns (uint256);
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/ERC721Enumerable.sol)
abstract contract ERC721Enumerable is ERC721, IERC721Enumerable {
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex;
    uint256[] private _allTokens;
    mapping(uint256 => uint256) private _allTokensIndex;
    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual override returns (uint256) {
        require(index < ERC721.balanceOf(owner), "ERC721Enumerable: owner index out of bounds");
        return _ownedTokens[owner][index];
    }
    function totalSupply() public view virtual override returns (uint256) {
        return _allTokens.length;
    }
    function tokenByIndex(uint256 index) public view virtual override returns (uint256) {
        require(index < ERC721Enumerable.totalSupply(), "ERC721Enumerable: global index out of bounds");
        return _allTokens[index];
    }
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);
    }
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }
        delete _ownedTokensIndex[tokenId];
        _ownedTokens[from].pop();
    }
    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];
        uint256 lastTokenId = _allTokens[lastTokenIndex];
        _allTokens[tokenIndex] = lastTokenId;
        _allTokensIndex[lastTokenId] = tokenIndex;
        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/IERC721URIStorage.sol)
interface IERC721URIStorage is IERC721 {
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/ERC721URIStorage.sol)
abstract contract ERC721URIStorage is ERC721, IERC721URIStorage {
    mapping(uint256 => string) private _tokenURIs;
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, IERC721URIStorage) returns (string memory) {
        _requireMinted(tokenId);
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        return super.tokenURI(tokenId);
    }
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return interfaceId == type(IERC721URIStorage).interfaceId || super.supportsInterface(interfaceId);
    }
}

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

    function createCollection(RoyalNFT.CollectionParams memory p) external payable nonReentrant returns (address) {
        require(msg.value >= deploymentFee, "Insufficient deployment fee");
        require(bytes(p.name).length > 0, "Name required");
        require(bytes(p.symbol).length > 0, "Symbol required");
        
        RoyalNFT collection = new RoyalNFT(p);
        collection.transferOwnership(msg.sender);
        
        creatorDeployments[msg.sender]++;
        
        emit CollectionCreated(msg.sender, address(collection), p.name, p.symbol);
        
        if (deploymentFee > 0) {
            (bool success, ) = payable(feeRecipient).call{value: deploymentFee}("");
            require(success, "Fee transfer failed");
        }
        
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
`;

export const COMPILER_VERSION = "v0.8.20+commit.a1b79de6";
export const CONTRACT_NAME = "NFTFactory";
export const ROYAL_NFT_CONTRACT_NAME = "RoyalNFT";

// Extract just the RoyalNFT contract from the full source code for verification
export function getRoyalNFTSourceCode(): string {
  // The ROYAL_NFT_SOURCE_CODE contains both NFTFactory and RoyalNFT
  // We need to extract just the RoyalNFT contract for verification
  const factoryStart = ROYAL_NFT_SOURCE_CODE.indexOf('contract NFTFactory');
  const royalNFTStart = ROYAL_NFT_SOURCE_CODE.indexOf('contract RoyalNFT');
  
  if (royalNFTStart === -1 || factoryStart === -1) {
    return ROYAL_NFT_SOURCE_CODE;
  }
  
  // Extract from RoyalNFT to end (before factory)
  const royalNFTCode = ROYAL_NFT_SOURCE_CODE.substring(royalNFTStart, factoryStart);
  
  // Add necessary imports/dependencies that RoyalNFT needs
  const dependencies = ROYAL_NFT_SOURCE_CODE.substring(0, royalNFTStart);
  
  return dependencies + royalNFTCode;
}

// Factory ABI for createCollection function
export const FACTORY_ABI = [
  {
    name: 'createCollection',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'p',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'contractURI', type: 'string' },
          { name: 'baseURI', type: 'string' },
          { name: 'unrevealedURI', type: 'string' },
          { name: 'maxSupply', type: 'uint256' },
          { name: 'mintPrice', type: 'uint256' },
          { name: 'maxMintPerWallet', type: 'uint256' },
          { name: 'mintStart', type: 'uint64' },
          { name: 'mintEnd', type: 'uint64' },
          { name: 'revealTime', type: 'uint64' },
          { name: 'royaltyReceiver', type: 'address' },
          { name: 'royaltyBps', type: 'uint96' },
          { name: 'allowlistRoot', type: 'bytes32' },
        ],
      },
    ],
    outputs: [{ type: 'address' }],
  },
] as const;

// RoyalNFT ABI for minting
export const ROYAL_NFT_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "quantity", type: "uint256" },
      { internalType: "address", name: "referral", type: "address" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMinted",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "remainingSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

// Deploy collection function for AI mint page
export async function deployCollection(
  creatorAddress: string,
  collectionDetails: {
    name: string;
    symbol: string;
    description: string;
    maxSupply: number;
    mintPrice: string;
    royaltyPercentage: number;
  },
  metadataURI: string
): Promise<string> {
  const { encodeFunctionData, parseEther, createPublicClient, http } = await import('viem');
  const { useWalletClient } = await import('wagmi');
  const { CONTRACTS } = await import('@/lib/config');

  // Get wallet client
  const walletClient = await useWalletClient();
  if (!walletClient.data) {
    throw new Error('Wallet client not available. Please connect your wallet.');
  }

  const client = walletClient.data;
  const address = creatorAddress as `0x${string}`;

  // Set deployment fee to 0.0001 ETH
  const deploymentFeeWei = parseEther('0.0001');

  // Prepare collection parameters
  const collectionParams = {
    name: collectionDetails.name,
    symbol: collectionDetails.symbol,
    contractURI: metadataURI,
    baseURI: metadataURI,
    unrevealedURI: metadataURI,
    maxSupply: BigInt(collectionDetails.maxSupply),
    mintPrice: parseEther(collectionDetails.mintPrice),
    maxMintPerWallet: BigInt(0),
    mintStart: BigInt(Math.floor(Date.now() / 1000)),
    mintEnd: BigInt(0),
    revealTime: BigInt(0),
    royaltyReceiver: address,
    royaltyBps: BigInt(collectionDetails.royaltyPercentage * 100),
    allowlistRoot: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  };

  // Send transaction
  const hash = await client.writeContract({
    address: CONTRACTS.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'createCollection',
    args: [collectionParams],
    value: deploymentFeeWei,
  });

  // Wait for transaction confirmation
  const publicRpcUrl = 'https://sepolia.base.org';
  const publicClient = createPublicClient({
    transport: http(publicRpcUrl)
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });

  if (receipt.status === 'reverted') {
    throw new Error('Transaction failed');
  }

  // Extract collection address from event logs
  let deployedCollectionAddress: string | null = null;
  if (receipt.logs && receipt.logs.length > 0) {
    for (const log of receipt.logs) {
      if (log.address?.toLowerCase() === CONTRACTS.FACTORY.toLowerCase()) {
        if (log.topics && log.topics.length >= 3 && log.topics[2]) {
          deployedCollectionAddress = '0x' + log.topics[2].slice(-40);
          break;
        }
      }
    }
  }

  if (!deployedCollectionAddress) {
    throw new Error('Failed to extract deployed contract address');
  }

  return deployedCollectionAddress;
}
