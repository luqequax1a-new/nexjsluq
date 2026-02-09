import trLocations from "@/lib/tr_locations.json";

type TrLocations = {
    provinces: string[];
    districts: Record<string, string[]>;
};

const data = trLocations as unknown as TrLocations;

export const TURKEY_PROVINCES = [...data.provinces].sort((a, b) => a.localeCompare(b, 'tr'));

export const TURKEY_DISTRICTS: Record<string, string[]> = Object.fromEntries(
    Object.entries(data.districts).map(([city, dists]) => [city, [...dists].sort((a, b) => a.localeCompare(b, 'tr'))])
);
