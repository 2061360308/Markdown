import {
  ListObjectsV2Command,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

export const listS3Objects = async (
  bucketName: string,
  prefix: string = ""
) => {
  const client = new S3Client({
    region: "ap-chengdu",
    endpoint: "https://cos.ap-chengdu.myqcloud.com",
    credentials: {
      accessKeyId: "",
      secretAccessKey: "",
    },
  });

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await client.send(command);
    const objects = response.Contents || [];

    console.log(response);

    console.log("Objects in bucket:");
    objects.forEach((obj) => {
      console.log(obj.Key);
    });

    return objects;
  } catch (error) {
    if (error instanceof S3ServiceException) {
      console.error(`${error.name}: ${error.message}`);
    } else {
      console.error("Unexpected error:", error);
    }
  }
};

// listS3Objects("blog-image-1303709080", "/");
