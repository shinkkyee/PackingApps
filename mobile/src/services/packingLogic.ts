export interface PackingItem {
  name: string;
  category: 'Essentials' | 'Clothing' | 'Electronics' | 'Documents' | 'Toiletries' | 'Other';
}

/**
 * Member 2 - Backend Logic & Database Developer
 * Core logic for generating smart packing lists.
 * Features: Dynamic Quantities, International Detection, Activity-Based Scanning, and Emergency Logic.
 */
export const generatePackingList = (
  tripType: string,
  weatherData: any | null,
  startDate?: string,
  endDate?: string,
  destination: string = "",
  travelMethod: string = "flight",
  luggageType: string = "checked"
): PackingItem[] => {
  const items: PackingItem[] = [
    { name: 'Passport/ID', category: 'Documents' },
    { name: 'Travel Tickets', category: 'Documents' },
    { name: 'Phone Charger', category: 'Electronics' },
  ];

  const lowerType = tripType.toLowerCase();
  const lowerDest = destination.toLowerCase();

  // 1. Duration & Quantity Logic
  let diffDays = 1;
  let isOvernight = false;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    if (diffDays >= 1 && start.toDateString() !== end.toDateString()) isOvernight = true;
  }

  // Dynamic Quantities based on duration
  items.push({ name: `${diffDays}x Underwear & Socks`, category: 'Clothing' });
  if (lowerType === 'business') {
    items.push({ name: `${Math.min(diffDays, 3)}x Business Outfits`, category: 'Clothing' });
  } else {
    items.push({ name: `${diffDays}x Casual Outfits`, category: 'Clothing' });
  }

  // 2. International Travel Logic
  // Assuming home is Malaysia. If destination doesn't mention Malaysia or MY, add adapter.
  const isInternational = !lowerDest.includes('malaysia') && !lowerDest.endsWith(', my') && !lowerDest.includes(' my') && lowerDest.length > 0;
  if (isInternational) {
    items.push({ name: 'Universal Travel Adapter', category: 'Electronics' });
    items.push({ name: 'Travel Insurance Documents', category: 'Documents' });
    items.push({ name: 'Foreign Currency/Travel Card', category: 'Essentials' });
  }

  // 3. Activity-Based Keyword Logic (Smart Scanning)
  if (lowerDest.includes('beach') || lowerDest.includes('island') || lowerDest.includes('bali') || lowerDest.includes('phuket')) {
    items.push({ name: 'Swimwear', category: 'Clothing' });
    items.push({ name: 'Beach Towel', category: 'Essentials' });
    items.push({ name: 'Flip Flops', category: 'Clothing' });
  }
  
  if (lowerDest.includes('pool') || lowerDest.includes('resort')) {
    if (!items.some(i => i.name === 'Swimwear')) {
      items.push({ name: 'Swimwear', category: 'Clothing' });
    }
  }

  // 4. Emergency & Trip Type Logic
  switch (lowerType) {
    case 'business':
      items.push({ name: 'Laptop & Charger', category: 'Electronics' });
      items.push({ name: 'Business Cards', category: 'Documents' });
      break;
    case 'beach':
      if (!items.some(i => i.name === 'Swimwear')) items.push({ name: 'Swimwear', category: 'Clothing' });
      items.push({ name: 'Sunscreen', category: 'Essentials' });
      items.push({ name: 'Sunglasses', category: 'Essentials' });
      break;
    case 'hiking':
      items.push({ name: 'Hiking Boots', category: 'Clothing' });
      items.push({ name: 'Backpack', category: 'Essentials' });
      items.push({ name: 'Water Bottle', category: 'Essentials' });
      // Emergency Logic for Hiking
      items.push({ name: 'First Aid Kit (Emergency)', category: 'Essentials' });
      items.push({ name: 'Whistle & Flashlight', category: 'Essentials' });
      items.push({ name: 'Offline Maps (Downloaded)', category: 'Documents' });
      items.push({ name: 'Insect Repellent', category: 'Essentials' });
      break;
    case 'winter':
      items.push({ name: 'Heavy Jacket', category: 'Clothing' });
      items.push({ name: 'Thermal Wear', category: 'Clothing' });
      items.push({ name: 'Gloves & Scarf', category: 'Clothing' });
      break;
  }

  // Makeup/Cosmetics (Available for day trips, except hiking)
  if (lowerType !== 'hiking') {
    items.push({ name: 'Makeup/Cosmetics', category: 'Toiletries' });
  }

  // Overnight Items Logic
  if (isOvernight) {
    items.push({ name: 'Toothbrush & Paste', category: 'Toiletries' });
    items.push({ name: 'Shampoo & Body Wash', category: 'Toiletries' });
    items.push({ name: 'Skincare Products', category: 'Toiletries' });
    items.push({ name: 'Pyjamas/Sleepwear', category: 'Clothing' });
  }

  // 5. Weather-Based Logic
  if (weatherData && weatherData.days && weatherData.days.length > 0) {
    const hasRain = weatherData.days.some((d: any) => d.morning?.hasRain || d.noon?.hasRain || d.night?.hasRain);
    const avgTemp = weatherData.days.reduce((acc: number, d: any) => {
      const dayTemp = (d.morning?.temp || d.noon?.temp || d.night?.temp || 25);
      return acc + dayTemp;
    }, 0) / weatherData.days.length;

    if (hasRain) {
      items.push({ name: 'Umbrella', category: 'Essentials' });
      items.push({ name: 'Raincoat', category: 'Clothing' });
    }

    if (avgTemp < 15 && lowerType !== 'winter') {
      items.push({ name: 'Light Jacket/Sweater', category: 'Clothing' });
    }
  }

  // 6. Travel Method and Luggage-Based Logic
  const lowerMethod = travelMethod?.toLowerCase() || 'flight';
  const lowerLuggage = luggageType?.toLowerCase() || 'checked';

  if (lowerMethod === 'flight') {
    items.push({ name: 'Power Bank (Must be Handcarry)', category: 'Electronics' });
    items.push({ name: 'Travel Liquid Bottles (≤100ml)', category: 'Toiletries' });
    items.push({ name: 'Earplugs/Sleep Mask', category: 'Essentials' });
  } else if (lowerMethod === 'road_trip') {
    items.push({ name: 'Car Charger Adapter', category: 'Electronics' });
    items.push({ name: 'Road Trip Snacks', category: 'Essentials' });
    items.push({ name: 'Travel Pillow', category: 'Essentials' });
  } else if (lowerMethod === 'train') {
    items.push({ name: 'Headphones/Entertainment', category: 'Electronics' });
    items.push({ name: 'Comfortable Neck Pillow', category: 'Essentials' });
  } else if (lowerMethod === 'cruise') {
    items.push({ name: 'Motion Sickness Pills', category: 'Essentials' });
    items.push({ name: 'Formal Dinner Attire', category: 'Clothing' });
  }

  if (lowerLuggage === 'checked') {
    items.push({ name: 'TSA Approved Luggage Lock', category: 'Essentials' });
    items.push({ name: 'Baggage Identification Tags', category: 'Essentials' });
  } else if (lowerLuggage === 'handcarry') {
    items.push({ name: 'Minimal Toiletries Pack', category: 'Toiletries' });
  }

  // Final Cleanup: Remove duplicates
  return items.filter((item, index, self) =>
    index === self.findIndex((t) => t.name === item.name)
  );
};
