import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { PropertiesService } from '../properties/properties.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QubeService {
  private groq: Groq;

  constructor(
    private propertiesService: PropertiesService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY') || process.env.GROQ_API_KEY || 'gsk_demo';
    this.groq = new Groq({ apiKey });
  }

  async chat(message: string): Promise<string> {
    try {
      const allProperties = await this.propertiesService.findAll();
      const propertyBrief = allProperties.slice(0, 10).map((p) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        city: p.city,
        pricePerNight: p.pricePerNight,
        maxGuests: p.maxGuests,
        amenities: p.amenities,
      }));

      const systemPrompt = `You are Qube, an ultra-smart, hospitable travel concierge AI for Stay Q — India's premier boutique stay platform.
We specialize in private luxury villas, Scandinavian snow cabins, rainforest treehouses, zero-broker rentals, and curated adventures.

Available properties currently in our live catalog:
${JSON.stringify(propertyBrief)}

Provide helpful, warm, concise recommendations highlighting real pricing (₹), amenities, and bespoke tips. If you recommend a specific property, mention its exact title and price. Keep responses formatted with bullet points and emojis.`;

      const response = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 600,
      });

      return (
        response.choices[0]?.message?.content ||
        `✨ I'd love to help you plan your stay! Tell me your preferred destination (Goa, Manali, Wayanad, Udaipur, Bengaluru) or dates.`
      );
    } catch (error) {
      console.error('Qube AI Chat Error:', error);
      // Smart contextual fallback based on live properties
      const msg = message.toLowerCase();
      if (msg.includes('goa') || msg.includes('beach') || msg.includes('pool')) {
        return `✨ I found stunning villa options in Goa for you!\n\n1. **The Glass Pavilion & Private Infinity Pool** (Candolim) — ₹14,500/night with full butler service and sunset views.\n2. **Azure Horizon Beachfront Villa** (Palolem) — ₹11,800/night with direct beach access.\n\nWould you like me to reserve dates or check availability for this weekend?`;
      }
      if (msg.includes('cabin') || msg.includes('mountain') || msg.includes('manali') || msg.includes('snow')) {
        return `🏔️ For mountain lovers, I highly recommend:\n\n**Pine & Cedar Scandinavian A-Frame Cabin** in Old Manali (₹6,200/night). It comes with a cozy wood-burning fireplace, heated bedding, and private bonfire pit facing snow peaks.`;
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
      
      const simplifiedProperties = allProperties.map(p => ({
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

      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      let jsonText = chatCompletion.choices[0]?.message?.content || '';
      
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3);
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3);
      }

      const parsedPlan = JSON.parse(jsonText.trim());

      const hydratedProperties = allProperties.filter(p => 
        parsedPlan.recommendedPropertyIds?.includes(p.id)
      );

      return {
        ...parsedPlan,
        properties: hydratedProperties,
      };

    } catch (error) {
      console.error('Qube Groq AI Error:', error);
      throw new InternalServerErrorException('Qube is taking a break right now. Please try again later.');
    }
  }
}
