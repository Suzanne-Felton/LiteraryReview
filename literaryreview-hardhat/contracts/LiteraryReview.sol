// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, euint64, euint256, externalEuint32, externalEuint64, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title LiteraryReview – 文学作品匿名评选（FHE 版）
/// @notice 稿件的点赞数、评审投票以 FHE 加密存储；作者与参与者通过 ACL 授权访问。
contract LiteraryReview is SepoliaConfig {
    struct Manuscript {
        uint256 id;
        address author;
        string title;
        string synopsisHash;      // 简介哈希（IPFS/Arweave 等）
        string contentHash;       // 正文/附件哈希
        string[] genres;          // 文学体裁（明文）
        string[] awards;          // 评选奖项（如“最佳小说”）
        euint32 applauseEnc;      // 加密的点赞数
        uint64 timestamp;
    }

    // 自增ID
    uint256 public nextManuscriptId = 1;

    // 存储
    mapping(uint256 => Manuscript) private _manuscripts;
    uint256[] private _manuscriptIds;

    // 评审投票：(manuscriptId, awardKey) => euint32
    mapping(uint256 => mapping(bytes32 => euint32)) private _votesByManuscriptAndAward;
    mapping(uint256 => mapping(bytes32 => bool)) private _votesInitialized;

    // 事件
    event ManuscriptSubmitted(uint256 indexed manuscriptId, address indexed author, string title);
    event ManuscriptApplauded(uint256 indexed manuscriptId, address indexed admirer);
    event ManuscriptVoted(uint256 indexed manuscriptId, address indexed voter, string award);

    /// @notice 提交稿件
    function uploadManuscript(
        string calldata title,
        string calldata synopsisHash,
        string calldata contentHash,
        string[] calldata genres,
        string[] calldata awards
    ) external returns (uint256 manuscriptId) {
        manuscriptId = nextManuscriptId++;

        euint32 applause = FHE.asEuint32(0);

        Manuscript storage m = _manuscripts[manuscriptId];
        m.id = manuscriptId;
        m.author = msg.sender;
        m.title = title;
        m.synopsisHash = synopsisHash;
        m.contentHash = contentHash;
        m.timestamp = uint64(block.timestamp);
        m.applauseEnc = applause;

        for (uint256 i = 0; i < genres.length; i++) {
            m.genres.push(genres[i]);
        }

        for (uint256 i = 0; i < awards.length; i++) {
            m.awards.push(awards[i]);
        }

        // 授权：合约自身与作者可访问/授权 applauseEnc
        FHE.allowThis(m.applauseEnc);
        FHE.allow(m.applauseEnc, msg.sender);

        _manuscriptIds.push(manuscriptId);

        emit ManuscriptSubmitted(manuscriptId, msg.sender, title);
    }

    /// @notice 点赞稿件（加密计数 +1）
    function applaudManuscript(uint256 manuscriptId) external {
        Manuscript storage m = _manuscripts[manuscriptId];
        require(m.author != address(0), "Manuscript not found");

        m.applauseEnc = FHE.add(m.applauseEnc, 1);

        FHE.allowThis(m.applauseEnc);
        FHE.allow(m.applauseEnc, m.author);
        FHE.allowTransient(m.applauseEnc, msg.sender);

        emit ManuscriptApplauded(manuscriptId, msg.sender);
    }

    /// @notice 为指定奖项投票（需为该稿件已声明的奖项之一）
    function castReviewVote(uint256 manuscriptId, string calldata award) external {
        Manuscript storage m = _manuscripts[manuscriptId];
        require(m.author != address(0), "Manuscript not found");

        bool hasAward = false;
        for (uint256 i = 0; i < m.awards.length; i++) {
            if (keccak256(bytes(m.awards[i])) == keccak256(bytes(award))) {
                hasAward = true;
                break;
            }
        }
        require(hasAward, "Manuscript not eligible for this award");

        bytes32 awardKey = keccak256(bytes(award));
        euint32 current = _votesByManuscriptAndAward[manuscriptId][awardKey];
        if (!_votesInitialized[manuscriptId][awardKey]) {
            current = FHE.asEuint32(0);
            _votesInitialized[manuscriptId][awardKey] = true;
        }
        current = FHE.add(current, 1);
        _votesByManuscriptAndAward[manuscriptId][awardKey] = current;

        FHE.allowThis(current);
        FHE.allow(current, m.author);
        FHE.allowTransient(current, msg.sender);

        emit ManuscriptVoted(manuscriptId, msg.sender, award);
    }

    /// @notice 获取稿件（返回加密点赞句柄）
    function getManuscript(uint256 manuscriptId)
        external
        view
        returns (
            uint256 id,
            address author,
            string memory title,
            string memory synopsisHash,
            string memory contentHash,
            string[] memory genres,
            string[] memory awards,
            uint64 timestamp,
            euint32 applauseHandle
        )
    {
        Manuscript storage m = _manuscripts[manuscriptId];
        require(m.author != address(0), "Manuscript not found");
        return (
            m.id,
            m.author,
            m.title,
            m.synopsisHash,
            m.contentHash,
            m.genres,
            m.awards,
            m.timestamp,
            m.applauseEnc
        );
    }

    /// @notice 获取所有稿件ID
    function getAllManuscripts() external view returns (uint256[] memory ids) {
        return _manuscriptIds;
    }

    /// @notice 获取某稿件在某奖项下的投票计数（加密句柄）
    function getReviewVotes(uint256 manuscriptId, string calldata award) external view returns (euint32 votesHandle) {
        bytes32 awardKey = keccak256(bytes(award));
        return _votesByManuscriptAndAward[manuscriptId][awardKey];
    }
}


