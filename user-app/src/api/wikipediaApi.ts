// Wikipedia API integration for plant information

export interface WikipediaPlantData {
    title: string;
    extract: string;
    url: string;
    thumbnail: string;
    description: string;
    source: 'species' | 'genus' | 'genus_image' | 'not_found';
    found: boolean;
}

/**
 * Clean scientific name by removing cultivar names and extra info
 */
function cleanScientificName(name: string): string {
    let cleaned = name.trim();

    // Remove cultivar names (text in single quotes)
    if (cleaned.includes("'")) {
        cleaned = cleaned.split("'")[0].trim();
    }

    // Remove hybrid markers
    if (cleaned.includes(" x ")) {
        cleaned = cleaned.split(" x ")[0].trim();
    }

    // Remove variety/subspecies markers
    const markers = [" var. ", " subsp. ", " sub. ", " forma "];
    for (const marker of markers) {
        if (cleaned.includes(marker)) {
            cleaned = cleaned.split(marker)[0].trim();
        }
    }

    // Handle "unknown" or "sp." cases - just use genus
    if (cleaned.toLowerCase().includes("unknown") || cleaned.includes(" sp.") || cleaned.includes(" sp ")) {
        const parts = cleaned.split(" ");
        cleaned = parts.length > 0 ? parts[0] : cleaned;
    }

    return cleaned;
}

/**
 * Fetch Wikipedia data for a plant, ensuring we always get an image
 * Falls back to genus if species doesn't have a thumbnail
 */
export async function getWikipediaPlantData(scientificName: string): Promise<WikipediaPlantData> {
    const baseUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/";
    const headers = {
        'User-Agent': 'PlantGameBot/1.0 (Educational Project)',
        'Accept': 'application/json'
    };

    const cleaned = cleanScientificName(scientificName);

    try {
        // Try full scientific name first
        const encodedName = encodeURIComponent(cleaned);
        const response = await fetch(`${baseUrl}${encodedName}`, { headers });

        if (response.ok) {
            const data = await response.json();
            const result: WikipediaPlantData = {
                title: data.title || '',
                extract: data.extract || '',
                url: data.content_urls?.desktop?.page || '',
                thumbnail: data.thumbnail?.source || '',
                description: data.description || '',
                source: 'species',
                found: true
            };

            // If we got data but no image, try genus
            if (result.title && !result.thumbnail) {
                const genus = cleaned.split(" ")[0];
                if (genus && genus !== cleaned) {
                    const genusResponse = await fetch(`${baseUrl}${encodeURIComponent(genus)}`, { headers });
                    if (genusResponse.ok) {
                        const genusData = await genusResponse.json();
                        if (genusData.thumbnail?.source) {
                            result.thumbnail = genusData.thumbnail.source;
                            result.source = 'genus_image';
                        }
                    }
                }
            }

            return result;
        }

        // If species not found, try genus
        if (response.status === 404) {
            const genus = cleaned.split(" ")[0];
            if (genus && genus !== cleaned) {
                const genusResponse = await fetch(`${baseUrl}${encodeURIComponent(genus)}`, { headers });
                if (genusResponse.ok) {
                    const genusData = await genusResponse.json();
                    return {
                        title: genusData.title || '',
                        extract: genusData.extract || '',
                        url: genusData.content_urls?.desktop?.page || '',
                        thumbnail: genusData.thumbnail?.source || '',
                        description: genusData.description || '',
                        source: 'genus',
                        found: true
                    };
                }
            }
        }

        // Not found
        return {
            title: '',
            extract: '',
            url: '',
            thumbnail: '',
            description: '',
            source: 'not_found',
            found: false
        };

    } catch (error) {
        console.error('Error fetching Wikipedia data:', error);
        return {
            title: '',
            extract: '',
            url: '',
            thumbnail: '',
            description: '',
            source: 'not_found',
            found: false
        };
    }
}
