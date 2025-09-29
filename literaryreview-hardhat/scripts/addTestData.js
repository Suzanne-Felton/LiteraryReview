const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x99cbbDF446f029de6633dF02d7bACbFDC79344Fd";
  
  // 获取合约实例
  const LiteraryReview = await ethers.getContractFactory("LiteraryReview");
  const contract = LiteraryReview.attach(contractAddress);
  
  console.log("添加测试数据到合约:", contractAddress);
  
  // 添加测试稿件
  const testManuscripts = [
    {
      title: "春日遐想",
      synopsisHash: "QmTestHash1234567890abcdef",
      contentHash: "QmContentHash1234567890abcdef", 
      genres: ["诗歌", "现代诗"],
      awards: ["最佳诗歌", "年度作品"]
    },
    {
      title: "城市夜话",
      synopsisHash: "QmTestHash2345678901bcdefg",
      contentHash: "QmContentHash2345678901bcdefg",
      genres: ["散文", "都市文学"],
      awards: ["最佳散文", "年度作品"]
    }
  ];
  
  for (let i = 0; i < testManuscripts.length; i++) {
    const manuscript = testManuscripts[i];
    try {
      console.log(`添加稿件 ${i + 1}: ${manuscript.title}`);
      const tx = await contract.uploadManuscript(
        manuscript.title,
        manuscript.synopsisHash,
        manuscript.contentHash,
        manuscript.genres,
        manuscript.awards
      );
      await tx.wait();
      console.log(`✅ 稿件 ${i + 1} 添加成功`);
      
      // 为每个稿件添加一些掌声
      const applaudTx = await contract.applaudManuscript(i + 1);
      await applaudTx.wait();
      console.log(`👏 为稿件 ${i + 1} 添加掌声`);
      
    } catch (error) {
      console.error(`❌ 添加稿件 ${i + 1} 失败:`, error.message);
    }
  }
  
  // 检查合约状态
  try {
    const allIds = await contract.getAllManuscripts();
    console.log("所有稿件 ID:", allIds.map(id => id.toString()));
    
    for (const id of allIds) {
      const manuscript = await contract.getManuscript(id);
      console.log(`稿件 #${id}: ${manuscript[2]} (作者: ${manuscript[1].slice(0, 6)}...)`);
    }
  } catch (error) {
    console.error("检查合约状态失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
