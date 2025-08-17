import { streamText, CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export interface WebAgentOptions {
    provider?: 'openai' | 'anthropic' | 'openrouter';
    apiKey?: string;
    model?: string;
}

/**
 * Simple agent service for the standalone web application.
 * Uses the same AI SDK providers as the VS Code extension but
 * removes all VS Code specific dependencies.
 */
export class WebAgentService {
    private provider: 'openai' | 'anthropic' | 'openrouter';
    private apiKey: string;
    private model?: string;

    constructor(opts: WebAgentOptions = {}) {
        this.provider = opts.provider || (process.env.AI_PROVIDER as any) || 'anthropic';
        this.model = opts.model || process.env.AI_MODEL;
        this.apiKey = opts.apiKey ||
            process.env.OPENAI_API_KEY ||
            process.env.ANTHROPIC_API_KEY ||
            process.env.OPENROUTER_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('API key is required. Set OPENAI_API_KEY, ANTHROPIC_API_KEY or OPENROUTER_API_KEY');
        }
    }

    private getModel() {
        switch (this.provider) {
            case 'openrouter': {
                const provider = createOpenRouter({ apiKey: this.apiKey });
                const model = this.model || 'anthropic/claude-3-7-sonnet-20250219';
                return provider.chat(model);
            }
            case 'openai': {
                const provider = createOpenAI({ apiKey: this.apiKey });
                const model = this.model || 'gpt-4o-mini';
                return provider.chat(model);
            }
            case 'anthropic':
            default: {
                const provider = createAnthropic({ apiKey: this.apiKey });
                const model = this.model || 'claude-3-7-sonnet-20250219';
                return provider.messages(model);
            }
        }
    }

    /**
     * Query the underlying model with a prompt.
     * Returns the full text response and optionally streams
     * partial chunks to a callback.
     */
    async query(prompt: string, onMessage?: (msg: CoreMessage) => void): Promise<string> {
        const model = this.getModel();
        const { textStream } = await streamText({
            model,
            messages: [
                { role: 'system', content: 'You are SuperDesign, an AI agent that outputs complete HTML and CSS for user interface designs.' },
                { role: 'user', content: prompt },
            ],
        });

        let result = '';
        for await (const chunk of textStream) {
            result += chunk;
            if (onMessage) {
                onMessage({ role: 'assistant', content: chunk });
            }
        }
        return result;
    }
}

