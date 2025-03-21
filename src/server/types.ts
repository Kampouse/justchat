export type Session = {
  user: {
    name: string;
    email: string;
    image: string;
    expires: string;
  };
} | null;

export type StreamableParams = {
  input: string;
  history?: any[];
  systemPrompt?: string;
};