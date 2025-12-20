import OpenAI from 'openai'
import type { TarotCard } from '../data/tarot'

const client = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: import.meta.env.VITE_ZENMUX_API_KEY,
  dangerouslyAllowBrowser: true
})

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

export async function getReading(question: string, cards: TarotCard[]): Promise<string> {
  const cardInfo = cards.map((card, i) => {
    const position = ['过去', '现在', '未来'][i]
    return `${position}：${card.name}（${card.nameEn}）- 关键词：${card.keywords.join('、')} - 基础含义：${card.meaning}`
  }).join('\n')

  const userPrompt = `用户的问题：${question}

抽到的三张牌：
${cardInfo}

请为用户做一个温暖、有洞见的解读，帮助 ta 看见当下的状态，获得启发和力量。`

  const response = await client.chat.completions.create({
    model: 'gpt-5.2',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8,
    max_tokens: 800
  })

  return response.choices[0]?.message?.content || '无法生成解读，请稍后重试。'
}
