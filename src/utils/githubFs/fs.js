// 管理当前文件
import api from "./api.js";
import DB from "./db.js";
import EventBus from "@/eventBus";

class Fs {
  expireTime = 1000 * 60 * 2; // 2分钟 目录缓存时间
  updateTime = new Date().getTime(); // 上次更新时间
  pathTree = null; // 文件树

  constructor() {
    if (Fs.instance) {
      return Fs.instance;
    }

    this.api = api;
    this.DB = DB;

    Fs.instance = this;
  }

  openRemoveSaveBox(path) {
    ElMessageBox.confirm(
      `文件${path}在Github上已经被删除，是否保留本地文件？`,
      "Warning",
      {
        confirmButtonText: "保留",
        cancelButtonText: "删除",
        type: "warning",
      }
    )
      .then(() => {
        this.DB.markCreated(diff.path);
        ElMessage({
          type: "success",
          message: "标记文件为新建",
        });
      })
      .catch(async () => {
        await this.DB.remove(diff.path);
        EventBus.emit("fileSourceChange", path); // 通知文件源变化, 相应编辑器应该关闭
        ElMessage({
          type: "info",
          message: "删除本地文件",
        });
      });
  }

  openUpdateBox(path) {
    ElMessageBox.confirm(
      `文件${path}在Github上已经被修改，是否保留本地文件？`,
      "Warning",
      {
        confirmButtonText: "保留",
        cancelButtonText: "删除",
        type: "warning",
      }
    )
      .then(async () => {
        await this.DB.markChanged(path);
        ElMessage({
          type: "success",
          message: "保留本地数据",
        });
      })
      .catch(async () => {
        await this.DB.remove(diff.path);
        EventBus.emit("fileSourceChange", path); // 通知文件源变化, 相应编辑器应该关闭
        ElMessage({
          type: "info",
          message: "删除本地文件",
        });
      });
  }

  updatePathTree = async () => {
    /**
     * 更新文件树
     */
    let response = await this.api.getRepoTree();
    this.pathTree = response.tree;
    let sha = response.sha;
    let lastSha = await this.DB.getVersion();
    if (!lastSha) {
      // 如果没有版本信息，直接更新
      this.DB.updateVersion(sha);
      this.updateTime = new Date().getTime();
      EventBus.emit("treeUpdate"); // 通知目录树变化
      return;
    }
    if (sha === lastSha) {
      // 版本一致，不需要更新
      return;
    }

    // 对比版本差异
    let diffs = await this.api.compareCommits(sha);
    for (let diff of diffs) {
      let isFile = this.DB.isExist(diff.path);
      if (isFile) {
        // 如果文件存在
        if (diff.status === "removed") {
          // 如果文件被删除
          let created_list = await this.DB.getCreated(); // 获取新建文件列表
          if (!created_list.includes(diff.path)) {
            // 如果不在新建文件列表中,则询问是否保留
            this.openRemoveSaveBox(diff.path);
          }
        } else {
          // 文件被修改
          // 判断是否已经在更改列表中
          let changed_list = await this.DB.getChanged();
          if (!changed_list.includes(diff.path)) {
            this.openUpdateBox(diff.path);
          }
        }
      }
    }

    EventBus.emit("treeUpdate"); // 通知目录树变化

    this.DB.updateVersion(sha);
    this.updateTime = new Date().getTime();
  };

  list = async (path = "") => {
    /**
     * 列出文件夹下的文件
     */
    if (
      !this.pathTree ||
      new Date().getTime() - this.updateTime > this.expireTime
    ) {
      // 如果没有缓存或者缓存过期
      await this.updatePathTree();
    }

    const files = this.pathTree.filter((item) => item.path.startsWith(path));
    return files;
  };

  read = async (path) => {
    /**
     * 获取文件内容
     */
    // 判断数据库中有没有这个文件
    let isFile = this.DB.isExist(path);
    let content;
    if (!isFile) {
      // 如果没有这个文件
      let response = await this.api.getFileContent(path);
      content = response.decodedContent;
      this.DB.save(path, content);
    } else {
      content = await this.DB.read(path);
    }

    return content;
  };

  write = async (path, content) => {
    /**
     * 写入文件
     */
    this.DB.write(path, content);
  };

  remove = async (path) => {
    /**
     * 删除文件
     */

    // 判断这里是否合法
    let filelists = await this.list(path);
    if (filelists.length > 0) {
      // 如果文件存在
      this.DB.delete(path);
      EventBus.emit("treeUpdate"); // 通知目录树变化
      return true;
    } else {
      return false;
    }
  };

  unRemove = async (path) => {
    /**
     * 恢复删除的文件
     */
    let delete_list = await this.DB.getDeleted();
    console.log(delete_list);
    if(delete_list.includes(path)) {
      this.DB.unMarkDeleted(path);
      EventBus.emit("treeUpdate"); // 通知目录树变化
      return true;
    } else {
      return false;
    }
  };

  getDeletedFiles = async () => {
    /**
     * 获取删除的文件
     */
    return await this.DB.getDeleted();
  }

  getDiffFiles = async () => {
    /**
     * 获取差异文件
     */
    let modify_list = await this.DB.getDiff();
    let delete_list = await this.DB.getDeleted();
    let create_list = await this.DB.getCreated();

    // 将每个列表转换为包含路径和操作类型的元组
    let modify_tuples = modify_list.map((path) => [path, "update"]);
    let delete_tuples = delete_list.map((path) => [path, "delete"]);
    let create_tuples = create_list.map((path) => [path, "create"]);

    // 合并所有元组
    let combined_list = [].concat(create_tuples, delete_tuples, modify_tuples);

    return combined_list;
  };

  commitChanges = async (message) => {
    /**
     * 提交更改
     */
    
    let diffFiles = await this.getDiffFiles();
    let files = [];
    for (let path of diffFiles) {
      let content;
      if(path[1] === "delete") {
        content = null;
      } else {
        content = await this.DB.read(path[0]);
      }
      files.push({
        path: path[0],
        content,
      })
    }
    await this.api.commitChanges(files, message);
    // 清空本地数据
    await this.DB.clear();
    // 更新目录树
    await this.updatePathTree();
  }
}

const instance = new Fs();
// Object.freeze(instance);

export default instance;
