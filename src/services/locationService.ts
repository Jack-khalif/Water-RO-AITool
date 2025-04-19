export const kenyaCounties = [
  {
    name: 'Nairobi',
    subCounties: ['Westlands', 'Dagoretti', 'Langata', 'Kibra', 'Kasarani'],
    travelCostMultiplier: 1.0
  },
  {
    name: 'Mombasa',
    subCounties: ['Changamwe', 'Jomvu', 'Kisauni', 'Nyali', 'Likoni'],
    travelCostMultiplier: 1.3
  },
  // Add other counties...
];

export function getTravelCost(county: string, subCounty: string): number {
  const location = kenyaCounties.find(c => c.name === county);
  if (!location) return 0;
  
  // Base cost + sub-county adjustment
  return 5000 * location.travelCostMultiplier + 
    (location.subCounties.indexOf(subCounty) * 200);
}
