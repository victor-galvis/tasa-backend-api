import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3ServiceService {
  private s3: S3Client;
  private bucketName = 'pruebad';

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async getFile(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { url };

    // const response = await this.s3.send(command);
    // return response.Body; // esto sería un stream
  }
}
