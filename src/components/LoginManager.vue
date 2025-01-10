<script setup>
import { ElLoading } from "element-plus";
import { ElMessageBox, ElMessage, ElInput } from "element-plus";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ref, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/utils/githubFs/api";
import { encryptToken, decryptToken } from "@/utils/encryptToken";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const loginMethod = ref("github");
const chooseRepo = ref(false);
const remember = ref([]);
const inputToken = ref("");
const repo = ref("");
const repoList = ref([]);

let access_token;

onMounted(async () => {
  const rememberValue = localStorage.getItem("remember");
  remember.value = rememberValue === "true" ? ["remember"] : [];

  const loginMethodValue = localStorage.getItem("loginMethod");
  loginMethod.value = loginMethodValue || "github";

  repo.value = route.query.repo || localStorage.getItem("repo") || "";
  access_token =
    route.query.access_token ||
    decryptToken(localStorage.getItem("access_token")) ||
    "";

  if (repo.value) {
    localStorage.setItem("repo", repo.value);
  }

  if (access_token) {
    // 清除查询参数
    loading.value = true;
    router.replace({ query: null });
    let { tokenValid, repoValid, hasPushAccess } = await api.init(
      repo.value,
      access_token
    );

    console.log("tokenValid", tokenValid);
    console.log("repoValid", repoValid);
    console.log("hasPushAccess", hasPushAccess);

    if (tokenValid) {
      // Todo 暂时忽略remember选项
      localStorage.setItem("access_token", encryptToken(access_token));
    }

    if (!tokenValid) {
      ElMessage.error("Token无效，请重新登录");
      loading.value = false;
      return;
    } else if (!repoValid) {
      ElMessage.error("仓库不存在或无权限");
      chooseRepo.value = true;
      let repos = await api.getRepoNames(access_token);
      repos.forEach((repo) => {
        repoList.value.push({ label: repo.name, value: repo.name });
      });
      loading.value = false;
      return;
    } else if (!hasPushAccess) {
      ElMessage.error("无推送权限，请重新登录");
      loading.value = false;
      return;
    }

    loading.value = false;
    router.push({ name: "main" });
    return;
  }
});

const changeRemember = (value) => {
  value = value[0] === "remember" ? true : false;
  localStorage.setItem("remember", value);
};

const loginByToken = () => {
  localStorage.setItem("loginMethod", loginMethod.value);
  console.log("loginByToken");
  if (!inputToken.value) {
    ElMessage.error("请输入Token");
    return;
  } else {
    access_token = inputToken.value;
    localStorage.setItem("access_token", encryptToken(access_token));
  }
};

const loginByGithub = async () => {
  localStorage.setItem("loginMethod", loginMethod.value);
  // 获取当前查询参数
  let params = new URLSearchParams(route.query);
  // 检查是否已经存在 time 参数
  if (params.has("time")) {
    // 更新 time 参数的值
    params.set("time", Date.now().toString());
  } else {
    // 添加新的 time 参数
    params.append("time", Date.now().toString());
  }
  // 使用 router.push 更新 URL 的查询参数而不刷新页面
  await router.push({ query: { ...route.query, time: params.get("time") } });
  await nextTick();

  const currentUrl = window.location.href;
  console.log("loginByGithub");
  let client_id = "Iv23liKlkmkQ3Tc1M679";
  let url = `https://github.com/login/oauth/authorize?client_id=${client_id}&state=${encodeURIComponent(currentUrl)}`;
  window.location.replace(url);
  loading.value = true;
};

const setRepoLogin = () => {
  localStorage.setItem("repo", repo.value);
  window.location.reload();
};
</script>

<template>
  <div class="container">
    <div class="card" v-loading="loading">
      <div class="left">
        <el-image
          style="height: 300px"
          src="https://tse2-mm.cn.bing.net/th/id/OIP-C.XIWbKIsH6fzn5xpDq0AV4QHaKz?w=182&h=265&c=7&r=0&o=5&dpr=1.3&pid=1.7"
          fit="cover"
          class="cover-image"
        />
      </div>
      <div class="right" v-if="!chooseRepo">
        <div>
          <h2>后台登录</h2>
        </div>
        <div>
          <el-button
            v-if="loginMethod === 'github'"
            type="primary"
            size="large"
            @click="loginByGithub"
          >
            授权登录
            <font-awesome-icon
              class="el-icon--right"
              :icon="['fab', 'github']"
              size="2xl"
            />
          </el-button>
          <el-input
            v-else
            v-model="inputToken"
            clearable
            show-password
            placeholder="请输入Token"
          >
            <template #append>
              <el-button type="primary" @click="loginByToken">登录</el-button>
            </template>
          </el-input>
        </div>
        <div class="options">
          <span class="remember-me">
            <el-checkbox-group v-model="remember" @change="changeRemember">
              <el-tooltip
                class="box-item"
                effect="dark"
                content="Token将被保存到本地，请注意秘钥安全"
                placement="top"
              >
                <el-checkbox value="remember" name="type">
                  保持登录
                </el-checkbox>
              </el-tooltip>
            </el-checkbox-group>
          </span>
          <span class="login-methods">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Github 授权登录"
              placement="top"
              ><font-awesome-icon
                :icon="['fab', 'github']"
                :class="loginMethod === 'github' ? 'select' : ''"
                @click="loginMethod = 'github'"
                size="xl"
                style="margin-right: 20px"
            /></el-tooltip>

            <el-tooltip
              class="box-item"
              effect="dark"
              content="手动输入Token登录"
              placement="top"
              ><font-awesome-icon
                :icon="['fas', 'key']"
                :class="loginMethod === 'token' ? 'select' : ''"
                @click="loginMethod = 'token'"
                size="xl"
            /></el-tooltip>
          </span>
        </div>
      </div>
      <div class="right" v-else>
        <div>
          <h2>选择仓库</h2>
        </div>
        <div>
          <el-select
            v-model="repo"
            placeholder="请选择将要使用的仓库"
            size="large"
            style="width: 240px"
          >
            <el-option
              v-for="item in repoList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div>
          <el-button type="primary" size="large" @click="setRepoLogin">
            登录
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.card {
  display: flex;
  width: 500px;
  height: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
}

.left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.right .options {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.right .options .login-methods {
  display: flex;
  justify-content: center;
  align-items: center;
}

.right .options .login-methods font-awesome-icon {
  margin: 0 5px;
  cursor: pointer;
}

.right .options .login-methods .select {
  /* border: 3px solid var(--el-color-primary);
  border-radius: 100%; */
  color: var(--el-color-primary);
}

/* .right h2 {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
} */

.login-button {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #42b983;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.remember-me {
  display: flex;
  justify-content: center;
  align-items: center;
}

.remember-me input {
  margin-right: 10px;
}
</style>
