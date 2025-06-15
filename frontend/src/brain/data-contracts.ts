/** AiChatRequest */
export interface AiChatRequest {
  /** Message */
  message: string;
  /** History */
  history: ChatMessageInput[];
  /** Outfit Stage Index */
  outfit_stage_index?: number | null;
}

/** AiChatResponse */
export interface AiChatResponse {
  /** Reply */
  reply: string;
}

/** ChatMessageInput */
export interface ChatMessageInput {
  /** Role */
  role: string;
  /** Content */
  content: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type SendChatMessageData = AiChatResponse;

export type SendChatMessageError = HTTPValidationError;
