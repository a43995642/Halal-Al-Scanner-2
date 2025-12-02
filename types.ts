export enum HalalStatus {
  HALAL = 'HALAL',
  HARAM = 'HARAM',
  DOUBTFUL = 'DOUBTFUL',
  NON_FOOD = 'NON_FOOD'
}

export interface IngredientDetail {
  name: string;
  status: HalalStatus;
}

export interface ScanResult {
  status: HalalStatus;
  reason: string;
  ingredientsDetected: IngredientDetail[];
  confidence?: number;
}

export interface ScanHistoryItem {
  id: string;
  date: number;
  result: ScanResult;
  thumbnail?: string;
}

export enum CameraState {
  CLOSED,
  OPEN,
  CAPTURING
}