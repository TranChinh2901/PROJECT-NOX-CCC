export const calculateCosineSimilarity = (left: number[], right: number[]): number => {
  if (left.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dotProduct = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index];
    const rightValue = right[index];

    if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
      return 0;
    }

    dotProduct += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

export const isUsableEmbeddingVector = (vector: number[] | undefined): vector is number[] =>
  Array.isArray(vector) &&
  vector.length > 0 &&
  vector.every((value) => Number.isFinite(value));
