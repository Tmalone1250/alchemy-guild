// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {ElementNFT} from "./ElementNFT.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract AlchemistContract is AccessControl {
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    // Enum for element types and tiers
    enum ElementType {
        // Tier I
        Earth,
        Water,
        Wind,
        Fire,
        Ice,
        Lightning,
        // Tier II
        Plasma,
        Tornado,
        Blizzard,
        Tsunami,
        Quake,
        Inferno,
        // Tier III
        Holy,
        Dark,
        Gravity,
        Time,
        Bio,
        Spirit
    }

    // Recepie Struct
    struct Recepie {
        ElementType resultElement;
        uint8 resultTier;
    }

    // State variables
    ElementNFT public immutable I_ELEMENT_NFT;
    address public immutable TREASURY;

    // Mappings
    mapping(bytes32 => Recepie) public recepies;

    // Custom Errors
    error Alchemist__InsufficientETHSent();
    error Alchemist__NotTokenOwner();
    error Alchemist__InvalidRecepie();

    // Constructor
    constructor(address nftAddress, address _treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        I_ELEMENT_NFT = ElementNFT(nftAddress);
        TREASURY = _treasury;

        // Initialize the recepies mapping with valid recepies
        // Tier II hashes and recepies (sorted order)
        // Plasma hash and recepie: Water + Lightning + Lightning
        bytes32 plasmaHash = keccak256(
            abi.encode(uint8(1), uint8(5), uint8(5))
        );
        recepies[plasmaHash] = Recepie(ElementType.Plasma, 2);
        // Tornado hash and recepie: Wind + Wind + Lightning
        bytes32 tornadoHash = keccak256(
            abi.encode(uint8(2), uint8(2), uint8(5))
        );
        recepies[tornadoHash] = Recepie(ElementType.Tornado, 2);
        // Blizzard hash and recepie: Wind + Ice + Ice
        bytes32 blizzardHash = keccak256(
            abi.encode(uint8(2), uint8(4), uint8(4))
        );
        recepies[blizzardHash] = Recepie(ElementType.Blizzard, 2);
        // Tsunami hash and recepie: Water + Water + Wind
        bytes32 tsunamiHash = keccak256(
            abi.encode(uint8(1), uint8(1), uint8(2))
        );
        recepies[tsunamiHash] = Recepie(ElementType.Tsunami, 2);
        // Quake hash and recepie: Earth + Earth + Fire
        bytes32 quakeHash = keccak256(abi.encode(uint8(0), uint8(0), uint8(3)));
        recepies[quakeHash] = Recepie(ElementType.Quake, 2);
        // Inferno hash and recepie: Wind + Fire + Fire
        bytes32 infernoHash = keccak256(
            abi.encode(uint8(2), uint8(3), uint8(3))
        );
        recepies[infernoHash] = Recepie(ElementType.Inferno, 2);

        // Tier III hashes and recepies (sorted order)
        // Holy hash and recepie: Lightning + Plasma + Plasma
        bytes32 holyHash = keccak256(abi.encode(uint8(5), uint8(6), uint8(6)));
        recepies[holyHash] = Recepie(ElementType.Holy, 3);
        // Dark hash and recepie: Water + Tsunami + Tsunami
        bytes32 darkHash = keccak256(abi.encode(uint8(1), uint8(9), uint8(9)));
        recepies[darkHash] = Recepie(ElementType.Dark, 3);
        // Gravity hash and recepie: Earth + Quake + Quake
        bytes32 gravityHash = keccak256(
            abi.encode(uint8(0), uint8(10), uint8(10))
        );
        recepies[gravityHash] = Recepie(ElementType.Gravity, 3);
        // Time hash and recepie: Wind + Tornado + Tornado
        bytes32 timeHash = keccak256(abi.encode(uint8(2), uint8(7), uint8(7)));
        recepies[timeHash] = Recepie(ElementType.Time, 3);
        // Bio hash and recepie: Ice + Blizzard + Blizzard
        bytes32 bioHash = keccak256(abi.encode(uint8(4), uint8(8), uint8(8)));
        recepies[bioHash] = Recepie(ElementType.Bio, 3);
        // Spirit hash and recepie: Fire + Inferno + Inferno
        bytes32 spiritHash = keccak256(
            abi.encode(uint8(3), uint8(11), uint8(11))
        );
        recepies[spiritHash] = Recepie(ElementType.Spirit, 3);
    }

    // craft() function
    function craft(uint256[3] calldata tokenIds) external payable {
        // Verify the user has sent the .002 ETH crafting fee
        if (msg.value < 0.002 ether) {
            revert Alchemist__InsufficientETHSent();
        }
        
        // Transfer crafting fee to treasury immediately
        (bool success, ) = TREASURY.call{value: msg.value}("");
        require(success, "Treasury transfer failed");

        // Check ownership and get Types
        uint8 a = I_ELEMENT_NFT.getTokenElement(tokenIds[0]);
        uint8 b = I_ELEMENT_NFT.getTokenElement(tokenIds[1]);
        uint8 c = I_ELEMENT_NFT.getTokenElement(tokenIds[2]);

        for (uint256 i = 0; i < 3; i++) {
            if (I_ELEMENT_NFT.ownerOf(tokenIds[i]) != msg.sender) {
                revert Alchemist__NotTokenOwner();
            }
        }

        // 3-step swap
        if (a > b) (a, b) = (b, a);
        if (b > c) (b, c) = (c, b);
        if (a > b) (a, b) = (b, a);

        // Generate key and check recepie
        bytes32 key = keccak256(abi.encode(a, b, c));
        Recepie memory recepie = recepies[key];

        if (recepie.resultTier == 0) {
            revert Alchemist__InvalidRecepie();
        }

        // Burn input and mint output
        for (uint i = 0; i < 3; i++) {
            I_ELEMENT_NFT.burn(tokenIds[i]);
        }

        I_ELEMENT_NFT.mint(
            msg.sender,
            recepie.resultTier,
            uint8(recepie.resultElement)
        );
    }

    // withdrawEth() function
    function withdrawEth() external onlyRole(WITHDRAWER_ROLE) {
        // low-level call to withdraw ETH from contract
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}
