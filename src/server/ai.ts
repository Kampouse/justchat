import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { trimMessages } from "@langchain/core/messages";
import { Message } from "~/routes/api";
export const AiChat = async (chat: Message[]) => {
  const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
    temperature: 0.5,
    streaming: true,
  });

  const systemPrompt =
    "write like a french professor, always speak french, always write but always help the user in a friendly way";

  // Trim messages to keep last 10 messages to maintain context without overloading
  const trimmer = trimMessages({
    strategy: "last",
    maxTokens: 20,
    tokenCounter: (msgs) => msgs.length,
  });

  const messageHistory = chat.map((m) => {
    if (m.type === "ai") {
      return new AIMessage(m.content);
    } else {
      return new HumanMessage(m.content);
    }
  });

  // Trim the message history
  const trimmedMessages = await trimmer.invoke(messageHistory);
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemPrompt],
    new MessagesPlaceholder("messages"),
  ]);

  const chain = prompt.pipe(llm);

  return await chain.stream({
    messages: [
      ...trimmedMessages,
      {
        type: "ai",
        content:
          "I WILL WRITE FRENCH CORRECTLY and sound  dramatic when correcting",
      },
    ],
  });
};
