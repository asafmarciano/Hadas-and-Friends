import raw from "./riddles.json";

export type RiddleRecord = {
  id: number;
  level: string;
  type: string;
  prompt: string;
  options: string[];
  answer: string;
  image?: string;
  imageLabel?: string;
};

export const riddles = raw as RiddleRecord[];
