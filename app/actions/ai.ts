'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function* streamChat(messages: ChatMessage[]) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
        history,
        generationConfig: {
            maxOutputTokens: 2048,
        },
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
            yield chunkText;
        }
    }
}

// Non-streaming version for simpler use cases
export async function sendMessage(messages: ChatMessage[]): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
        history,
        generationConfig: {
            maxOutputTokens: 2048,
        },
    });

    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
}
