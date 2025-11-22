import type { Mission, DomeName } from '../types';

/**
 * Static mission data for all three domes
 * Each mission includes a riddle, scientific name, and reference image
 */
export const MISSIONS: Record<DomeName, Mission[]> = {
  'Tropical Dome': [
    {
      riddle: "I am known as the 'Swiss Cheese Plant' with holes in my leaves that make me look like I've been nibbled on. My delicious fruit gives me my scientific name!",
      scientificName: "Monstera deliciosa",
      referenceImage: "/images/monstera-deliciosa.jpg"
    },
    {
      riddle: "My leaves are shaped like elephant ears and I have striking zebra-striped stems. I'm a threatened species that adds a wild touch to any tropical garden.",
      scientificName: "Alocasia zebrina",
      referenceImage: "/images/alocasia-zebrina.jpg"
    },
    {
      riddle: "I'm a climbing orchid that produces one of the world's most beloved flavors. My pods are used in desserts and perfumes around the globe!",
      scientificName: "Vanilla planifolia",
      referenceImage: "/images/vanilla-planifolia.jpg"
    }
  ],
  'Desert Dome': [
    {
      riddle: "I'm the iconic symbol of the American Southwest, standing tall with arms reaching toward the sky. I can live for hundreds of years and grow over 40 feet tall!",
      scientificName: "Carnegiea gigantea",
      referenceImage: "/images/carnegiea-gigantea.jpg"
    },
    {
      riddle: "I'm the plant that gives you tequila! My blue-green leaves form a stunning rosette, and I've been cultivated in Mexico for centuries.",
      scientificName: "Agave tequilana",
      referenceImage: "/images/agave-tequilana.jpg"
    },
    {
      riddle: "My white hair covers my body like a fluffy coat, protecting me from the harsh desert sun. I'm critically endangered in the wild!",
      scientificName: "Agave albopilosa",
      referenceImage: "/images/agave-albopilosa.jpg"
    }
  ],
  'Show Dome': [
    {
      riddle: "I'm a stunning bromeliad with a flaming red or orange flower spike that looks like a painted feather. My colorful display can last for months!",
      scientificName: "Vriesea splendens",
      referenceImage: "/images/vriesea-splendens.jpg"
    },
    {
      riddle: "My glossy green leaves are so tough and resilient that I earned the nickname 'Cast Iron Plant'. I can survive in the darkest corners where other plants fail.",
      scientificName: "Aspidistra elatior",
      referenceImage: "/images/aspidistra-elatior.jpg"
    },
    {
      riddle: "I'm a fragrant citrus with finger-like segments that look like a hand reaching out. I'm often used as an offering in Buddhist temples and my zest adds incredible flavor to dishes.",
      scientificName: "Citrus medica",
      referenceImage: "/images/citrus-medica.jpg"
    }
  ]
};

/**
 * Get a mission by dome name and index
 * @param domeName - The name of the dome
 * @param index - The mission index (0-based)
 * @returns The mission object or null if not found
 */
export function getMission(domeName: DomeName, index: number): Mission | null {
  const missions = MISSIONS[domeName];
  if (!missions || index < 0 || index >= missions.length) {
    return null;
  }
  return missions[index];
}

/**
 * Get the total number of missions for a dome
 * @param domeName - The name of the dome
 * @returns The number of missions available
 */
export function getMissionCount(domeName: DomeName): number {
  return MISSIONS[domeName]?.length || 0;
}
