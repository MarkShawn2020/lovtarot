import OpenAI from 'openai'
import type { TarotCard } from '../data/tarot'

const client = new OpenAI({
  baseURL: 'https://zenmux.ai/api/v1',
  apiKey: import.meta.env.VITE_ZENMUX_API_KEY,
  dangerouslyAllowBrowser: true
})

export type ChunkType = 'reasoning' | 'content'

const SYSTEM_PROMPT = `你是一位温暖、有智慧的塔罗牌解读师。你的解读风格是：

1. **温暖治愈**：用温柔、包容的语气，让人感到被理解和支持
2. **启发觉察**：帮助人看到当下的状态，而非预测未来
3. **赋能希望**：引导人发现内在的力量和可能性
4. **简洁有力**：每段话都有意义，避免空洞的套话

解读结构：
- 先简短回应问题的核心
- 解读三张牌（过去、现在、未来）的启示
- 给出整体的洞见和鼓励

注意：
- 用中文回答
- 不要使用 markdown 格式
- 不要逐条列出，用自然的段落
- 控制在 300-400 字左右`

// Mock 响应（开发调试用）
const MOCK_REASONING = `让我仔细看看这三张牌的组合...
过去的牌显示了一些经历，现在的牌反映当下状态，未来的牌指向可能的方向。
我需要将它们联系起来，给出有意义的解读。`

const MOCK_READING = `亲爱的问卜者，感谢你带着这个问题来到这里。

从过去的牌面来看，你经历了一段需要独自面对的时期。那些看似孤独的时刻，其实是在为你积蓄力量。

现在的牌面告诉我，你正站在一个转折点上。内心的声音正在变得清晰，你开始明白什么对自己真正重要。

未来的牌面充满希望。它在告诉你，当你跟随内心的指引，美好的事物自然会向你靠近。

记住，塔罗牌不是预言，而是一面镜子。它反映的是你内心深处已经知道的答案。相信自己，你比想象中更有力量。`

async function mockStream(onChunk: (text: string, type: ChunkType) => void): Promise<void> {
  // 模拟 reasoning 阶段
  for (const char of MOCK_REASONING) {
    onChunk(char, 'reasoning')
    await new Promise(r => setTimeout(r, 10))
  }
  // 模拟 content 阶段
  for (const char of MOCK_READING) {
    onChunk(char, 'content')
    await new Promise(r => setTimeout(r, 15))
  }
}

export async function getReadingStream(
  question: string,
  cards: TarotCard[],
  onChunk: (text: string, type: ChunkType) => void
): Promise<void> {
  // 开发模式：使用 mock 响应
  if (import.meta.env.VITE_DEV_MOCK === 'true') {
    return mockStream(onChunk)
  }

  const cardInfo = cards.map((card, i) => {
    const position = ['过去', '现在', '未来'][i]
    return `${position}：${card.name}（${card.nameEn}）- 关键词：${card.keywords.join('、')} - 基础含义：${card.meaning}`
  }).join('\n')

  const userPrompt = `用户的问题：${question}

抽到的三张牌：
${cardInfo}

请为用户做一个温暖、有洞见的解读，帮助 ta 看见当下的状态，获得启发和力量。`

  const stream = await client.chat.completions.create({
    model: 'google/gemini-3-pro-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8,
    max_tokens: 4096,
    stream: true
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as { content?: string; reasoning?: string }

    if (delta?.reasoning) {
      onChunk(delta.reasoning, 'reasoning')
    }
    if (delta?.content) {
      onChunk(delta.content, 'content')
    }
  }
}
