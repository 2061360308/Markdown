// 管理当前文件
import Dexie from "dexie";

class Fs {
  db!: Dexie;
  static instance: Fs | null = null;

  constructor() {
    if (Fs.instance) {
      return Fs.instance;
    }

    this.db = new Dexie("FileDB");

    this.db.version(4).stores({
      files: "[path+repo], path, repo, content",
    });

    Fs.instance = this;
  }

  isExist = async (path: string, repo: string) => {
    // 文件是否存在
    console.log("path", path, "repo", repo);
    // const count = await this.db
    //   .table("files")
    //   .where({ path })
    //   .filter((item) => item.repo === repo)
    //   .count();
    const count = await this.db.table("files").where({ path, repo }).count();
    return count > 0;
  };

  write = async (path: string, content = "", repo: string) => {
    /**
     * 写入文件
     */
    // 判断之前文件是否存在
    let file = {
      path,
      content,
      repo,
    };
    await this.db.table("files").put(file);
    return true;
  };

  get = async (path: string, repo: string) => {
    /**
     * 获取文件内容
     */
    const exists = await this.isExist(path, repo);
    if (!exists) {
      return null;
    }
    // let file = await this.db
    //   .table("files")
    //   .where({ path })
    //   .filter((item) => item.repo === repo)
    //   .first();
    let file = await this.db.table("files").where({ path, repo }).first();
    console.log("file", file);
    return file.content;
  };

  delete = async (path: string, repo: string) => {
    // 删除文件
    if (!this.isExist(path, repo)) {
      return false;
    }

    await this.db.table("files").delete([ path, repo ]);
    return true;
  };

  list = async (repo: string): Promise<string[]> => {
    // 获取所有文件
    let files = await this.db.table("files").where({ repo }).toArray();
    if (!files) {
      return [];
    }
    return files.map((file) => file.path);
  };
}

const instance = new Fs();

export default instance;
