import Dexie from "dexie";

class DB {
  

  constructor() {
    if (DB.instance) {
      return DB.instance;
    }

    

    DB.instance = this;
  }

  isExist = async (path) => {
    // 文件是否存在
    const count = await this.db.files.where({ path }).count();
    return count > 0;
  };

  save = async (path, content) => {
    let file = {
      path,
      content,
    };
    await this.db.files.put(file);
    return true;
  };

  get = async (path) => {
    // 获取文件内容
    if (!this.isExist(path)) {
      return null;
    }
    let file = await this.db.files.get(path);
    return file.content;
  };

  delete = async (path) => {
    // 删除文件
    if (!this.isExist(path)) {
      return false;
    }
    await this.db.files.delete(path);
    return true;
  };

  list = async () => {
    // 获取所有文件
    return await this.db.files.toArray().map((file) => file.path);
  };

  open = async () => {
    // 打开文件
    
  };
}

const instance = new DB();

export default instance;
