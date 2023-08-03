// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract InfinityStones is ERC721URIStorage, Ownable {
    uint256 public tokenId;
    string public baseURI;
    mapping (string => bool) public stoneExists;
    mapping (address => uint256[]) private _ownedTokens;

    string[] public stones = [
        "Space Stone",
        "Mind Stone",
        "Reality Stone",
        "Power Stone",
        "Time Stone",
        "Soul Stone"
    ];

    constructor() ERC721("InfinityStones", "ISTN") {}

    function mint(address recipient, string memory stoneName) public onlyOwner {
        require(bytes(stoneName).length > 0, "stoneName must not be empty");
        require(recipient != address(0), "recipient must not be the zero address");
        require(!stoneExists[stoneName], "This stone already exists");
        
        for(uint i=0; i<stones.length; i++) {
            if(keccak256(bytes(stoneName)) == keccak256(bytes(stones[i]))) {
                stoneExists[stoneName] = true;
                _safeMint(recipient, tokenId);
                _ownedTokens[recipient].push(tokenId);
                _setTokenURI(tokenId, stoneName);
                tokenId++;
                break;
            }
        }
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "ERC721URIStorage: URI query for nonexistent token");
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, "/", Strings.toString(_tokenId))) : "";
    }

    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }
}
