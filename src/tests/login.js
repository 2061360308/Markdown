import { Octokit } from "@octokit/rest";
import { decryptToken } from "../utils/encryptToken.js";

let access_token =
  "U2FsdGVkX1+3S+p4Vwy6Qu9qaLB93n4mmyJT7uYBpnGpwoVKCfTScwU8zvJHkpF5+RVtpCdnvcikf88O4s61GQ==";

let token = decryptToken(access_token);

const octokit = new Octokit({
  auth: token, // 替换为你的个人访问令牌
});

let app_id = 1102849;

async function checkAppInstallationForRepo(owner, repo) {
  let installed = false;

  try {
    // 获取用户安装的所有 GitHub Apps
    const { data: { installations } } =
      await octokit.rest.apps.listInstallationsForAuthenticatedUser();
    // console.log(installations);
    // 遍历所有安装
    for (let installation of installations) {
      // 获取安装的仓库列表
      if (installation.app_id == app_id) {
        if(installation.repository_selection === "selected"){
          // 选择安装还需要判断是否在选择的仓库中
          const { data: { repositories } } = await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
            installation_id: installation.id,
          });

          for (let repository of repositories) {
            if (repository.name === repo) {
              installed = true;
              break;
            }
          }
        } else{
          installed = true;
        }
      }
    }

    return installed;
  } catch (error) {
    console.error("检查安装状态时出错:", error);
    return false;
  }
}

// 调用函数检查安装状态
let reault = checkAppInstallationForRepo("2061360308", "2061360308.github.io"); // 替换为实际的仓库所有者和仓库名

// let install_id = '59741487';

// const { data: repositories } = await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
//   installation_id: install_id,
// });

// console.log(repositories);