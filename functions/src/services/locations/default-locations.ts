import type { CreateLocationInput } from "../../schemas";

export interface DefaultLocation extends CreateLocationInput {
  id: string;
}

export const defaultLocations: DefaultLocation[] = [
  {
    id: "demo-nairobi-kenya",
    name: "Nairobi, Kenya",
    type: "farm",
    lat: -1.286389,
    lon: 36.817223,
  },
  {
    id: "demo-abuja-nigeria",
    name: "Abuja, Nigeria",
    type: "farm",
    lat: 9.076479,
    lon: 7.398574,
  },
];
