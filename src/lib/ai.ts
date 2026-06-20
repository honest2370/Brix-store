import { supabase } from "./supabase";
import type { ApiKeyConfig } from "./types";

export async function getActiveKey(): Promise<ApiKeyConfig | null> {
  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  return (data as ApiKeyConfig) || null;
}

// Unified adapter for multiple providers. Keys are admin-managed in DB.
export async function aiChat(
  messages: { role: string; content: string }[]
): Promise<string> {
  const key = await getActiveKey();
  if (!key || !key.key_value) {
    return demoReply(messages[messages.length - 1]?.content || "");
  }
  try {
    const provider = key.provider.toLowerCase();
    if (provider.includes("openai") || provider.includes("grok") || provider.includes("xai") || provider.includes("groq")) {
      const base =
        provider.includes("grok") || provider.includes("xai")
          ? "https://api.x.ai/v1/chat/completions"
          : provider.includes("groq")
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
      const res = await fetch(base, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key.key_value}`,
        },
        body: JSON.stringify({
          model: key.model || "gpt-4o-mini",
          messages,
        }),
      });
      const j = await res.json();
      return j.choices?.[0]?.message?.content || demoReply("");
    }
    if (provider.includes("gemini") || provider.includes("google")) {
      const model = key.model || "gemini-1.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.key_value}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          }),
        }
      );
      const j = await res.json();
      return (
        j.candidates?.[0]?.content?.parts?.[0]?.text || demoReply("")
      );
    }
    if (provider.includes("anthropic") || provider.includes("claude")) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key.key_value,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: key.model || "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: messages.filter((m) => m.role !== "system"),
        }),
      });
      const j = await res.json();
      return j.content?.[0]?.text || demoReply("");
    }
    return demoReply("");
  } catch {
    return "⚠️ The AI service is currently unavailable. The admin may need to add or rotate an API key.";
  }
}

function demoReply(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("how") && (p.includes("use") || p.includes("template")))
    return "To use this item, open it in your library after approval, then follow the included 'What you'll get' guide. Duplicate any Notion/Canva links to your own workspace and customize. Need a specific walkthrough?";
  if (p.includes("description") || p.includes("seo") || p.includes("tags"))
    return "Here's a polished listing draft:\n\n**Title:** Premium Productivity Toolkit\n**Description:** A beautifully designed, ready-to-use system that saves you hours every week. Plug-and-play, fully customizable, and built for results.\n**Tags:** productivity, template, notion, workflow, premium\n**Suggested price:** $19–29";
  return "I'm the Brixnode AI assistant. I can help you write product listings, explain how to use purchased items, suggest pricing, and answer marketplace questions. (Admin: add an API key in the Admin → AI Keys panel to enable live AI.)";
}

// ------------------------------------------------------------------
// Structured AI helpers — listing auto-fill, auto-tag, promo message,
// smart search. Each asks the model for strict JSON and falls back to
// a sensible offline default if the model is unavailable or returns
// something unparseable, so these never block the seller's workflow.
// ------------------------------------------------------------------

function extractJson(raw: string): Record<string, unknown> | null {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface AiListingFields {
  short_desc: string;
  description: string;
  whats_included: string;
}

/** Generates short description, full description, and "what you'll get" from a title. */
export async function aiAutoFillListing(title: string, typeLabel: string, priceUsd?: string): Promise<AiListingFields> {
  const prompt = `You are a digital product copywriter for Brixnode, a digital marketplace.
Generate professional, compelling sales copy.
Product: "${title}"
Category: ${typeLabel}
Price: ${priceUsd ? "$" + priceUsd : "not specified"}

Reply ONLY with valid JSON, no markdown, no backticks:
{"short_desc":"one catchy sentence, max 100 chars","description":"3-4 persuasive sentences","whats_included":"4-5 lines, one item per line, no bullets needed"}`;
  const raw = await aiChat([{ role: "user", content: prompt }]);
  const parsed = extractJson(raw);
  if (parsed) {
    return {
      short_desc: String(parsed.short_desc || ""),
      description: String(parsed.description || ""),
      whats_included: String(parsed.whats_included || ""),
    };
  }
  return {
    short_desc: `${title} — everything you need, ready to use.`,
    description: raw,
    whats_included: "",
  };
}

export interface AiTagResult {
  category: string;
  tags: string[];
}

/** Suggests a category and 4-6 tags from a title/description. */
export async function aiAutoTagListing(title: string, description: string): Promise<AiTagResult> {
  const prompt = `You are a marketplace categorization expert for Brixnode.
Product: "${title}"
Description: "${(description || "").slice(0, 200)}"
Categories available: Templates, AI Prompt Packs, Courses & Guides, eBooks, Presets & LUTs, Graphics & Icons, Fonts, Planners & Printables, Accounts, Proxies, Other Assets

Reply ONLY as JSON: {"category":"...","tags":["tag1","tag2","tag3","tag4","tag5","tag6"]}`;
  const raw = await aiChat([{ role: "user", content: prompt }]);
  const parsed = extractJson(raw);
  if (parsed && Array.isArray(parsed.tags)) {
    return { category: String(parsed.category || ""), tags: (parsed.tags as unknown[]).map(String) };
  }
  return { category: "Other Assets", tags: [] };
}

/** Writes a short, shareable promo message (for WhatsApp/social) for a product. */
export async function aiGeneratePromo(title: string, priceLabel: string, lang: "en" | "fr" = "en"): Promise<string> {
  const prompt =
    lang === "fr"
      ? `Écris un message court et percutant pour promouvoir ce produit numérique sur Brixnode.\nProduit: "${title}" — Prix: ${priceLabel}\nRends-le urgent, ajoute des emojis, un appel à l'action avec [LIEN], max 5 lignes. Français seulement.`
      : `Write a short, punchy broadcast message to promote this digital product on Brixnode marketplace.\nProduct: "${title}" — Price: ${priceLabel}\nMake it urgent, include emojis, a call to action with a link placeholder [LINK], max 5 lines. English only.`;
  return aiChat([{ role: "user", content: prompt }]);
}

/** Asks the model to turn a free-text query into marketplace search filters. */
export async function aiSmartSearch(query: string, availableTypes: string[]): Promise<{ keywords: string; type: string }> {
  const prompt = `A shopper on a digital marketplace typed: "${query}"
Available product categories: ${availableTypes.join(", ")}
Reply ONLY as JSON: {"keywords":"2-4 best search keywords from their query","type":"best matching category from the list, or empty string if none fit"}`;
  const raw = await aiChat([{ role: "user", content: prompt }]);
  const parsed = extractJson(raw);
  if (parsed) {
    return { keywords: String(parsed.keywords || query), type: String(parsed.type || "") };
  }
  return { keywords: query, type: "" };
}
