import { GoogleGenAI, Type } from "@google/genai";
import { ContentType, Idea, GeneratedContent, IdeaStatus, ContentTone, ContentFormat, ContentQuality } from "../types";

// Helper to sanitize JSON string if the model adds markdown code blocks
const cleanJsonString = (str: string) => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

// Helper to clean AI artifacts from the final content
const cleanContentArtifacts = (content: string) => {
  let cleaned = content;

  // Remove "Title: ..." if it appears at the start
  cleaned = cleaned.replace(/^#?\s*(Title|Article Title):\s*.+\n+/, '');

  // Remove generic AI intro lines if they slip through
  cleaned = cleaned.replace(/^(Here is a|Here is the|Here's a|In this article|In today's|In the landscape|It is important to|When it comes to).+(:|\.)\n+/gi, '');

  // Remove vague AI openings from first paragraph
  cleaned = cleaned.replace(/^(In the rapidly evolving|In today's digital|As we navigate|It has become increasingly).+\n+/gi, '');

  // CRITICAL: Remove Em-Dashes (—) globally. Replace with standard hyphen surrounded by spaces
  cleaned = cleaned.replace(/—/g, ' - ');

  // Remove any accidental bullet points that might have slipped through (start of lines)
  cleaned = cleaned.replace(/^[\s]*[•\-*]\s+/gm, '');

  return cleaned.trim();
};

// Calculate content quality metrics (Flesch-Kincaid based)
export const calculateContentQuality = (content: string): ContentQuality => {
  // Strip markdown for analysis
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');

  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllables / Math.max(wordCount, 1);

  // Flesch Reading Ease Score (0-100, higher = easier)
  const fleschScore = Math.round(
    206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  );
  const readabilityScore = Math.max(0, Math.min(100, fleschScore));

  // Reading time (average 200 words per minute)
  const estimatedReadTime = Math.ceil(wordCount / 200);

  // Generate uniqueness indicators
  const uniquenessIndicators: string[] = [];
  if (wordCount > 800) uniquenessIndicators.push('Long-form content');
  if (content.includes('##')) uniquenessIndicators.push('Well-structured with headings');
  if (content.match(/\d+\./g)?.length >= 5) uniquenessIndicators.push('Numbered points included');
  if (avgWordsPerSentence < 20) uniquenessIndicators.push('Clear, concise sentences');

  // Generate improvement suggestions
  const suggestedImprovements: string[] = [];
  if (avgWordsPerSentence > 25) {
    suggestedImprovements.push('Consider breaking up long sentences for better readability');
  }
  if (readabilityScore < 50) {
    suggestedImprovements.push('Use simpler words to improve accessibility');
  }
  if (wordCount < 500) {
    suggestedImprovements.push('Consider expanding content for more depth');
  }
  if (!content.includes('##')) {
    suggestedImprovements.push('Add section headings to improve structure');
  }

  return {
    readabilityScore,
    estimatedReadTime,
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    uniquenessIndicators,
    suggestedImprovements
  };
};

// Simple syllable counter
const countSyllables = (word: string): number => {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

// Generate numbered format title suggestions
const generateNumberedTitles = (category: string): string[] => {
  const numbers = [5, 6, 7, 8, 10, 12, 15];
  const formats = [
    '{n} Steps to Master {topic}',
    '{n} Common Mistakes When {topic}',
    '{n} Ways to Improve Your {topic}',
    '{n} Things You Need to Know About {topic}',
    '{n} Tips for Better {topic}',
    '{n} Secrets to Successful {topic}',
    'Top {n} {topic} Strategies That Work',
    '{n} Proven Methods for {topic}'
  ];

  const suggestions: string[] = [];
  for (let i = 0; i < 4; i++) {
    const num = numbers[Math.floor(Math.random() * numbers.length)];
    const format = formats[Math.floor(Math.random() * formats.length)];
    suggestions.push(format.replace('{n}', String(num)).replace('{topic}', category));
  }
  return suggestions;
};

export const generateIdeas = async (
  category: string,
  excludeTopics: string[],
  isNews: boolean
): Promise<Idea[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-pro-preview";

  const isAutoMode = !category.trim();
  const excludeString = excludeTopics.length > 0
    ? `Do NOT suggest the following topics as they have already been covered: ${excludeTopics.join(", ")}.`
    : "";

  let prompt = "";

  if (isAutoMode) {
    prompt = `
      You are an expert Content Strategist who creates ACTIONABLE content ideas.
      
      Task: Generate viral content ideas that people actually want to read.
      
      1. Identify 5 DISTINCT, high-potential ${isNews ? "trending news" : "evergreen/educational"} niches.
      2. For EACH category, generate 4 high-quality article ideas. (Total 20 ideas).
      3. ${excludeString}
      
      CRITICAL TITLE RULES:
      - Mix formats: Include NUMBERED titles like "10 Steps to...", "7 Common Mistakes...", "5 Ways to..."
      - At least 50% of titles MUST be numbered format
      - Natural, full sentences. NO colon-style titles.
      - Titles should promise SPECIFIC, ACTIONABLE value
      
      BAD TITLES (avoid):
      - "Understanding the Basics of SEO" (too vague)
      - "A Guide to Content Marketing" (too generic)
      
      GOOD TITLES (use these patterns):
      - "7 SEO Mistakes That Are Killing Your Traffic"
      - "10 Steps to Building Your First Successful Blog"
      - "5 Things Every New Blogger Gets Wrong"
      
      Output JSON Schema:
      [
        {
          "category": "string (The Niche Name)",
          "title": "string",
          "brief": "string (What specific problem this solves)",
          "trendContext": "string (Why people search for this)",
          "suggestedFormat": "string (NUMBERED_LIST | STEP_BY_STEP | PROBLEM_SOLUTION | STANDARD)"
        }
      ]
    `;
  } else {
    prompt = `
      You are an expert Content Strategist who creates ACTIONABLE content ideas.
      
      Category: "${category}".
      Type: ${isNews ? "Trending News" : "Educational/Informational"}.
      
      Task:
      1. Use Google Search to find what people are ACTUALLY searching for.
      2. Generate exactly 20 ideas that solve REAL problems.
      3. ${excludeString}
      
      CRITICAL TITLE RULES:
      - Include NUMBERED titles: "10 Steps to...", "7 Mistakes to Avoid...", "5 Ways to..."
      - At least 50% of titles MUST use numbered format
      - Titles promise SPECIFIC outcomes, not vague benefits
      
      BAD: "How to Improve Your ${category}" (too vague)
      GOOD: "7 ${category} Mistakes That Cost You Money (And How to Fix Them)"
      
      Output JSON Schema:
      [
        {
          "category": "${category}",
          "title": "string",
          "brief": "string (The specific problem this addresses)",
          "trendContext": "string (Search volume or trend data)",
          "suggestedFormat": "string (NUMBERED_LIST | STEP_BY_STEP | PROBLEM_SOLUTION | STANDARD)"
        }
      ]
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(cleanJsonString(text));

    return parsed.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      title: item.title,
      brief: item.brief,
      searchTrendContext: item.trendContext,
      suggestedFormat: item.suggestedFormat || 'STANDARD',
      status: IdeaStatus.SUGGESTED,
      category: item.category || category
    }));

  } catch (error) {
    console.error("Error generating ideas:", error);
    throw error;
  }
};

// Get format-specific structure for content generation
const getFormatStructure = (format: ContentFormat, tone: ContentTone): string => {
  switch (format) {
    case ContentFormat.NUMBERED_LIST:
      return `
        STRUCTURE: NUMBERED GUIDE FORMAT
        
        Write content with NUMBERED H2 HEADINGS (## 1. Title, ## 2. Title, etc.)
        
        For EACH numbered point:
        1. Start with a CLEAR, ACTION-ORIENTED heading
        2. First sentence: State the problem or what goes wrong
        3. Second paragraph: Explain WHY it matters (in simple terms)
        4. Third paragraph: Give the ACTIONABLE solution
        
        EXAMPLE FORMAT TO FOLLOW:
        
        ## 1. Applying with Too Little Content
        
        One of the biggest mistakes is being too in a hurry. If you have only five or six posts on your blog, it is likely to be rejected for "Low Value Content."
        
        A blog needs to look like a finished project, not a work in progress. Most experts suggest having at least 15 to 20 high-quality, long-form articles before you even think about applying. Each article should be well-structured and provide real value to the reader.
        
        ## 2. [Next Point]
        ...and so on
      `;

    case ContentFormat.STEP_BY_STEP:
      return `
        STRUCTURE: STEP-BY-STEP GUIDE
        
        Write clear, sequential steps using ## Step 1:, ## Step 2:, etc.
        
        For EACH step:
        1. Clear action in the heading
        2. What to do (specific instructions)
        3. Why this step matters
        4. Common mistakes to avoid
        5. How to know when you've completed it
        
        Make each step self-contained and actionable.
      `;

    case ContentFormat.PROBLEM_SOLUTION:
      return `
        STRUCTURE: PROBLEM → SOLUTION FORMAT
        
        ## The Problem
        - State the problem clearly and specifically
        - Show you understand the reader's pain
        
        ## Why This Happens
        - Root causes (2-3 main reasons)
        
        ## The Solution
        - Clear, actionable steps to fix it
        
        ## How to Implement
        - Practical implementation guide
        
        ## Results to Expect
        - What success looks like
      `;

    case ContentFormat.FAQ_STYLE:
      return `
        STRUCTURE: FAQ FORMAT
        
        Use question headings: ## What is...? ## How do I...? ## Why does...?
        
        For EACH question:
        1. Answer directly in the first sentence
        2. Provide context and explanation
        3. Give practical examples
        4. Include actionable next steps
      `;

    case ContentFormat.TIPS_TRICKS:
      return `
        STRUCTURE: TIPS & TRICKS FORMAT
        
        Use ## Tip 1:, ## Tip 2:, etc.
        
        For EACH tip:
        1. Quick, actionable advice
        2. Why it works
        3. How to implement immediately
        4. Pro tip or advanced variation
      `;

    default:
      // Standard format based on tone
      switch (tone) {
        case ContentTone.PROBLEM_SOLVING:
          return `
            - Intro: State the problem clearly and why it hurts/matters.
            - H2: "Understanding the Issue".
            - H2: [Solution 1]. Detailed paragraph.
            - H2: [Solution 2]. Detailed paragraph.
            - H2: [Final Thoughts/Next Steps].
          `;
        case ContentTone.ENTERTAINMENT:
          return `
            - Intro: High-energy hook.
            - Body: Witty subheadings.
            - Narrative flow.
            - Ending: "Why This Matters".
          `;
        case ContentTone.BUSINESS:
          return `
            - Executive Summary.
            - H2: Market Context.
            - H2: Strategic Insights.
            - H2: Implementation & ROI.
            - Ending: "Looking Ahead".
          `;
        default:
          return `
            - Intro: Definition and relevance.
            - H2: [Concept 1]
            - H2: [Concept 2]
            - H2: [Concept 3]
            - Ending: Key Takeaways.
          `;
      }
  }
};

export const writeContent = async (
  idea: Idea,
  platform: ContentType,
  tone: ContentTone,
  format: ContentFormat = ContentFormat.STANDARD,
  minWordCount: number = 800,
  customInstructions: string = ""
): Promise<GeneratedContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-pro-preview";

  const structureGuide = getFormatStructure(format, tone);

  const prompt = `
    You are an elite professional content writer who writes ACTIONABLE, NO-FLUFF content.
    
    TASK: Write a high-quality article/post AND generate social media snippets.
    TOPIC: "${idea.title}"
    CONTEXT: ${idea.brief}
    PLATFORM: ${platform}
    TONE: ${tone}
    FORMAT: ${format}
    MINIMUM WORD COUNT: ${minWordCount} words.
    
    *** CRITICAL WRITING RULES - READ CAREFULLY ***
    
    1. NEVER start with vague, generic AI intros like:
       ❌ "In the landscape of digital marketing..."
       ❌ "It is important to consider..."
       ❌ "In today's rapidly evolving world..."
       ❌ "As we navigate the complexities of..."
       
    2. INSTEAD, jump DIRECTLY into actionable information:
       ✅ "Applying to AdSense with only 5 posts? That's the fastest way to get rejected."
       ✅ "Your blog is getting traffic but no sales. Here's why."
       ✅ "Most beginners make this mistake in their first week."
    
    3. USE SIMPLE ENGLISH that anyone can understand:
       - Short sentences (under 20 words when possible)
       - Common words over jargon
       - Active voice, not passive
       - Talk TO the reader, not AT them
    
    4. Each section should:
       - State the problem/point clearly
       - Explain why it matters
       - Give specific, actionable advice
       - Use real examples when possible
    
    *** USER CUSTOM INSTRUCTIONS (HIGHEST PRIORITY) ***
    "${customInstructions || "None provided. Use default structure."}"
    
    *** CONTENT STRUCTURE ***
    ${structureGuide}

    *** FORMATTING RULES ***
    1. **NO BULLET LISTS**: Use H2 Headings and paragraphs, NOT bullet points
    2. **HEADINGS**: Use Markdown H2 (##). For numbered formats, use "## 1. Title", "## 2. Title"
    3. **NO 'CONCLUSION' HEADING**: Use a descriptive phrase instead
    4. **NO EM-DASHES**: Use hyphens (-)
    5. **CONTENT**: Deep, original, high-value - every paragraph should teach something
    
    *** EXTRA OUTPUTS REQUIRED ***
    1. **SEO Keywords**: List 5-8 high-value keywords for this article.
    2. **Social Snippets**: 
       - Twitter/X: A punchy, viral thread starter or tweet (max 280 chars).
       - LinkedIn: A professional summary/teaser (max 600 chars).
    
    Output Format: JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4096 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "Full markdown article content" },
            imageSearchTerm: { type: Type.STRING, description: "Precise image search query" },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "SEO Keywords" },
            socialSnippets: {
              type: Type.OBJECT,
              properties: {
                twitter: { type: Type.STRING, description: "Viral tweet text" },
                linkedin: { type: Type.STRING, description: "LinkedIn post text" }
              }
            }
          },
          required: ["content", "imageSearchTerm", "keywords", "socialSnippets"]
        }
      },
    });

    const result = JSON.parse(cleanJsonString(response.text || "{}"));
    const finalContent = cleanContentArtifacts(result.content);

    // Calculate quality metrics
    const quality = calculateContentQuality(finalContent);

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || ""
      }))
      .filter((s: any) => s.uri !== "") || [];

    const encodedTerm = encodeURIComponent(result.imageSearchTerm || idea.title);
    const imageUrl = `https://picsum.photos/seed/${encodedTerm}/800/600`;

    return {
      id: idea.id,
      title: idea.title,
      content: finalContent,
      imageSearchTerm: result.imageSearchTerm,
      imageUrl: imageUrl,
      platform: platform,
      tone: tone,
      format: format,
      wordCount: quality.wordCount,
      sources: sources,
      keywords: result.keywords || [],
      socialSnippets: result.socialSnippets || { twitter: "", linkedin: "" },
      quality: quality,
      createdAt: Date.now()
    };

  } catch (error) {
    console.error("Error writing content:", error);
    throw error;
  }
};

// Regenerate a specific section of content
export const regenerateSection = async (
  sectionContent: string,
  context: string,
  instruction: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-pro-preview";

  const prompt = `
    You are an expert content editor.
    
    ORIGINAL SECTION:
    "${sectionContent}"
    
    ARTICLE CONTEXT:
    "${context}"
    
    USER INSTRUCTION:
    "${instruction}"
    
    Rewrite ONLY this section following the instruction. Keep the same general structure but improve based on the request.
    
    RULES:
    - Use simple, clear English
    - Jump straight to actionable content
    - No vague introductions
    - Return ONLY the rewritten section, no explanations
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text?.trim() || sectionContent;
  } catch (error) {
    console.error("Error regenerating section:", error);
    throw error;
  }
};