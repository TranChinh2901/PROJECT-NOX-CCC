import { createGeminiClient, resolveGeminiRuntimeConfig } from './chatbot-sdk';

const assertEmbeddingResponse = (values: Array<number[] | undefined>, expectedCount: number): number[][] => {
  if (values.length !== expectedCount || values.some((embedding) => !Array.isArray(embedding) || embedding.length === 0)) {
    throw new Error('Invalid response format from Gemini embedding API');
  }

  return values as number[][];
};

export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const sanitizedTexts = texts.map((text) => text.trim()).filter(Boolean);
  if (sanitizedTexts.length === 0) {
    return [];
  }

  const runtimeConfig = resolveGeminiRuntimeConfig();
  if (!runtimeConfig.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const client = createGeminiClient(runtimeConfig);

  try {
    const response = await client.models.embedContent({
      model: runtimeConfig.embeddingModel,
      contents: sanitizedTexts,
      ...(runtimeConfig.embeddingOutputDimensionality
        ? {
            config: {
              outputDimensionality: runtimeConfig.embeddingOutputDimensionality,
            },
          }
        : {}),
    });

    return assertEmbeddingResponse(
      (response.embeddings ?? []).map((embedding) => embedding.values),
      sanitizedTexts.length,
    );
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getEmbedding = async (text: string): Promise<number[]> => {
  const [embedding] = await getEmbeddings([text]);
  if (!embedding) {
    throw new Error('Embedding generation failed: missing embedding vector');
  }

  return embedding;
};

