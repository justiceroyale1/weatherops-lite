export interface TreeAnalysisFile {
  buffer: Buffer;
  contentType: string;
  filename: string;
  size: number;
}

export interface TreeAnalysisInput {
  file: TreeAnalysisFile;
  locationName?: string;
  landAcres?: number;
  notes?: string;
}

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
