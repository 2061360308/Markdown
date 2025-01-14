import { Octokit } from "@octokit/rest";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

const DEBUG = true;

class GithubApi {
  ready: boolean = false;
  octokit: Octokit | null = null;
  owner: string | null = null;
  repo: string | null = null;
  static instance: GithubApi;

  constructor() {
    if (GithubApi.instance) {
      return GithubApi.instance;
    }

    GithubApi.instance = this;
  }

  init = async (repo: string, token: string) => {
    // 初始化 Octokit
    this.repo = repo;

    if (!this.octokit) {
      this.octokit = new Octokit({
        auth: token,
      });
    }

    let tokenValid = true;

    try {
      // 尝试获取用户信息
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      this.owner = user.login;
      console.log("User info:", this.owner, this.repo);
    } catch (error) {
      tokenValid = false;
    }

    let repoValid = true;
    let hasPushAccess = true;

    try {
      // 尝试获取仓库信息
      // 获取仓库信息
      if (!this.repo) {
        throw new Error("this.repo is not defined");
      }

      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.owner as string,
        repo: this.repo as string,
      });

      // 检查仓库是否存在以及是否有权限操作
      hasPushAccess = repo.permissions?.push ?? false;
    } catch (error) {
      repoValid = false;
      hasPushAccess = false;
    }

    if (tokenValid && repoValid && hasPushAccess) {
      this.ready = true;
    }

    return {
      tokenValid: tokenValid,
      repoValid: repoValid,
      hasPushAccess: hasPushAccess,
    };
  };

  getRepoNames = async (token: string) => {
    const octokit = new Octokit({
      auth: token,
    });

    try {
      // 获取当前用户的所有仓库
      const response = await octokit.rest.repos.listForAuthenticatedUser({
        visibility: "all", // 获取所有可见性（public 和 private）的仓库
        per_page: 100, // 每页获取的仓库数量
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  };

  getRepoTree = async (
    branch = "main"
  ): Promise<RestEndpointMethodTypes["git"]["getTree"]["response"]["data"]> => {
    // 获取仓库的文件目录树
    try {
      if (!this.octokit) {
        throw new Error("Octokit is not initialized");
      }
      const response = await this.octokit.git.getTree({
        owner: this.owner as string,
        repo: this.repo as string,
        tree_sha: branch,
        recursive: "true",
      });
      if (DEBUG) {
        console.log("response.data", response.data);
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching repo tree:", error);
      throw error;
    }
  };

  compareCommits = async (base: any, head: any) => {
    // 比较两个提交之间的差异
    const response = await (this.octokit as Octokit).repos.compareCommits({
      owner: this.owner as string,
      repo: this.repo as string,
      base,
      head,
    });
    return response.data.files;
  };

  getFileContent = async (path: string, branch = "main") => {
    // 获取仓库具体文件的内容

    try {
      const response: RestEndpointMethodTypes["repos"]["getContent"]["response"] =
        await (this.octokit as Octokit).repos.getContent({
          owner: this.owner as string,
          repo: this.repo as string,
          path,
          ref: branch,
        });

      const data = response.data;

      if (!Array.isArray(data) && "content" in data) {
        const content = data.content;
        const decodedContent = decodeBase64(content);
        return { ...data, decodedContent };
      } else {
        throw new Error("Content is not a file");
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw error;
    }
  };

  getFileLastCommitTime = async (path: string, branch = "main") => {
    // 获取文件最后提交的时间
    try {
      const response: RestEndpointMethodTypes["repos"]["listCommits"]["response"] =
        await (this.octokit as Octokit).repos.listCommits({
          owner: this.owner as string,
          repo: this.repo as string,
          path,
          sha: branch,
          per_page: 1,
        });
      const lastCommit = response.data[0];
      const authorDate = lastCommit.commit.author?.date;
      if (!authorDate) {
        throw new Error("Author date is undefined");
      }
      return new Date(authorDate);
    } catch (error) {
      console.error("Error fetching file last commit time:", error);
      throw error;
    }
  };

  commitChanges = async (
    files: { path: string; content: string | null }[],
    message: string,
    branch = "main"
  ) => {
    // 提交更改
    try {
      // 获取当前分支的最新提交
      const { data: refData } = await (this.octokit as Octokit).git.getRef({
        owner: this.owner as string,
        repo: this.repo as string,
        ref: `heads/${branch}`,
      });
      const latestCommitSha = refData.object.sha;

      // 获取最新提交的树对象
      const { data: commitData } = await (
        this.octokit as Octokit
      ).git.getCommit({
        owner: this.owner as string,
        repo: this.repo as string,
        commit_sha: latestCommitSha,
      });
      const baseTreeSha = commitData.tree.sha;

      // 创建新的树对象
      const tree: RestEndpointMethodTypes["git"]["createTree"]["parameters"]["tree"] =
        files.map((file) => {
          if (file.content === null) {
            // 文件删除
            return {
              path: file.path,
              mode: "100644",
              type: "blob",
              sha: null,
            };
          } else {
            // 文件新增或更新
            return {
              path: file.path,
              mode: "100644",
              type: "blob",
              content: file.content,
            };
          }
        });

      const { data: treeData } = await (this.octokit as Octokit).git.createTree(
        {
          owner: this.owner as string,
          repo: this.repo as string,
          base_tree: baseTreeSha,
          tree,
        }
      );

      // 创建新的提交对象
      const { data: newCommitData } = await (
        this.octokit as Octokit
      ).git.createCommit({
        owner: this.owner as string,
        repo: this.repo as string,
        message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      });

      // 更新引用
      await (this.octokit as Octokit).git.updateRef({
        owner: this.owner as string,
        repo: this.repo as string,
        ref: `heads/${branch}`,
        sha: newCommitData.sha,
      });

      return newCommitData;
    } catch (error) {
      console.error("Error committing changes:", error);
      throw error;
    }
  };
}

const instance = new GithubApi();

export default instance;

// 转换 GitHub API 返回的文件目录树为所需格式
// export const transformTree = (tree) => {
//   const result = [];
//   const pathMap = {};

//   tree.forEach((item) => {
//     const parts = item.path.split("/");
//     let currentLevel = result;

//     parts.forEach((part, index) => {
//       const currentPath = parts.slice(0, index + 1).join("/");
//       const existingPath = pathMap[currentPath];

//       if (existingPath) {
//         currentLevel = existingPath.children;
//       } else {
//         const newItem = {
//           title: part,
//           isLeaf: item.type === "blob",
//           isExpanded: false,
//           data: {
//             path: item.path,
//             mode: item.mode,
//             type: item.type,
//             size: item.size,
//             sha: item.sha,
//           },
//           children: [],
//         };

//         currentLevel.push(newItem);
//         pathMap[currentPath] = newItem;

//         if (item.type === "tree") {
//           currentLevel = newItem.children;
//         }
//       }
//     });
//   });

//   // 排序函数，将文件夹放在前面，并按字母顺序排序
//   const sortItems = (items) => {
//     items.sort((a, b) => {
//       if (a.isLeaf === b.isLeaf) {
//         return a.title.localeCompare(b.title);
//       }
//       return a.isLeaf ? 1 : -1;
//     });

//     items.forEach((item) => {
//       if (!item.isLeaf && item.children.length > 0) {
//         sortItems(item.children);
//       }
//     });
//   };

//   sortItems(result);

//   return result;
// };

// 解码 Base64 内容为 UTF-8
const decodeBase64 = (content: string) => {
  try {
    return decodeURIComponent(escape(atob(content)));
  } catch (error) {
    console.error("Error decoding Base64 content:", error);
    throw error;
  }
};
