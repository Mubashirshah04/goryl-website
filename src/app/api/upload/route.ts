import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (s3Client) return s3Client;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';

  console.log('🔑 Initializing S3 client...');
  console.log('  - Region:', region);
  console.log('  - Access Key:', accessKeyId ? `${accessKeyId.substring(0, 8)}...` : 'MISSING');
  console.log('  - Secret Key:', secretAccessKey ? 'SET' : 'MISSING');

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found');
  }

  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
};

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'goryl-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: 'No path provided' },
        { status: 400 }
      );
    }

    console.log(`📤 Uploading file: ${file.name} (${file.size} bytes) to path: ${path}`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const s3Key = `${path}-${timestamp}`;

    // Get S3 client
    const client = getS3Client();

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    });

    console.log(`📡 Sending to S3 bucket: ${BUCKET_NAME}, key: ${s3Key}`);
    await client.send(command);

    // Generate S3 URL
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
    const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

    console.log('✅ File uploaded to S3:', s3Url);

    return NextResponse.json({
      url: s3Url,
      path: s3Key,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Upload failed', details: errorMessage },
      { status: 500 }
    );
  }
}
