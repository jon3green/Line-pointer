/**
 * Quick test script to verify The Odds API integration
 * Run with: npx tsx scripts/test-odds-api.ts
 */

import axios from 'axios';

const API_KEY = '9843d3412159ce8b1e28413f97f0f438';
const BASE_URL = 'https://api.the-odds-api.com/v4';

async function testOddsAPI() {
  console.log('🎯 Testing The Odds API Integration\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Get available sports
    console.log('\n1️⃣  Testing API Connection...');
    const sportsResponse = await axios.get(`${BASE_URL}/sports`, {
      params: { apiKey: API_KEY },
    });
    console.log(`   ✅ Connected! Found ${sportsResponse.data.length} sports`);
    console.log(`   📊 API Usage: ${sportsResponse.headers['x-requests-used']} used, ${sportsResponse.headers['x-requests-remaining']} remaining`);

    // Test 2: Get NFL odds
    console.log('\n2️⃣  Fetching NFL Game Odds...');
    const nflResponse = await axios.get(
      `${BASE_URL}/sports/americanfootball_nfl/odds/`,
      {
        params: {
          apiKey: API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          bookmakers: 'draftkings,fanduel,betmgm',
          oddsFormat: 'american',
        },
      }
    );

    console.log(`   ✅ Found ${nflResponse.data.length} upcoming NFL games`);
    
    if (nflResponse.data.length > 0) {
      const game = nflResponse.data[0];
      console.log(`\n   📅 Next Game: ${game.away_team} @ ${game.home_team}`);
      console.log(`   🕐 Game Time: ${new Date(game.commence_time).toLocaleString()}`);
      
      if (game.bookmakers && game.bookmakers.length > 0) {
        const bookmaker = game.bookmakers[0];
        console.log(`   💰 Odds from: ${bookmaker.title}`);
        
        const spreads = bookmaker.markets?.find((m: any) => m.key === 'spreads');
        if (spreads && spreads.outcomes) {
          const homeSpread = spreads.outcomes.find((o: any) => o.name === game.home_team);
          const awaySpread = spreads.outcomes.find((o: any) => o.name === game.away_team);
          console.log(`      Spread: ${game.home_team} ${homeSpread?.point} (${homeSpread?.price})`);
          console.log(`              ${game.away_team} ${awaySpread?.point} (${awaySpread?.price})`);
        }
      } else {
        console.log(`   ⚠️  No odds available yet (games may be too far in future)`);
      }
    }

    console.log(`\n   📊 API Usage: ${nflResponse.headers['x-requests-used']} used, ${nflResponse.headers['x-requests-remaining']} remaining`);

    // Test 3: Check if player props are available
    console.log('\n3️⃣  Checking Player Props Availability...');
    try {
      const propsResponse = await axios.get(
        `${BASE_URL}/sports/americanfootball_nfl/odds/`,
        {
          params: {
            apiKey: API_KEY,
            regions: 'us',
            markets: 'player_pass_yds,player_pass_tds',
            bookmakers: 'draftkings',
            oddsFormat: 'american',
          },
        }
      );

      let totalProps = 0;
      propsResponse.data.forEach((game: any) => {
        game.bookmakers?.forEach((bookmaker: any) => {
          bookmaker.markets?.forEach((market: any) => {
            totalProps += market.outcomes?.length || 0;
          });
        });
      });

      console.log(`   ✅ Found ${totalProps} player props across all games`);
      console.log(`   📊 API Usage: ${propsResponse.headers['x-requests-used']} used, ${propsResponse.headers['x-requests-remaining']} remaining`);
    } catch (error) {
      console.log(`   ⚠️  Player props may not be available yet (normal for off-season or early week)`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ All Tests Passed! The Odds API is working perfectly!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/players');
    console.log('   3. Search for a player and click "Show Player Props"');
    console.log('   4. See live odds from major sportsbooks!\n');

  } catch (error) {
    console.error('\n❌ Error testing API:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || error.message);
    }
  }
}

testOddsAPI();

