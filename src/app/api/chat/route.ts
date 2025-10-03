import { NextRequest, NextResponse } from 'next/server';

// You will need to set this in your .env.local file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper function to check if a message is a food-related response
function checkIfFoodResponse(message: string): boolean {
  const foodKeywords = [
    'pizza', 'burger', 'pasta', 'sushi', 'tacos', 'chicken', 'beef', 'fish', 'salad',
    'sandwich', 'soup', 'steak', 'rice', 'noodles', 'curry', 'lasagna', 'spaghetti',
    'ramen', 'burrito', 'quesadilla', 'hot dog', 'hamburger', 'fries', 'wings',
    'seafood', 'lobster', 'crab', 'shrimp', 'salmon', 'tuna', 'turkey', 'ham',
    'bacon', 'sausage', 'meatballs', 'ribs', 'barbecue', 'bbq', 'grilled',
    'fried', 'baked', 'roasted', 'stir fry', 'teriyaki', 'korean', 'chinese',
    'italian', 'mexican', 'indian', 'thai', 'japanese', 'american', 'french',
    'dessert', 'cake', 'pie', 'ice cream', 'cookies', 'brownies', 'cheesecake',
    'fruit', 'apple', 'banana', 'orange', 'strawberry', 'blueberry', 'grape',
    'vegetable', 'carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'onion',
    'potato', 'sweet potato', 'corn', 'peas', 'beans', 'lentils', 'chickpeas'
  ];
  
  const messageLower = message.toLowerCase();
  return foodKeywords.some(keyword => messageLower.includes(keyword));
}

// Helper function to extract the main food item from a message
function extractFoodItem(message: string): string {
  // Simple extraction - take the first word that looks like a food item
  const words = message.toLowerCase().split(/\s+/);
  
  const foodKeywords = [
    'pizza', 'burger', 'pasta', 'sushi', 'tacos', 'chicken', 'beef', 'fish', 'salad',
    'sandwich', 'soup', 'steak', 'rice', 'noodles', 'curry', 'lasagna', 'spaghetti',
    'ramen', 'burrito', 'quesadilla', 'hot dog', 'hamburger', 'fries', 'wings',
    'seafood', 'lobster', 'crab', 'shrimp', 'salmon', 'tuna', 'turkey', 'ham',
    'bacon', 'sausage', 'meatballs', 'ribs', 'barbecue', 'bbq', 'grilled',
    'fried', 'baked', 'roasted', 'stir fry', 'teriyaki', 'korean', 'chinese',
    'italian', 'mexican', 'indian', 'thai', 'japanese', 'american', 'french',
    'dessert', 'cake', 'pie', 'ice cream', 'cookies', 'brownies', 'cheesecake',
    'fruit', 'apple', 'banana', 'orange', 'strawberry', 'blueberry', 'grape',
    'vegetable', 'carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'onion',
    'potato', 'sweet potato', 'corn', 'peas', 'beans', 'lentils', 'chickpeas'
  ];
  
  for (const word of words) {
    if (foodKeywords.includes(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }
  
  // If no specific food keyword found, return the first few words
  return words.slice(0, 2).join(' ').charAt(0).toUpperCase() + words.slice(0, 2).join(' ').slice(1);
}

export async function POST(req: NextRequest) {
  try {
    const { message, messages, foodPreferences } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Check if this is a food-related response
    const isFoodResponse = checkIfFoodResponse(message);
    
    // Build conversation history
    const conversationHistory = [
      {
        role: 'system',
        content: `You are a helpful BGE (Baltimore Gas and Electric) energy assistant. You help customers with:
- Energy efficiency tips and advice
- Information about BGE rebates and programs
- Home energy assessments and audits
- Smart thermostats and energy-saving devices
- Peak energy savings programs
- General energy conservation guidance

Keep responses helpful, friendly, and concise. Focus on practical advice that can help customers save energy and money. If asked about specific programs or rebates, provide general information and direct them to visit bgesmartenergy.com or contact BGE directly for the most current details.

When users share their favorite food, acknowledge it warmly and connect it to energy efficiency when possible (e.g., "Great choice! Cooking [food] efficiently can save energy...").

Always maintain a professional yet approachable tone.`
      }
    ];

    // Add conversation history if provided
    if (messages && Array.isArray(messages)) {
      messages.forEach((msg: any) => {
        if (msg.role && msg.content) {
          conversationHistory.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      });
    }

    // Add the current user message
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Generate response using OpenAI
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: conversationHistory,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) {
      console.error('OpenAI API error:', aiData);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }

    const responseMessage = aiData.choices?.[0]?.message?.content?.trim() || 'I apologize, but I cannot process your request at the moment. Please try again.';

    // Extract food item if this is a food response
    let foodItem = null;
    if (isFoodResponse) {
      foodItem = extractFoodItem(message);
    }

    return NextResponse.json({ 
      message: responseMessage,
      timestamp: new Date().toISOString(),
      isFoodResponse: isFoodResponse,
      foodItem: foodItem
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
