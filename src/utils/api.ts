import { Octokit } from "@octokit/rest";
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { githubAppId } from "@/config";

const DEBUG = true;

export const checkToken = async (token: string): Promise<string | boolean> => {
  const octokit = new Octokit({
    auth: token,
  });

  try {
    // 尝试获取用户信息
    const { data: user } = await octokit.rest.users.getAuthenticated();
    // this.owner = user.login;
    // console.log("User info:", this.owner, this.repo);
    console.log("User info:", user);
    return user.login;
  } catch (error) {
    // tokenValid = false;
    return false;
  }
};

export const checkRepo = async (
  owner: string,
  repo: string,
  token: string
): Promise<Record<string, boolean>> => {
  try {
    // 尝试获取仓库信息
    // 获取仓库信息
    const octokit = new Octokit({
      auth: token,
    });

    const { data: repoObj } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    console.log("Repo info:", repo);

    // 检查仓库是否存在以及是否有权限操作
    return {
      repoValid: true,
      hasPushAccess: repoObj.permissions?.push ?? false,
    };
  } catch (error) {
    return {
      repoValid: false,
      hasPushAccess: false,
    };
  }
};

export const checkBranch = async (
  owner: string,
  token: string,
  repo: string,
  branch: string
) => {
  // 检查分支是否存在
  const octokit = new Octokit({
    auth: token,
  });

  try {
    // 获取仓库的所有分支
    const response = await octokit.rest.repos.listBranches({
      owner: owner,
      repo: repo,
    });

    const branches = response.data;

    return branches.some((b) => b.name === branch);
  } catch (error) {
    console.error("Error fetching branches:", error);
    return false;
  }
};

export const checkInstalledApp = async (
  repo: string,
  token: string
): Promise<boolean> => {
  // 检查仓库中是否已经安装了 GitHub App

  const octokit = new Octokit({
    auth: token,
  });

  let installed_app = false;

  try {
    // 获取用户安装的所有 GitHub Apps
    const {
      data: { installations },
    } = await octokit.rest.apps.listInstallationsForAuthenticatedUser();
    // 遍历所有安装
    for (let installation of installations) {
      // 获取安装的仓库列表
      if (installation.app_id == githubAppId) {
        if (installation.repository_selection === "selected") {
          // 选择安装还需要判断是否在选择的仓库中
          const {
            data: { repositories },
          } = await octokit.rest.apps.listInstallationReposForAuthenticatedUser(
            {
              installation_id: installation.id,
            }
          );

          for (let repository of repositories) {
            if (repository.name === repo) {
              installed_app = true;
              break;
            }
          }
        } else {
          installed_app = true;
        }
      }
    }
    return installed_app;
  } catch (error) {
    console.error("检查安装状态时出错:", error);
    installed_app = false;
    return installed_app;
  }
};

class GithubApi {
  ready: boolean = false;
  octokit: Octokit | null = null;
  owner: string | null = null;
  repo: string | null = null;
  branch: string | null = null;
  static instance: GithubApi;

  constructor() {
    if (GithubApi.instance) {
      return GithubApi.instance;
    }

    GithubApi.instance = this;
  }

  init = async (repo: string, token: string, branch: string) => {
    // 初始化 Octokit
    this.repo = repo;
    this.branch = branch;

    if (!this.octokit) {
      this.octokit = new Octokit({
        auth: token,
      });
    }

    let result = {
      tokenValid: false,
      repoValid: false,
      hasPushAccess: false,
      branchValid: false,
      installedApp: false,
    };

    let user = await checkToken(token);

    if (user) {
      this.owner = user as string;
      result.tokenValid = true;
    } else {
      return result;
    }

    const { repoValid, hasPushAccess } = await checkRepo(
      this.owner as string,
      repo,
      token
    );
    result.repoValid = repoValid;
    result.hasPushAccess = hasPushAccess;
    if (!result.repoValid || !result.hasPushAccess) {
      return result;
    }

    // 检查分支是否存在
    result.branchValid = await checkBranch(
      this.owner as string,
      token,
      repo,
      branch
    );
    if (!result.branchValid) {
      return result;
    }

    // 检查仓库中是否已经安装了 GitHub App

    result.installedApp = await checkInstalledApp(repo, token);
    if (!result.installedApp) {
      return result;
    }

    this.ready = true;
    return result;
  };

  getUserInfo = async () => {
    try {
      // 尝试获取用户信息
      if (!this.octokit) {
        throw new Error("Octokit is not initialized");
      }

      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      // this.owner = user.login;
      // console.log("User info:", this.owner, this.repo);
      return user;
    } catch (error) {
      // tokenValid = false;
      console.error("Error fetching user info:", error);
      return false;
    }
  };

  getRepoNames = async () => {
    if (!this.octokit) {
      throw new Error("Octokit is not initialized");
    }

    try {
      // 获取当前用户的所有仓库
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({
        visibility: "all", // 获取所有可见性（public 和 private）的仓库
        per_page: 100, // 每页获取的仓库数量
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  };

  getRepoBranches = async () => {
    // 获取仓库的所有分支
    if (!this.octokit) {
      throw new Error("Octokit is not initialized");
    }

    try {
      const response = await this.octokit.rest.repos.listBranches({
        owner: this.owner as string,
        repo: this.repo as string,
      });

      const branches = response.data;
      console.log("Branches:", branches);
      return branches;
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  getRepoTree = async (
  ): Promise<RestEndpointMethodTypes["git"]["getTree"]["response"]["data"]> => {
    // 获取仓库的文件目录树
    console.log("getRepoTree", this.branch);
    try {
      if (!this.octokit) {
        throw new Error("Octokit is not initialized");
      }
      const response = await this.octokit.git.getTree({
        owner: this.owner as string,
        repo: this.repo as string,
        tree_sha: this.branch as string,
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
            console.log("文件新增或更新", file.path);
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

// 解码 Base64 内容为 UTF-8
const decodeBase64 = (content: string) => {
  try {
    return decodeURIComponent(escape(atob(content)));
  } catch (error) {
    console.error("Error decoding Base64 content:", error);
    throw error;
  }
};
