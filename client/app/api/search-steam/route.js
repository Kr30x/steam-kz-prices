import { NextResponse } from 'next/server';
import axios from 'axios';

async function getPrice(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?filters=price_overview&appids=${appId}&cc=KZ`);
    const data = response.data[appId].data;
    if (data && data.price_overview) {
      return data.price_overview.final / 100; // Convert from cents to KZT
    }
    return null; // Return null if price data is not available
  } catch (error) {
    console.error(`Error fetching price for app ${appId}:`, error);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=KZ`);

    const games = await Promise.all(response.data.items.map(async item => {
      const price = await getPrice(item.id);
      return {
        id: item.id,
        name: item.name,
        price: price ? price : 'Free',
        image: item.tiny_image
      };
    }));

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching data from Steam:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Steam' }, { status: 500 });
  }
}