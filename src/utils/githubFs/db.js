import Dexie from "dexie";

class DB {
  db = new Dexie("FileDB");

  constructor() {
    if (DB.instance) {
      return DB.instance;
    }

    this.db.version(1).stores({
      files: "path, content",
      state: "tree_sha, last_time",
      created: "path",
      deleted: "path",
      changed: "path", // 文件被其他应用修改
    });

    DB.instance = this;
  }

  isExist = async (path) => {
    // 文件是否存在
    const count = await this.db.files.where({ path }).count();
    return count > 0;
  };

  open = async (path) => {
    /**
     * 打开文件
     * 目前没有实际作用就是检查文件是否存在
     */
    if (!this.isExist(path)) {
      return false;
    }

    return true;
  };

  read = async (path) => {
    /**
     * 读取文件
     */
    const file = await this.db.files.get({ path });
    return file ? file.content : null;
  };

  create = async (path, content = "") => {
    /**
     * 创建文件
     * 只有当首次创建文件的时候才调用，会标记文件为首次创建
     * 如果是gitHUb上已经存在的文件，需要拉取保存在本地的情况
     * 需要调用write方法
     */
    if (this.isExist(path)) {
      return false;
    }

    this.markCreated(path); // 标记文件为首次创建

    if (await this.write(path, content)) {
      return true;
    } else {
      return false;
    }
  };

  write = async (path, content) => {
    let file = {
      path,
      content,
    };
    await this.db.files.put(file);
    return true;
  };

  delete = async (path) => {
    /**
     * 将文件标记为已删除
     * 允许不存在的文件调用（在github上但是没有拉取的文件）
     */

    this.markDeleted(path);
  };

  remove = async (path) => {
    /**
     * 删除文件
     * 从数据库中删除文件
     */

    if (!this.isExist(path)) {
      return false;
    }

    await this.db.files.delete(path);
  };

  updateVersion = async (tree_sha) => {
    // 更新版本
    const state = {
      tree_sha,
      last_time: new Date().toISOString(),
    };
    await this.db.state.put(state);
  };

  getVersion = async () => {
    // 获取版本
    // const state = await this.db.state.get(1);
    const state = await this.db.state.orderBy("last_time").last();
    if (!state) {
      return null;
    }
    return state.tree_sha;
  };

  markDeleted = async (path) => {
    // 标记文件为已删除
    console.log("markDeleted", path);
    await this.db.deleted.put({ path });
  };

  unMarkDeleted = async (path) => {
    // 取消标记文件为已删除
    await this.db.deleted.delete(path);
  }

  markCreated = async (path) => {
    // 标记文件为首次创建
    await this.db.created.put({ path });
  };

  markChanged = async (path) => {
    // 标记文件为已修改
    await this.db.changed.put({ path });
  };

  getDeleted = async () => {
    // 获取已删除的文件
    const deletedFiles = await this.db.deleted.toArray();
    return deletedFiles.map(file => file.path);
  };

  getCreated = async () => {
    // 获取已创建的文件
    const createdFiles = await this.db.created.toArray();
    return createdFiles.map(file => file.path);
  };

  getChanged = async () => {
    // 获取已修改的文件(被其他应用修改)
    const changedFiles = await this.db.created.toArray();
    return changedFiles.map(file => file.path);
  };

  getDiff = async () => {
    // 本地修改的文件，不包括新建和删除的文件

    let created = await this.getCreated();
    let deleted = await this.getDeleted();

    let all_files = await this.db.files
      .toArray()
      .then((files) => files.map((file) => file.path));

    // 去除 all_files 里面的 created 和 deleted
    let diff_files = all_files.filter(
      (file) => !created.includes(file) && !deleted.includes(file)
    );

    return diff_files;
  };

  clear = async () => {
    // 清空数据库
    await this.db.files.clear();
    await this.db.created.clear();
    await this.db.deleted.clear();
    await this.db.changed.clear();
  };
}

const instance = new DB();
// Object.freeze(instance);

export default instance;
