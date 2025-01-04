import { Octokit } from "@octokit/rest";

let config = null;
let octokit;

// 读取配置文件
// const loadConfig = async () => {
//   if (Object.keys(config).length === 0) {
//     try {
//       const response = await fetch("/config.json");
//       config = await response.json();
//     } catch (error) {
//       console.error("Error loading config:", error);
//       throw error;
//     }
//   }
// };

// 创建 Octokit 实例
export const createOctokit = async (_config=null) => {
  if (_config) {
    config = _config;
    return
  }

  if (!config) {
    throw new Error("No token provided");
  }

  console.log("config", config, config.token_decrypt);

  if (!octokit) {
    octokit = new Octokit({
      auth: config.token_decrypt,
    });
  }
};

// 测试 GitHub Token 是否可用
export async function testToken(token) {
  const octokit = new Octokit({
    auth: token,
  });

  try {
    // 尝试获取用户信息
    const { data } = await octokit.rest.users.getAuthenticated();
    console.log("Token is valid. User info:", data);
    return true;
  } catch (error) {
    console.error("Token is invalid:", error);
    return false;
  }
}

// 获取仓库的文件目录树
export const getRepoTree = async (branch = "main") => {
  await createOctokit();
  try {
    const response = await octokit.git.getTree({
      owner: config.owner,
      repo: config.repo,
      tree_sha: branch,
      recursive: "true",
    });
    console.log("response.data", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching repo tree:", error);
    throw error;
  }
};

// 获取仓库具体文件的内容
export const getFileContent = async (path, branch = "main") => {
  await createOctokit();
  try {
    const response = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref: branch,
    });
    const content = response.data.content;
    const decodedContent = decodeBase64(content);
    return { ...response.data, decodedContent };
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw error;
  }
};

// 获取文件最后提交的时间
export const getFileLastCommitTime = async (path, branch = "main") => {
  try {
    await createOctokit();
    const response = await octokit.repos.listCommits({
      owner: config.owner,
      repo: config.repo,
      path,
      sha: branch,
      per_page: 1,
    });
    const lastCommit = response.data[0];
    return new Date(lastCommit.commit.author.date);
  } catch (error) {
    console.error("Error fetching file last commit time:", error);
    throw error;
  }
};

// 提交更改
export const commitChanges = async (files, message, branch = "main") => {
  await createOctokit();
  try {
    // 获取当前分支的最新提交
    const { data: refData } = await octokit.git.getRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refData.object.sha;

    // 获取最新提交的树对象
    const { data: commitData } = await octokit.git.getCommit({
      owner: config.owner,
      repo: config.repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // 创建新的树对象
    const tree = files.map((file) => ({
      path: file.path,
      mode: "100644",
      type: "blob",
      content: file.content,
    }));

    const { data: treeData } = await octokit.git.createTree({
      owner: config.owner,
      repo: config.repo,
      base_tree: baseTreeSha,
      tree,
    });

    // 创建新的提交对象
    const { data: newCommitData } = await octokit.git.createCommit({
      owner: config.owner,
      repo: config.repo,
      message,
      tree: treeData.sha,
      parents: [latestCommitSha],
    });

    // 更新引用
    await octokit.git.updateRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${branch}`,
      sha: newCommitData.sha,
    });

    return newCommitData;
  } catch (error) {
    console.error("Error committing changes:", error);
    throw error;
  }
};

// 转换 GitHub API 返回的文件目录树为所需格式
export const transformTree = (tree) => {
  const result = [];
  const pathMap = {};

  tree.forEach((item) => {
    const parts = item.path.split("/");
    let currentLevel = result;

    parts.forEach((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");
      const existingPath = pathMap[currentPath];

      if (existingPath) {
        currentLevel = existingPath.children;
      } else {
        const newItem = {
          title: part,
          isLeaf: item.type === "blob",
          isExpanded: false,
          data: {
            path: item.path,
            mode: item.mode,
            type: item.type,
            size: item.size,
            sha: item.sha,
          },
          children: [],
        };

        currentLevel.push(newItem);
        pathMap[currentPath] = newItem;

        if (item.type === "tree") {
          currentLevel = newItem.children;
        }
      }
    });
  });

  // 排序函数，将文件夹放在前面，并按字母顺序排序
  const sortItems = (items) => {
    items.sort((a, b) => {
      if (a.isLeaf === b.isLeaf) {
        return a.title.localeCompare(b.title);
      }
      return a.isLeaf ? 1 : -1;
    });

    items.forEach((item) => {
      if (!item.isLeaf && item.children.length > 0) {
        sortItems(item.children);
      }
    });
  };

  sortItems(result);

  return result;
};

// 解码 Base64 内容为 UTF-8
const decodeBase64 = (content) => {
  try {
    return decodeURIComponent(escape(atob(content)));
  } catch (error) {
    console.error("Error decoding Base64 content:", error);
    throw error;
  }
};

export default {
  getRepoTree,
  getFileContent,
  getFileLastCommitTime,
  commitChanges,
  transformTree,
};
