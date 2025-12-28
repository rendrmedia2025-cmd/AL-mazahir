/**
 * Predictive Analytics for Lead Conversion
 * Machine learning-based conversion probability prediction
 * Requirements: 3.4, 3.8
 */

import { EnhancedLead } from '@/lib/types/enterprise';
import { LeadScoreBreakdown, ConversionPrediction } from './lead-scoring';

export interface PredictiveModel {
  id: string;
  name: string;
  version: string;
  type: 'conversion_probability' | 'deal_value' | 'time_to_close' | 'churn_risk';
  accuracy: number;
  trainingDataSize: number;
  lastTrained: Date;
  features: ModelFeature[];
  weights: Record<string, number>;
  isActive: boolean;
}

export interface ModelFeature {
  name: string;
  type: 'categorical' | 'numerical' | 'boolean';
  importance: number;
  description: string;
}

export interface PredictionResult {
  modelId: string;
  prediction: number;
  confidence: number;
  factors: {
    positive: Array<{ factor: string; impact: number; description: string }>;
    negative: Array<{ factor: string; impact: number; description: string }>;
  };
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface HistoricalData {
  leadId: string;
  features: Record<string, any>;
  outcome: 'converted' | 'lost' | 'ongoing';
  conversionValue?: number;
  timeToConversion?: number; // days
  conversionDate?: Date;
  lostReason?: string;
}

class PredictiveAnalyticsEngine {
  private models: Map<string, PredictiveModel> = new Map();
  private historicalData: HistoricalData[] = [];

  constructor() {
    this.initializeDefaultModels();
    this.loadHistoricalData();
  }

  private initializeDefaultModels(): void {
    // Conversion Probability Model
    const conversionModel: PredictiveModel = {
      id: 'conversion-probability-v1',
      name: 'Lead Conversion Probability',
      version: '1.0.0',
      typ