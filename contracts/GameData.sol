// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GameData
 * @dev MegaETH 온체인 멀티플레이어 RPG 게임 데이터 컨트랙트
 * @notice 플레이어 등록, 위치 동기화, 채팅, NPC 상호작용을 온체인에 기록
 */
contract GameData {
    // ============================================
    // Structs
    // ============================================
    struct Player {
        string name;
        int256 x;
        int256 y;
        int256 z;
        uint256 lastActive;
        bool registered;
    }

    struct ChatEntry {
        address sender;
        string message;
        uint256 timestamp;
    }

    // ============================================
    // State Variables
    // ============================================
    address public admin;
    mapping(address => Player) public players;
    address[] public playerAddresses;
    
    ChatEntry[] public chatHistory;
    uint256 public constant MAX_CHAT_HISTORY = 100;
    uint256 public chatStartIndex;

    // ============================================
    // Events
    // ============================================
    event PlayerRegistered(
        address indexed walletAddress,
        string playerName,
        uint256 timestamp
    );

    event PlayerMoved(
        address indexed walletAddress,
        int256 x,
        int256 y,
        int256 z,
        uint256 timestamp
    );

    event ChatMessage(
        address indexed walletAddress,
        string message,
        uint256 timestamp
    );

    event NPCInteraction(
        address indexed walletAddress,
        string npcId,
        string action,
        uint256 timestamp
    );

    // ============================================
    // Modifiers
    // ============================================
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier playerExists(address walletAddress) {
        require(players[walletAddress].registered, "Player not registered");
        _;
    }

    // ============================================
    // Constructor
    // ============================================
    constructor() {
        admin = msg.sender;
    }

    // ============================================
    // Admin Functions
    // ============================================
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }

    // ============================================
    // Player Registration
    // ============================================
    function registerPlayer(
        address walletAddress,
        string calldata playerName
    ) external onlyAdmin {
        require(!players[walletAddress].registered, "Player already registered");
        require(bytes(playerName).length > 0, "Name cannot be empty");
        require(bytes(playerName).length <= 32, "Name too long");

        players[walletAddress] = Player({
            name: playerName,
            x: 0,
            y: 0,
            z: 0,
            lastActive: block.timestamp,
            registered: true
        });

        playerAddresses.push(walletAddress);

        emit PlayerRegistered(walletAddress, playerName, block.timestamp);
    }

    // ============================================
    // Position Updates
    // ============================================
    function updatePlayerPosition(
        address walletAddress,
        int256 x,
        int256 y,
        int256 z
    ) external onlyAdmin playerExists(walletAddress) {
        Player storage player = players[walletAddress];
        player.x = x;
        player.y = y;
        player.z = z;
        player.lastActive = block.timestamp;

        emit PlayerMoved(walletAddress, x, y, z, block.timestamp);
    }

    // ============================================
    // Chat Functions
    // ============================================
    function sendChat(
        address walletAddress,
        string calldata message
    ) external onlyAdmin playerExists(walletAddress) {
        require(bytes(message).length > 0, "Message cannot be empty");
        require(bytes(message).length <= 200, "Message too long");

        players[walletAddress].lastActive = block.timestamp;

        ChatEntry memory entry = ChatEntry({
            sender: walletAddress,
            message: message,
            timestamp: block.timestamp
        });

        if (chatHistory.length < MAX_CHAT_HISTORY) {
            chatHistory.push(entry);
        } else {
            chatHistory[chatStartIndex] = entry;
            chatStartIndex = (chatStartIndex + 1) % MAX_CHAT_HISTORY;
        }

        emit ChatMessage(walletAddress, message, block.timestamp);
    }

    // ============================================
    // NPC Interaction Logging
    // ============================================
    function logNPCInteraction(
        address walletAddress,
        string calldata npcId,
        string calldata action
    ) external onlyAdmin playerExists(walletAddress) {
        players[walletAddress].lastActive = block.timestamp;

        emit NPCInteraction(walletAddress, npcId, action, block.timestamp);
    }

    // ============================================
    // View Functions
    // ============================================
    function getPlayer(
        address walletAddress
    ) external view returns (
        string memory name,
        int256 x,
        int256 y,
        int256 z,
        uint256 lastActive,
        bool registered
    ) {
        Player storage player = players[walletAddress];
        return (
            player.name,
            player.x,
            player.y,
            player.z,
            player.lastActive,
            player.registered
        );
    }

    function getActivePlayers(
        uint256 since
    ) external view returns (address[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < playerAddresses.length; i++) {
            if (players[playerAddresses[i]].lastActive >= since) {
                count++;
            }
        }

        address[] memory activePlayers = new address[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < playerAddresses.length; i++) {
            if (players[playerAddresses[i]].lastActive >= since) {
                activePlayers[index] = playerAddresses[i];
                index++;
            }
        }

        return activePlayers;
    }

    function getRecentChats(
        uint256 count
    ) external view returns (
        address[] memory senders,
        string[] memory messages,
        uint256[] memory timestamps
    ) {
        uint256 totalChats = chatHistory.length;
        uint256 returnCount = count > totalChats ? totalChats : count;

        senders = new address[](returnCount);
        messages = new string[](returnCount);
        timestamps = new uint256[](returnCount);

        for (uint256 i = 0; i < returnCount; i++) {
            uint256 idx;
            if (totalChats < MAX_CHAT_HISTORY) {
                idx = totalChats - returnCount + i;
            } else {
                idx = (chatStartIndex + MAX_CHAT_HISTORY - returnCount + i) % MAX_CHAT_HISTORY;
            }
            
            senders[i] = chatHistory[idx].sender;
            messages[i] = chatHistory[idx].message;
            timestamps[i] = chatHistory[idx].timestamp;
        }

        return (senders, messages, timestamps);
    }

    function getPlayerCount() external view returns (uint256) {
        return playerAddresses.length;
    }

    function getAllPlayers() external view returns (
        address[] memory addresses,
        string[] memory names,
        int256[] memory xs,
        int256[] memory ys,
        int256[] memory zs,
        uint256[] memory lastActives
    ) {
        uint256 count = playerAddresses.length;
        
        addresses = new address[](count);
        names = new string[](count);
        xs = new int256[](count);
        ys = new int256[](count);
        zs = new int256[](count);
        lastActives = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            address addr = playerAddresses[i];
            Player storage player = players[addr];
            
            addresses[i] = addr;
            names[i] = player.name;
            xs[i] = player.x;
            ys[i] = player.y;
            zs[i] = player.z;
            lastActives[i] = player.lastActive;
        }

        return (addresses, names, xs, ys, zs, lastActives);
    }
}



