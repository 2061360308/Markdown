// 对文件的操作
import dbManager from "./dbManager";
import githubApi from "./githubApi";
export const openFile = async (path) => {
  let file = await dbManager.getFile(path);
  if (file) {
    return file.content;
  } else {
    let res = await githubApi.getFileContent(path);
    let content = res.decodedContent;
    dbManager.saveFile(path, content); // 将获取到的文件数据存入数据库
    return content;
  }
};

// 校验本地文件
const verifyLocalFile = async (tree) => {
  // 提取treeIndex变成{path: sha}的形式
  let treeIndex = {};
  tree.forEach((item) => {
    treeIndex[item.path] = item.sha;
  });

  // 获取本地文件的索引
  let localIndex = await dbManager.getFilesIndex();

  // 遍历本地文件，对比treeIndex
  let diffs = [];
  localIndex.forEach((item) => {
    if (treeIndex[item.path] === undefined) {
      // 如果deleted在本地文件中为true，
      // 则表明这个文件已经被本地标记为删除且远程仓库中没有这个文件，
      // 直接删除本地文件
      if (item.deleted) {
        dbManager.deleteFile(item.path);
      } else if (item.firstCreate) {
        // 如果deleted在本地文件中为false，且firstCreate为true，
        // 则表明这个文件是本地新建的文件，远程端还没有进行同步，
        // 不需要处理，原样保留本地数据
      } else {
        // 如果deleted在本地文件中为false，
        // 则表明这个文件没有被本地标记为删除但是远程仓库中没有这个文件，
        // 则将这个文件加入diffs数组
        diffs.push(item.path);
      }
    } else if (treeIndex[item.path] !== item.sha) {
      // 如果远程仓库中有这个文件，但是sha不一样，
      // 需要进一步判断更新时间
      githubApi.getFileLastCommitTime(item.path).then((time) => {
        if (time >= item.updateTime) {
          // 如果远程仓库中的文件更新时间比本地文件更新时间晚，
          // 则将这个文件加入diffs数组
          // 相等情况下，但是sha不一样，可能出现错误，也加入diffs数组
          diffs.push(item.path);
        } else {
          // 如果远程仓库中的文件更新时间比本地文件更新时间早，
          // 则表明是本地文件更新但没来得及同步到远程仓库，
          // 保持本地文件不变即可
        }
      });
    }
  });

  // TODO：对diffs数组中的文件进行处理（可以导出zip包由用户之后决定处理）

  // 清空本地所有数据异常的文件
  diffs.forEach((path) => {
    dbManager.deleteFile(path);
  });
};

// 获取文件树
export const getFilesTree = async () => {
  const res = await githubApi.getRepoTree();
  let tree = res.tree;
  // 校验本地文件
  verifyLocalFile(tree);

  return githubApi.transformTree(tree);
};

// 更新文件
export const updateFile = async (path, content) => {
  dbManager.updateFile(path, content);
};

// 删除文件
export const deleteFile = async (path) => {
  dbManager.deleteFile(path);
};

// 获取差异
export const getDiffFiles = async () => {
  const res = await githubApi.getRepoTree();
  let tree = res.tree;

  // 提取treeIndex变成{path: sha}的形式
  let treeIndex = {};
  tree.forEach((item) => {
    treeIndex[item.path] = item.sha;
  });

  // 获取本地文件的索引
  let localIndex = await dbManager.getFilesIndex();

  // 遍历本地文件，对比treeIndex
  let diffs = [];
  for (const item of localIndex) {
    if (item.deleted) {
      // 如果deleted在本地文件中为true，
      if (treeIndex[item.path] === undefined) {
        // 远程仓库中没有这个文件，不需要处理
        dbManager.deleteFile(item.path);
      } else {
        // 远程仓库中有这个文件，将这个文件加入diffs数组
        diffs.push([item.path, "delete"]);
      }
      continue;
    }

    if (treeIndex[item.path] === undefined) {
      // 如果deleted在本地文件中为true，
      // 则表明这个文件已经被本地标记为删除且远程仓库中没有这个文件，
      // 直接删除本地文件
      if (item.deleted) {
        dbManager.deleteFile(item.path);
      } else if (item.firstCreate) {
        // 如果deleted在本地文件中为false，且firstCreate为true，
        // 则表明这个文件是本地新建的文件，远程端还没有进行同步，
        diffs.push([item.path, "create"]);
      } else {
        // 如果deleted在本地文件中为false，
        // 则表明这个文件没有被本地标记为删除但是远程仓库中没有这个文件，
        // 出现异常
      }
    } else if (treeIndex[item.path] !== item.sha) {
      // 如果远程仓库中有这个文件，但是sha不一样，
      // 需要进一步判断更新时间
      const time = await githubApi.getFileLastCommitTime(item.path);
      if (time >= item.updateTime) {
        // 如果远程仓库中的文件更新时间比本地文件更新时间晚，
        // 则将这个文件加入diffs数组
        // 相等情况下，但是sha不一样，可能出现错误
        diffs.push([item.path, "update"]);
      } else {
        // 如果远程仓库中的文件更新时间比本地文件更新时间早，
        // 则表明是本地文件更新但没来得及同步到远程仓库，
        diffs.push([item.path, "update"]);
      }
    }
  }

  return diffs;
};
