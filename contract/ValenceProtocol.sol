// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ValenceProtocol {
    address public owner;
    address public pvmMathEngineAddress;
    uint256 public micropaymentFee = 0.001 ether; 

    struct Interaction {
        uint8 interaction_type;
        uint64 timestamp;
    }

    mapping(address => Interaction[]) public agentInteractions;
    event InteractionRecorded(address indexed from, address indexed agent, uint8 interactionType);

    constructor(address _pvmMathEngineAddress) {
        owner = msg.sender;
        pvmMathEngineAddress = _pvmMathEngineAddress;
    }

    function recordInteraction(address agent, uint8 interactionType) public payable {
        require(msg.value >= micropaymentFee, "402 Payment Required");
        require(interactionType >= 1 && interactionType <= 3, "Invalid type");
        
        agentInteractions[agent].push(Interaction({
            interaction_type: interactionType,
            timestamp: uint64(block.timestamp)
        }));
        
        emit InteractionRecorded(msg.sender, agent, interactionType);
    }

    // Polkadot SCALE uses Little-Endian. EVM uses Big-Endian. We must flip the bytes.
    function toLittleEndian64(uint64 value) internal pure returns (bytes memory) {
        bytes memory buffer = new bytes(8);
        for (uint i = 0; i < 8; i++) {
            buffer[i] = bytes1(uint8(value >> (i * 8)));
        }
        return buffer;
    }

    function getAgentReputation(address agent) public view returns (int32) {
        Interaction[] memory history = agentInteractions[agent];
        if (history.length == 0) return 1000; 
        bytes4 RUST_SELECTOR = 0xb378d1e2; 
        bytes memory payload = abi.encodePacked(RUST_SELECTOR);

        require(history.length < 64, "Vector too large");
        uint8 vecLenScale = uint8(history.length << 2);
        payload = abi.encodePacked(payload, vecLenScale);

        for (uint i = 0; i < history.length; i++) {
            payload = abi.encodePacked(
                payload,
                history[i].interaction_type,
                toLittleEndian64(history[i].timestamp)
            );
        }

        payload = abi.encodePacked(payload, toLittleEndian64(uint64(block.timestamp)));

        (bool success, bytes memory returnData) = pvmMathEngineAddress.staticcall(payload);
        
        require(returnData.length > 0, "Address is empty or call failed completely");
        require(success, "PVM Rust Call Trapped!");

        if (returnData.length == 5 && returnData[0] == 0x00) {
            uint32 unsignedVal = uint32(uint8(returnData[1])) |
                                 (uint32(uint8(returnData[2])) << 8) |
                                 (uint32(uint8(returnData[3])) << 16) |
                                 (uint32(uint8(returnData[4])) << 24);
            return int32(unsignedVal);
        } else if (returnData.length == 4) {
            uint32 unsignedVal = uint32(uint8(returnData[0])) |
                                 (uint32(uint8(returnData[1])) << 8) |
                                 (uint32(uint8(returnData[2])) << 16) |
                                 (uint32(uint8(returnData[3])) << 24);
            return int32(unsignedVal);
        }

        revert("Unrecognized SCALE return format");
    }
}