// 管理dbIndex的数据
import Dexie from "dexie";

const db = new Dexie("FileDB");

db.version(1).stores({
  files: "path, sha, content, updateTime, firstCreate, deleted",
});

export const getFile = async (path) => {
  const file = await db.files.get(path);
  return file;
};

export const saveFile = async (path, content, firstCreate = false) => {
  const sha = await calculateBlobSha(content);
  const updateTime = new Date().toISOString();
  const file = { path, sha, content, updateTime, firstCreate, deleted: false };
  await db.files.put(file);
  return file;
};

export const updateFile = async (path, content) => {
  const sha = await calculateBlobSha(content);
  const updateTime = new Date().toISOString();
  await db.files.update(path, { content, sha, updateTime });
};

// 删除文件记录
export const deleteFile = async (path) => {
  await db.files.delete(path);
};

// 标记文件为已删除
export const markDeleted = async (path) => {
    await db.files.update(path, { deleted: true });
}

export const getFilesIndex = async () => {
  const files = await db.files.toArray();
  return files.map((file) => ({
    path: file.path,
    sha: file.sha,
    updateTime: file.updateTime,
    firstCreate: file.firstCreate,
    deleted: file.deleted,
  }));
};

const calculateBlobSha = async (content) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const length = data.byteLength;
  const header = `blob ${length}\0`;
  const headerData = encoder.encode(header);
  const combinedData = new Uint8Array(headerData.byteLength + data.byteLength);
  combinedData.set(headerData, 0);
  combinedData.set(data, headerData.byteLength);

  const hashBuffer = await crypto.subtle.digest("SHA-1", combinedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

export default {
    getFile,
    saveFile,
    updateFile,
    deleteFile,
    markDeleted,
    getFilesIndex,
};
