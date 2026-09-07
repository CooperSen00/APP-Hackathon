// country-population-react/src/services/countryApi.js
const POP_URL = '/api/api/v2/indicator/SP.POP.TOTL?limit=250'; 

export async function fetchCountries() {
  const response = await fetch(POP_URL);
 
  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.statusText}`);
  }
 
  const json = await response.json();
 
  // The API wraps the array in { data: [...] } — unwrap it here so
  // components can just treat the return value as the array itself.
  if (!Array.isArray(json.data)) {
    throw new Error("Unexpected response shape from countries API");
  }
 
  return json.data;
}

export function getFlagUrl(iso2) {
  if (!iso2) return '';
  // flagcdn requires 2-letter iso2 country codes (e.g., 'us', 'se', 'fr')
  return `https://flagcdn.com/w640/${iso2}.png`;
}
 
export default { fetchCountries, getFlagUrl };