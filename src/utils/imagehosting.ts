import S3ImageHosting from "s3-image-hosting";
import { Settings, ImageType } from "s3-image-hosting/types/index.d";

class ImageHosting {
  static instance: ImageHosting;
  s3: S3ImageHosting | null = null;
  ready: boolean = false;

  constructor() {
    if (ImageHosting.instance) {
      return ImageHosting.instance;
    }

    ImageHosting.instance = this;
  }

  init = async (
    bucket: string,
    endpoint: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
  ): Promise<boolean> => {
    let settings: Settings = {
      bucket, // bucket name
      endpoint, // endpoint eg: https://cos.ap-chengdu.myqcloud.com
      region, // region eg: ap-chengdu
      accessKeyId,
      secretAccessKey,
    };

    this.s3 = new S3ImageHosting(settings);

    let result = await this.s3.checkSettingsValid();

    if (result) {
      this.ready = true;
      return true;
    } else {
      this.ready = true;
      return false;
    }
  };

  upload = async (
    files: File[]
  ): Promise<{
    success: Array<{file: File, hash: string}>;
    failed: Array<File>;
  }> => {
    let failed: Array<File> = [];
    let success: Array<{file: File, hash: string}> = [];

    if (!this.ready || !this.s3) {
      return {
        success: [],
        failed: files,
      };
    }

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 判断文件是否已经存在
      let hash = await this.s3.calculateHash(uint8Array);
      let exist = await this.s3.isExistImage(hash);
      if (exist) {
        success.push({
          file,
          hash,
        });
        continue;
      }

      let current = new Date();
      const fileExtension = file.name.split(".").pop() || ""; // 文件后缀，标识图片类型的
      if (
        !["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(
          fileExtension
        )
      ) {
        failed.push(file);
        continue;
      }
      let res = await this.s3.uploadImage(
        uint8Array,
        fileExtension as ImageType,
        current,
        current,
        "",
        []
      );
      if (res.success) {
        success.push({
          file,
          hash: res.hash as string,
        });
      } else {
        failed.push(file);
      }
    }

    return {
      success,
      failed,
    };
  };
}

const instance = new ImageHosting();

export default instance;
