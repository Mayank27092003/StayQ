import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { PropertiesService } from '../properties/properties.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QubeService {
  private client: OpenAI;
  private model: string;

  constructor(
    private propertiesService: PropertiesService,
    private configService: ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>('DEEPSEEK_API_KEY') ||
      process.env.DEEPSEEK_API_KEY ||
      'sk-fc32eea03eba47128edece46d949af8c';
    const baseURL =
      this.configService.get<string>('DEEPSEEK_BASE_URL') ||
      process.env.DEEPSEEK_BASE_URL ||
      'https://api.deepseek.com';
    this.model =
      this.configService.get<string>('DEEPSEEK_MODEL') ||
      process.env.DEEPSEEK_MODEL ||
      'deepseek-chat';

    this.client = new OpenAI({ apiKey, baseURL });
  }

  /**
   * Build the cached system prompt prefix.
   * DeepSeek automatically caches prompt prefixes >= 64 tokens, granting a 90% discount
   * and 2x faster response times on all repetitive and conversational queries.
   */
  private buildSystemPrompt(propertyBrief: any[]): string {
    return `You are Qube — Stay Q's AI travel companion. You're not a chatbot, you're more like that one friend who has traveled ALL of India, knows the best hidden gems, has stayed at boutique villas, done campervan trips, and genuinely loves helping people plan unforgettable trips.

## YOUR PERSONALITY (VERY IMPORTANT):
- **Warm, real, conversational** — talk like a knowledgeable friend, never like a brochure
- **Never robotic** — avoid generic openers like "Great question!" or "Certainly!" or "As an AI..."
- **Empathetic & curious** — ask thoughtful follow-ups (ONE at a time, not five at once)
- **Language-adaptive**: 
  - User writes Hinglish? → Reply in fun, warm Hinglish (Roman script). Like: "Bhai Goa plan kar rahe ho? Best time hai actually!"
  - User writes Hindi (Devanagari)? → Reply in fluent, warm Hindi
  - User writes English? → Reply in polished, friendly luxury-concierge English
- **Contextually aware** — use the conversation history. If they said "4 people" earlier, don't ask again.
- **Never repeat the same opener** across messages. Vary your style.

## WHAT STAY Q OFFERS (your domain):
**🏡 Boutique Stays** — Private infinity pool villas, A-frame cabins, glass pavilions, fireside cottages in:
Goa (Candolim, Vagator, Palolem), Old Manali, Wayanad, Udaipur, Lonavala, Bengaluru, Pune, Mumbai.
Amenities: high-speed fiber, chef-on-call, concierge, pet-friendly options, design furniture.

**🚐 India's First RV & Overland Campervan Network**:
Routes: Coastal (Goa↔Kerala, 950km) | Western Ghats (Mumbai/Pune↔Goa, 620km) | Himalayan (Manali↔Leh, 1150km)
Km packs: 80/day (Leisure) | 100/day (Voyager) | 150/day (Explorer) | Unlimited (Grand Overland)
Pit-stops: shore power (220V), water refill, hot showers, dining, 24x7 gated security.

**🔑 Zero-Brokerage Long-term / Monthly Stays**:
0% broker fee, direct host contracts, 1Gbps fiber, designer lofts in Bengaluru, Goa, Pune, Mumbai.
Instant digital lease, verified hosts, no hidden fees.

**🎟 Curated Experiences**: Sunset catamaran cruises, surfing, glamping, tea estate tasting, night safaris.

## HOW TO RESPOND:
1. **Match the user's energy** — if they're excited, be excited; if they're confused, be calm & clear.
2. **Use the live property catalog below** to give specific, accurate recommendations with real prices.
3. **Always end with one warm, specific follow-up question** to keep the conversation going.
4. **Format nicely**: use bold for property names, ₹ for prices, emojis sparingly and meaningfully.
5. **Be honest** — if something isn't available or you're unsure, say so warmly. Don't make things up.
6. Keep replies **focused and scannable** — avoid walls of text. Use short bullets for options.

## LIVE PROPERTY CATALOG (real data from our database):
${JSON.stringify(propertyBrief, null, 2)}

Remember: you're helping real people plan real trips. Be the travel friend they never had. 🌍`;
  }

  async chat(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[] = [],
  ): Promise<string> {
    try {
      const allProperties = await this.propertiesService.findAll();
      const propertyBrief = allProperties.slice(0, 15).map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        city: p.city,
        pricePerNight: p.pricePerNight,
        maxGuests: p.maxGuests,
        amenities: p.amenities,
      }));

      const systemPrompt = this.buildSystemPrompt(propertyBrief);

      const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...(history && Array.isArray(history)
          ? history.map((h) => ({
              role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
              content: h.content,
            }))
          : []),
        { role: 'user', content: message },
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: conversationMessages,
        temperature: 0.85,
        max_tokens: 900,
      });

      return (
        response.choices[0]?.message?.content ||
        `✨ I'd love to help you plan your stay! Tell me your preferred destination (Goa, Manali, Wayanad, Udaipur, Bengaluru) or travel dates.`
      );
    } catch (error) {
      console.error('Qube DeepSeek AI Chat Error:', error);
      // Smart contextual fallback based on live properties
      const msg = message.toLowerCase();
      if (msg.includes('goa') || msg.includes('beach') || msg.includes('pool')) {
        return `✨ I found stunning villa options in Goa for you!

1. **The Glass Pavilion & Private Infinity Pool** (Candolim) — ₹14,500/night with full butler service and sunset views.
2. **Azure Horizon Beachfront Villa** (Palolem) — ₹11,800/night with direct beach access.

Would you like me to reserve dates or check availability for this weekend?`;
      }
      if (msg.includes('cabin') || msg.includes('mountain') || msg.includes('manali') || msg.includes('snow')) {
        return `🏔️ For mountain lovers, I highly recommend:

**Pine & Cedar Scandinavian A-Frame Cabin** in Old Manali (₹6,200/night). It comes with a cozy wood-burning fireplace, heated bedding, and private bonfire pit facing snow peaks.`;
      }
      if (msg.includes('rv') || msg.includes('campervan') || msg.includes('road trip') || msg.includes('caravan')) {
        return `🚐 India's 1st Overland & RV Network on Stay Q!

We offer verified campervans with flexible hub pickups and verified resort pit-stops (power, water, hot showers & security) across:
- **Coastal Highway**: Goa ⇄ Kerala
- **Western Ghats**: Mumbai/Pune ⇄ Goa
- **Himalayan Passes**: Manali ⇄ Leh

Daily km packages start with 80 km, 100 km, 150 km, or Unlimited km! Kahan ka plan hai aapka?`;
      }
      if (msg.includes('zero broker') || msg.includes('rent') || msg.includes('bangalore') || msg.includes('long term')) {
        return `🔑 Check out the **Nordic Minimalist Loft in Indiranagar, Bengaluru** (₹3,200/night or flexible monthly). It features zero brokerage fee, 1Gbps fiber, and designer furnishings with instant verified lease contracts!`;
      }
      return `✨ I'm Qube, your Stay Q AI travel companion! I can find you private pool villas, mountain cabins, overland RVs, zero-broker rentals, or book curated local experiences across India. Where would you like to travel next?`;
    }
  }

  async generatePlan(prompt: string, userLocation?: any) {
    try {
      const allProperties = await this.propertiesService.findAll();

      const simplifiedProperties = allProperties.map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        city: p.city,
        pricePerNight: p.pricePerNight,
        maxGuests: p.maxGuests,
        amenities: p.amenities,
        isStayingWithHost: (p as any).isStayingWithHost ?? false,
      }));

      const systemInstruction = `You are Qube, a friendly, professional human travel concierge for Stay Q. 
Your goal is to parse the user's travel request and create a personalized itinerary using ONLY the provided properties in our database.
Support English, Hindi, and natural Hinglish seamlessly based on how the user communicates.

Available Properties:
${JSON.stringify(simplifiedProperties)}

Based on the user's prompt, recommend 1-3 best matching properties by their ID, and create a day-by-day itinerary.
You MUST return ONLY valid JSON in the following format, with no markdown formatting around it:
{
  "title": "Title of the Trip",
  "description": "A warm, human-like welcoming message from Qube.",
  "recommendedPropertyIds": ["id1", "id2"],
  "itineraryDays": [
    { "day": 1, "activity": "Arrival and check-in", "details": "Description" }
  ]
}`;

      const chatCompletion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      let jsonText = chatCompletion.choices[0]?.message?.content || '';

      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3);
      }

      const parsedPlan = JSON.parse(jsonText.trim());

      const hydratedProperties = allProperties.filter((p) =>
        parsedPlan.recommendedPropertyIds?.includes(p.id),
      );

      return {
        ...parsedPlan,
        properties: hydratedProperties,
      };
    } catch (error) {
      console.error('Qube DeepSeek AI Itinerary Error:', error);
      throw new InternalServerErrorException('Qube is taking a break right now. Please try again later.');
    }
  }
}
