export const LiteraryReviewABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "admirer",
          "type": "address"
        }
      ],
      "name": "ManuscriptApplauded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "author",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "title",
          "type": "string"
        }
      ],
      "name": "ManuscriptSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "award",
          "type": "string"
        }
      ],
      "name": "ManuscriptVoted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        }
      ],
      "name": "applaudManuscript",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "award",
          "type": "string"
        }
      ],
      "name": "castReviewVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllManuscripts",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        }
      ],
      "name": "getManuscript",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "author",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "synopsisHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "contentHash",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "genres",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "awards",
          "type": "string[]"
        },
        {
          "internalType": "uint64",
          "name": "timestamp",
          "type": "uint64"
        },
        {
          "internalType": "euint32",
          "name": "applauseHandle",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "award",
          "type": "string"
        }
      ],
      "name": "getReviewVotes",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "votesHandle",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextManuscriptId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "title",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "synopsisHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "contentHash",
          "type": "string"
        },
        {
          "internalType": "string[]",
          "name": "genres",
          "type": "string[]"
        },
        {
          "internalType": "string[]",
          "name": "awards",
          "type": "string[]"
        }
      ],
      "name": "uploadManuscript",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "manuscriptId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
