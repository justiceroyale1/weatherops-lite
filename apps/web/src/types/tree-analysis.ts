export interface TreeAnalysisResponse {
  id: string;
  totalTreeCount?: number;
  treeDensityPerAcre?: number;
  canopyCoveragePct?: number;
  confidenceScore?: number;
  speciesGuess?: string;
  healthBreakdown?: {
    healthy?: number;
    moderate?: number;
    poor?: number;
    unknown?: number;
  };
  originalImageUrl?: string;
  overlayImageUrl?: string;
  observations: string[];
  recommendations: string[];
  createdAt: string;
}

export interface TreeAnalysisMetadata {
  locationName?: string;
  landAcres?: number;
  notes?: string;
}
