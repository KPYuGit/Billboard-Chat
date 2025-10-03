import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'billboard-answer';

// Fallback in-memory storage (if DynamoDB is not configured)
const foodPreferences: Array<{
  id: string;
  name: string;
  food: string;
  location: string;
  timestamp: string;
}> = [];

export async function POST(req: NextRequest) {
  try {
    const { foodItem, location, timestamp } = await req.json();

    if (!foodItem || typeof foodItem !== 'string') {
      return NextResponse.json({ error: 'Food item is required' }, { status: 400 });
    }

    // Create a new food preference record
    const newRecord = {
      id: Date.now().toString(),
      name: `User from ${location || 'Unknown'}`,
      food: foodItem,
      location: location || 'Unknown',
      timestamp: timestamp || new Date().toISOString()
    };

    // Try to store in DynamoDB first
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const command = new PutCommand({
          TableName: TABLE_NAME,
          Item: newRecord
        });

        await docClient.send(command);
        console.log('Food preference stored in DynamoDB:', newRecord);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Food preference stored in DynamoDB',
          storedInDynamoDB: true,
          record: newRecord
        });
      } catch (dynamoError) {
        console.error('DynamoDB error:', dynamoError);
        // Fall back to in-memory storage
      }
    }

    // Fallback: Store in memory
    foodPreferences.push(newRecord);
    console.log('Food preference stored in memory:', newRecord);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Food preference stored in memory (DynamoDB not configured)',
      storedInMemory: true,
      record: newRecord,
      totalRecords: foodPreferences.length
    });

  } catch (error) {
    console.error('Store food API error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to store food preference',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve stored food preferences
export async function GET() {
  try {
    // Try to get from DynamoDB first
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        const command = new ScanCommand({
          TableName: TABLE_NAME
        });

        const result = await docClient.send(command);
        console.log('Food preferences retrieved from DynamoDB');
        
        return NextResponse.json({ 
          success: true,
          foodPreferences: result.Items || [],
          totalCount: result.Count || 0,
          fromDynamoDB: true
        });
      } catch (dynamoError) {
        console.error('DynamoDB error:', dynamoError);
        // Fall back to in-memory storage
      }
    }

    // Fallback: Return in-memory data
    return NextResponse.json({ 
      success: true,
      foodPreferences: foodPreferences,
      totalCount: foodPreferences.length,
      fromMemory: true
    });

  } catch (error) {
    console.error('Get food preferences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
