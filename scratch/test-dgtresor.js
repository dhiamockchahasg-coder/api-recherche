
async function test() {
  console.log('Fetching DGTrésor...');
  const t0 = Date.now();
  try {
    const res = await fetch('https://gels-avoirs.dgtresor.gouv.fr/ApiPublic/api/v1/publication/derniere-publication-fichier-json', {
       headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Size:', (text.length / 1024 / 1024).toFixed(2), 'MB');
    console.log('Time:', Date.now() - t0, 'ms');
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
